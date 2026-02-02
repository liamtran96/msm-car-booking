# Tài liệu Backend

Backend API dựa trên NestJS cho hệ thống MSM Car Booking.

## Kiến trúc

- **Framework:** NestJS 10 với TypeScript
- **Cơ sở dữ liệu:** PostgreSQL 18 với TypeORM
- **Xác thực:** JWT với Passport.js
- **Tài liệu API:** Swagger/OpenAPI
- **Mẫu kiến trúc:** Modular, domain-driven

## Mục lục Tài liệu

### Cơ sở dữ liệu

- **[Thiết lập & Migration CSDL](./database-setup.md)** - Khởi tạo cơ sở dữ liệu cho môi trường phát triển và production, quy trình migration, và các thực hành tốt nhất

### Thuật toán

- **[Thuật toán Ghép xe](./vehicle-matching-algorithm.md)** - Tự động phân công xe-tài xế với điểm số có trọng số

## Liên kết Nhanh

### Phát triển

```bash
# Khởi động server phát triển
cd backend
pnpm start:dev

# Tạo migration
pnpm migration:generate src/database/migrations/TenMigration

# Chạy tests
pnpm test

# Build cho production
pnpm build
```

### Các Module Chính

| Module | Mô tả | Đường dẫn |
|--------|-------|-----------|
| **Auth** | Xác thực JWT, đăng nhập, SSO | `src/modules/auth/` |
| **Users** | Quản lý người dùng, RBAC, ca làm tài xế | `src/modules/users/` |
| **Departments** | Đơn vị tổ chức | `src/modules/departments/` |
| **Vehicles** | Quản lý đội xe, theo dõi GPS | `src/modules/vehicles/` |
| **Bookings** | Đặt chỗ chuyến đi, đa điểm dừng | `src/modules/bookings/` |
| **Notifications** | Thông báo đa kênh | `src/modules/notifications/` |

## Tài liệu Liên quan

- [DevOps & Triển khai](../devops/index.md)
- [Luồng Nghiệp vụ](../business-flows.md)
- [Quy trình Hệ thống](../system-workflows.md)
