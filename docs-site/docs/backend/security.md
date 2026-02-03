# Backend Security

This document describes the security features implemented in the MSM Car Booking backend.

## Overview

The backend implements multiple layers of security to protect against common attacks and ensure data integrity:

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Security Layers                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │  Nginx   │─>│  Helmet  │─>│Throttler │─>│ JWT Auth │─>│ Roles  ││
│  │  Rate    │  │  Headers │  │  Guard   │  │  Guard   │  │ Guard  ││
│  │  Limit   │  │          │  │          │  │          │  │        ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘│
│       │             │             │             │             │     │
│       ▼             ▼             ▼             ▼             ▼     │
│  10 req/s      CSP, XSS,    100 req/min   Validates      Checks    │
│  per IP        HSTS, etc.   per IP        JWT token      @Roles()  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. HTTP Security Headers (Helmet)

The backend uses [Helmet](https://helmetjs.github.io/) middleware to set secure HTTP headers.

### Implementation

```typescript
// src/main.ts
import helmet from 'helmet';

app.use(helmet());
```

### Headers Applied

| Header | Purpose |
|--------|---------|
| `Content-Security-Policy` | Prevents XSS attacks by controlling resource loading |
| `X-Content-Type-Options` | Prevents MIME type sniffing |
| `X-Frame-Options` | Prevents clickjacking attacks |
| `Strict-Transport-Security` | Enforces HTTPS connections |
| `X-XSS-Protection` | Legacy XSS protection for older browsers |
| `Referrer-Policy` | Controls referrer information leakage |

---

## 2. Rate Limiting

The backend implements two layers of rate limiting for defense in depth.

### Application-Level Rate Limiting

Uses `@nestjs/throttler` for fine-grained control:

```typescript
// src/app.module.ts
ThrottlerModule.forRoot([{
  ttl: 60000,     // 1 minute window
  limit: 100,     // 100 requests per window
}])

// src/main.ts
app.useGlobalGuards(app.get(ThrottlerGuard));
```

**Configuration:**
- **TTL:** 60,000ms (1 minute)
- **Limit:** 100 requests per IP per minute
- **Scope:** Global (applies to all endpoints)

### Nginx-Level Rate Limiting

Additional rate limiting at the reverse proxy:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

**Configuration:**
- **Rate:** 10 requests per second per IP
- **Burst:** 20 requests allowed in burst
- **Scope:** API endpoints only

### Why Two Layers?

| Layer | Purpose |
|-------|---------|
| **Nginx** | Stops attacks before they reach the application |
| **Application** | Provides per-endpoint throttling control |

---

## 3. JWT Authentication

### Configuration

JWT authentication is enforced with production-safe defaults:

```typescript
// src/config/app.config.ts
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (!secret && nodeEnv === 'production') {
    throw new Error(
      'JWT_SECRET environment variable must be set in production',
    );
  }
  return secret || 'dev-secret-key-not-for-production';
};
```

### Production Requirements

| Environment | JWT_SECRET Required | Behavior if Missing |
|-------------|---------------------|---------------------|
| `production` | **Yes** | Application fails to start |
| `development` | No | Uses insecure default (dev only) |
| `test` | No | Uses insecure default |

### Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "EMPLOYEE",
  "iat": 1234567890,
  "exp": 1235172690
}
```

### Token Expiration

- **Access Token:** 7 days
- **Refresh Token:** Not implemented (stateless JWT)

---

## 4. WebSocket Authentication

WebSocket connections require JWT authentication with **no fallback**.

### Implementation

```typescript
// src/modules/chat/chat.gateway.ts
handleConnection(client: AuthenticatedSocket) {
  const auth = client.handshake.auth as HandshakeAuth;
  const token = auth?.token ||
    client.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    this.logger.warn('Connection rejected: No token provided');
    client.disconnect();
    return;
  }

  try {
    const payload = this.jwtService.verify<JwtPayload>(token);
    client.user = { id: payload.sub, email: payload.email };
    void client.join(`user:${payload.sub}`);
  } catch {
    this.logger.warn('Connection rejected: Invalid token');
    client.disconnect();
    return;
  }
}
```

### Client Connection

```typescript
// Frontend WebSocket connection
const socket = io('/chat', {
  auth: {
    token: accessToken,
  },
});

