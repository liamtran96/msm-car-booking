---
id: api-documentation
title: API Documentation
sidebar_position: 4
---

# API Documentation

Complete REST API reference for the MSM Car Booking System.

## Base URL

```
Production: https://api.msm-car-booking.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication

All endpoints (except login) require a valid JWT token. The token is sent as an httpOnly cookie (web) or via `Authorization: Bearer <token>` header (mobile/API testing).

---

## Auth Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | User login | No |
| POST | `/auth/logout` | User logout | Yes |
| GET | `/auth/me` | Get current user profile | Yes |

<!-- TODO: Add request/response examples -->

---

## Users Module

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/users` | List all users | Yes | ADMIN, PIC |
| GET | `/users/:id` | Get user by ID | Yes | ADMIN, PIC |
| POST | `/users` | Create user | Yes | ADMIN |
| PATCH | `/users/:id` | Update user | Yes | ADMIN |
| DELETE | `/users/:id` | Soft delete user | Yes | ADMIN |

<!-- TODO: Add request/response examples -->

---

## Vehicles Module

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/vehicles` | List all vehicles | Yes | ADMIN, PIC |
| GET | `/vehicles/:id` | Get vehicle by ID | Yes | ADMIN, PIC |
| POST | `/vehicles` | Create vehicle | Yes | ADMIN |
| PATCH | `/vehicles/:id` | Update vehicle | Yes | ADMIN |
| DELETE | `/vehicles/:id` | Soft delete vehicle | Yes | ADMIN |

<!-- TODO: Add request/response examples -->

---

## Bookings Module

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/bookings` | List bookings | Yes | ALL |
| GET | `/bookings/:id` | Get booking by ID | Yes | ALL |
| POST | `/bookings` | Create booking | Yes | EMPLOYEE, PIC, ADMIN |
| PATCH | `/bookings/:id` | Update booking | Yes | PIC, ADMIN |
| PATCH | `/bookings/:id/status` | Update booking status | Yes | PIC, ADMIN, DRIVER |
| DELETE | `/bookings/:id` | Cancel booking | Yes | EMPLOYEE, PIC, ADMIN |

<!-- TODO: Add request/response examples, status transition rules -->

---

## Departments Module

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/departments` | List departments | Yes | ADMIN, PIC |
| GET | `/departments/:id` | Get department by ID | Yes | ADMIN, PIC |
| POST | `/departments` | Create department | Yes | ADMIN |
| PATCH | `/departments/:id` | Update department | Yes | ADMIN |
| DELETE | `/departments/:id` | Soft delete department | Yes | ADMIN |

<!-- TODO: Add request/response examples -->

---

## Notifications Module

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/notifications` | List user notifications | Yes | ALL |
| PATCH | `/notifications/:id/read` | Mark as read | Yes | ALL |

<!-- TODO: Add request/response examples -->

---

## Approvals Module

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/approvals` | List pending approvals | Yes | ADMIN, PIC |
| GET | `/approvals/:id` | Get approval by ID | Yes | ADMIN, PIC |
| PATCH | `/approvals/:id` | Approve or reject | Yes | ADMIN, PIC |

<!-- TODO: Add request/response examples, approval workflow details -->

---

## External Vehicles Module

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/external-vehicles` | List external bookings | Yes | GA, ADMIN |
| POST | `/external-vehicles` | Create external booking | Yes | GA, ADMIN |
| PATCH | `/external-vehicles/:id` | Update external booking | Yes | GA, ADMIN |

<!-- TODO: Add request/response examples -->

---

## GPS Module

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/gps/vehicles/:id/location` | Get vehicle location | Yes | ADMIN, PIC |
| GET | `/gps/vehicles/:id/history` | Get route history | Yes | ADMIN, PIC |
| POST | `/gps/vehicles/:id/location` | Record GPS position | Yes | DRIVER |

<!-- TODO: Add request/response examples -->

---

## Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    }
  ]
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 409 | Conflict - Duplicate resource |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Application level:** 100 requests/minute per IP
- **Nginx level:** 10 requests/second per IP

Exceeded limits return `429 Too Many Requests`.