// Or via header
const socket = io('/chat', {
  extraHeaders: {
    authorization: `Bearer ${accessToken}`,
  },
});
```

### Security Guarantees

- All WebSocket events require authenticated connection
- Invalid tokens result in immediate disconnection
- No anonymous or userId-based fallback authentication

---

## 5. CORS Configuration

Cross-Origin Resource Sharing is configured via environment variables:

```typescript
// src/main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});

// src/modules/chat/chat.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
```

### Configuration

| Environment Variable | Default | Production Example |
|---------------------|---------|-------------------|
| `CORS_ORIGIN` | `http://localhost:3000` | `https://app.msm.com` |

### Security Notes

- **Never use wildcard (`*`)** in production
- Credentials mode requires explicit origin
- WebSocket gateway uses same CORS configuration

---

## 6. Role-Based Access Control (RBAC)

### Available Roles

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full system access, user management, configuration |
| **PIC** | Dispatch operations, monitoring, booking management |
| **GA** | External vehicle rental management |
| **DRIVER** | Trip execution, odometer, expense tracking |
| **EMPLOYEE** | Create bookings, view own history |

### Guard Implementation

```typescript
// Controller endpoint protection
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.PIC)
@Get('admin/bookings')
async getAdminBookings() {
  // Only ADMIN and PIC can access
}
```

### Resource-Level Authorization

Some resources have additional authorization checks:

```typescript
// src/modules/approvals/approvals.controller.ts
async findOne(id: string, req: { user: { id: string; role: UserRole } }) {
  const approval = await this.approvalsService.findById(id);

  const isAuthorized =
    approval.approverId === req.user.id ||
    approval.requesterId === req.user.id ||
    req.user.role === UserRole.ADMIN;

  if (!isAuthorized) {
    throw new ForbiddenException('Not authorized to view this approval');
  }

  return approval;
}
```

---

## 7. Database Security

### Parameterized Queries

All database queries use TypeORM's parameterized queries to prevent SQL injection:

```typescript
// Safe - parameterized
const user = await this.userRepository.findOne({
  where: { email: userEmail },
});

// TypeORM generates:
// SELECT * FROM users WHERE email = $1
```

### Atomic Operations

Booking code generation uses PostgreSQL's `INSERT...ON CONFLICT` for thread-safe operations:

```typescript
const result = await manager.query<{ last_seq: number }[]>(
  `INSERT INTO booking_sequences (date_key, last_seq)
   VALUES ($1, 1)
   ON CONFLICT (date_key)
   DO UPDATE SET last_seq = booking_sequences.last_seq + 1
   RETURNING last_seq`,
  [dateKey],
);
```

### Transactions

Critical operations use database transactions:

```typescript
async createBooking(data: CreateBookingData): Promise<Booking> {
  return this.dataSource.transaction(async (manager: EntityManager) => {
    // All operations in this block are atomic
    const booking = manager.create(Booking, { ... });
    await manager.save(booking);
    await this.approvalsService.createApprovalWithManager(..., manager);
    return booking;
  });
}
```

---

## 8. Input Validation

All DTOs use `class-validator` for input validation:

```typescript
// src/modules/chat/dto/create-message.dto.ts
export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Message cannot be empty' })
  @MaxLength(5000, { message: 'Message cannot exceed 5000 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  content: string;
}
```

### Validation Features

- **Type validation:** Ensures correct data types
- **Length limits:** Prevents buffer overflow attacks
- **Transformation:** Sanitizes input (trim whitespace)
- **Global validation pipe:** Applied to all endpoints

---

## Security Checklist

### Production Deployment

- [ ] Set `JWT_SECRET` environment variable (minimum 64 characters)
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS via Nginx
- [ ] Configure Nginx rate limiting
- [ ] Review and restrict database access

### Development

- [ ] Never commit `.env` files
- [ ] Use different secrets for each environment
- [ ] Test authentication flows regularly

---

## Related Documentation

- [Environment Variables Reference](/docs/devops/environment-variables)
- [DevOps & Deployment](/docs/devops)
- [System Architecture](/docs/architecture)
