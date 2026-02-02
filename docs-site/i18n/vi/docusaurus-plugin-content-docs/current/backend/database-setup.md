# Thiết lập & Migration Cơ sở dữ liệu

Hướng dẫn này bao gồm việc khởi tạo cơ sở dữ liệu và quản lý migration cho cả môi trường phát triển và production.

## Tổng quan

Hệ thống MSM Car Booking sử dụng:
- **Cơ sở dữ liệu:** PostgreSQL 18
- **ORM:** TypeORM
- **Quản lý Schema:** Dựa trên Entity với migrations

### Nguyên tắc Chính

| Môi trường | Quản lý Schema | DB_SYNCHRONIZE | An toàn |
|------------|----------------|----------------|---------|
| **Phát triển** | Migrations | `false` | An toàn, có phiên bản, đồng nhất với production |
| **Production** | Chỉ migrations | `false` | An toàn, có phiên bản, có thể rollback |

---

## Thiết lập Phát triển

### Bắt đầu Nhanh

**1. Cấu hình Môi trường**

Tạo file `backend/.env`:

```env
# Cơ sở dữ liệu
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=msm_car_booking
DB_SYNCHRONIZE=false   # ← Sử dụng migrations cho thay đổi schema
DB_LOGGING=true        # ← Xem các câu SQL trong console
```

**2. Khởi động PostgreSQL**

```bash
docker compose up -d postgres
```

**3. Chạy Migrations**

```bash
cd backend
pnpm migration:run
```

**4. Khởi động Backend**

```bash
pnpm start:dev
```

✅ **Schema được quản lý thông qua migrations!**

### Cách Phát triển Dựa trên Migration Hoạt động

Khi `DB_SYNCHRONIZE=false`:

1. Chỉnh sửa file entity để định nghĩa schema mong muốn
2. Tạo migration từ những thay đổi entity
3. Xem lại SQL được tạo trong file migration
4. Áp dụng migration để cập nhật schema cơ sở dữ liệu
5. Tất cả môi trường sử dụng cùng migrations có phiên bản

**Lợi ích:**
- ✅ Quản lý schema đồng nhất trên tất cả môi trường
- ✅ Các thay đổi cơ sở dữ liệu có kiểm soát phiên bản
- ✅ Migrations có thể rollback
- ✅ Cập nhật schema an toàn, có thể dự đoán
- ✅ Không có thay đổi schema bất ngờ khi khởi động lại

### Thực hiện Thay đổi Schema

**1. Chỉnh sửa File Entity:**

```typescript
// backend/src/modules/users/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // Thêm trường mới
  @Column({ nullable: true })
  phoneNumber: string;
}
```

**2. Tạo Migration:**

```bash
pnpm migration:generate src/database/migrations/ThemSoDienThoaiVaoUser
```

**3. Xem lại Migration Được tạo:**

```bash
cat src/database/migrations/TIMESTAMP-ThemSoDienThoaiVaoUser.ts
```

**4. Áp dụng Migration:**

```bash
pnpm migration:run
```

✅ **Cột được thêm an toàn với migration có phiên bản!**

---

## Thiết lập Production

### Thiết lập Cơ sở dữ liệu Ban đầu

**1. Tạo Cơ sở dữ liệu và User**

:::note Tùy theo Nền tảng
Lệnh khác nhau tùy theo hệ điều hành và phương pháp cài đặt PostgreSQL của bạn.
:::

**Linux VPS (Production):**

```bash
sudo -u postgres psql << EOF
CREATE DATABASE msm_car_booking;
CREATE USER msm_app_user WITH ENCRYPTED PASSWORD 'MAT_KHAU_AN_TOAN';
GRANT ALL PRIVILEGES ON DATABASE msm_car_booking TO msm_app_user;
\c msm_car_booking
GRANT ALL ON SCHEMA public TO msm_app_user;
EOF
```

**macOS/Windows với Docker:**

Chạy các lệnh này từng bước:

```bash
# Bước 1: Tạo cơ sở dữ liệu
docker exec -i msm_postgres psql -U postgres -c "CREATE DATABASE msm_car_booking;"

# Bước 2: Tạo user ứng dụng
docker exec -i msm_postgres psql -U postgres -c "CREATE USER msm_app_user WITH ENCRYPTED PASSWORD 'MAT_KHAU_AN_TOAN';"

# Bước 3: Cấp quyền cơ sở dữ liệu
docker exec -i msm_postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE msm_car_booking TO msm_app_user;"

# Bước 4: Cấp quyền schema
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "GRANT ALL ON SCHEMA public TO msm_app_user;"

# Bước 5: Cấp quyền mặc định cho các bảng tương lai
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO msm_app_user;"

# Bước 6: Cấp quyền mặc định cho sequences
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO msm_app_user;"
```

**2. Cấu hình Môi trường**

Tạo file `backend/.env.production`:

```env
# Ứng dụng
NODE_ENV=production

# Cơ sở dữ liệu
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=msm_app_user
DB_PASSWORD=mat_khau_an_toan_cua_ban
DB_NAME=msm_car_booking
DB_SYNCHRONIZE=false   # ← QUAN TRỌNG: Phải là false trong production!
DB_LOGGING=false       # ← Không log queries trong production
```

**3. Áp dụng Migrations**

```bash
cd backend
export $(cat .env.production | xargs)
pnpm migration:run
```

**4. Kiểm tra Các Bảng**

```bash
psql -U msm_app_user -d msm_car_booking -c "\dt"
```

Kết quả mong đợi: 19 bảng được tạo

---

## Quy trình Migration

### Quy trình Phát triển

**1. Thay đổi Entity**

```typescript
// Thêm trường mới vào entity
@Column({ nullable: true })
newField: string;
```

**2. Tạo Migration**

```bash
# Tạo migration từ thay đổi entity
pnpm migration:generate src/database/migrations/ThemTruongMoiVaoUser

# Xem lại SQL được tạo
cat src/database/migrations/TIMESTAMP-ThemTruongMoiVaoUser.ts
```

**3. Kiểm tra Migration**

```bash
# Áp dụng migration
pnpm migration:run

# Xác minh cập nhật schema
psql -d msm_car_booking -c "\d users"

# Kiểm tra rollback nếu cần
pnpm migration:revert

# Áp dụng lại
pnpm migration:run
```

**4. Cập nhật Script Seed**

Nếu migration ảnh hưởng đến các bảng có seed, cập nhật các file seed trong `src/database/seeds/` để bao gồm trường mới.

**5. Kiểm tra với Seeds**

```bash
# Reset cơ sở dữ liệu và chạy seeds
pnpm db:reset
```

**6. Commit File Migration**

```bash
git add src/database/migrations/ src/database/seeds/
git commit -m "feat: thêm trường mới vào user entity"
```

### Triển khai Production

**Trước khi Triển khai:**

1. ✅ Backup cơ sở dữ liệu
2. ✅ Kiểm tra migration trên local
3. ✅ Xem lại SQL được tạo
4. ✅ Lên kế hoạch rollback nếu cần

**Quy trình Triển khai:**

```bash
# SSH đến server production
ssh user@production-server

cd /path/to/backend

# 1. Backup cơ sở dữ liệu
pg_dump -U msm_app_user msm_car_booking > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Pull code mới nhất
git pull origin main

# 3. Cài đặt dependencies
pnpm install --prod

# 4. Chạy migrations
export $(cat .env.production | xargs)
pnpm migration:run

# 5. Build và khởi động lại
pnpm build
pm2 restart msm-backend
```

**Xác minh Migration:**

```bash
# Kiểm tra migration đã được áp dụng
psql -U msm_app_user -d msm_car_booking -c "
SELECT * FROM typeorm_migrations ORDER BY id DESC LIMIT 5;
"
```

---

## Migrations Hiện tại

### 1738394400000-AddUserModuleIndexesAndConstraints

**Trạng thái:** ✅ Đã áp dụng
**Mục đích:** Thêm indexes hiệu suất và ràng buộc toàn vẹn dữ liệu

**Bao gồm:**

#### Indexes Hiệu suất (13 tổng)

**Bảng Users (8 indexes):**
- `idx_users_role` - Lọc theo role
- `idx_users_is_active` - Lọc active/inactive
- `idx_users_role_active` - Composite role + status
- `idx_users_user_segment` - Queries theo user segment
- `idx_users_department_id` - Lọc theo department
- `idx_users_fullname_trgm` - Full-text search trên tên
- `idx_users_email_trgm` - Full-text search trên email
- `idx_users_created_at_desc` - Sắp xếp phân trang

**Bảng Driver_shifts (5 indexes):**
- `idx_driver_shifts_shift_date` - Queries theo ngày
- `idx_driver_shifts_status` - Lọc theo status
- `idx_driver_shifts_date_status` - Composite ngày + status
- `idx_driver_shifts_availability` - Tối ưu tìm kiếm availability
- `idx_driver_shifts_date_time_asc` - Sắp xếp theo thời gian

#### Toàn vẹn Dữ liệu

**Sửa Foreign Key:**
- `users.department_id` → `ON DELETE SET NULL`

**Ràng buộc:**
- `chk_shift_time_valid` - Đảm bảo end_time > start_time

**Triggers:**
- `trg_validate_shift_status_transition` - State machine cho status
- `trg_users_updated_at` - Tự động cập nhật timestamp
- `trg_driver_shifts_updated_at` - Tự động cập nhật timestamp

**Tác động Hiệu suất:**
- Trước: Sequential scans trên queries có lọc
- Sau: Index scans (~nhanh hơn 40 lần)

---

## Schema Cơ sở dữ liệu

### Các Bảng Chính

| Bảng | Mô tả | Tính năng Chính |
|------|-------|-----------------|
| `departments` | Đơn vị tổ chức | Theo dõi cost center |
| `users` | Người dùng hệ thống | RBAC với 5 roles |
| `driver_shifts` | Lịch trình tài xế | Ghép availability |
| `vehicles` | Quản lý đội xe | Theo dõi GPS |
| `bookings` | Đặt chỗ chuyến đi | Hỗ trợ đa điểm dừng |
| `trip_stops` | Điểm dừng booking | Điểm đón/trả |
| `trip_expenses` | Chi phí tài xế | Upload biên lai |
| `gps_locations` | Theo dõi thời gian thực | Dữ liệu time-series |
| `notifications` | Thông báo đa kênh | APP_PUSH, SMS, CALL |

**Tổng cộng:** 19 bảng

### Vị trí Entity

Entities là nguồn truth cho schema:

```
backend/src/modules/
├── users/entities/
│   ├── user.entity.ts              → bảng users
│   └── driver-shift.entity.ts      → bảng driver_shifts
├── departments/entities/
│   └── department.entity.ts        → bảng departments
├── vehicles/entities/
│   ├── vehicle.entity.ts           → bảng vehicles
│   └── km-quota.entity.ts          → bảng km_quotas
└── bookings/entities/
    ├── booking.entity.ts           → bảng bookings
    └── trip-stop.entity.ts         → bảng trip_stops
```

---

## Lệnh Migration

### Các Thao tác Thường gặp

```bash
# Tạo migration từ thay đổi entity
pnpm migration:generate src/database/migrations/TenMigration

# Tạo migration rỗng (cho SQL thủ công)
pnpm migration:create src/database/migrations/TenMigration

# Áp dụng migrations đang chờ
pnpm migration:run

# Revert migration cuối
pnpm migration:revert

# Hiển thị trạng thái migration
pnpm migration:show

# Sync schema (chỉ development)
pnpm schema:sync

# Drop tất cả bảng (NGUY HIỂM!)
pnpm schema:drop

# Reset cơ sở dữ liệu (drop + chạy migrations)
pnpm db:reset
```

### Lệnh Xác minh

```bash
# Liệt kê tất cả bảng
psql -d msm_car_booking -c "\dt"

# Liệt kê indexes trên bảng cụ thể
psql -d msm_car_booking -c "
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';
"

# Kiểm tra triggers
psql -d msm_car_booking -c "
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
"

# Xem lịch sử migration
psql -d msm_car_booking -c "
SELECT * FROM typeorm_migrations ORDER BY id DESC;
"
```

---

## Xử lý Sự cố

### Migration Thất bại: "Column already exists"

**Nguyên nhân:** Bảng được tạo bởi auto-sync, migration cố tạo lại.

**Khắc phục:**

```bash
# Cách 1: Đánh dấu migration đã thực thi
psql -d msm_car_booking -c "
INSERT INTO typeorm_migrations (timestamp, name)
VALUES (1738394400000, 'TenMigration');
"

# Cách 2: Drop và tạo lại (nếu không có dữ liệu)
psql -d msm_car_booking -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
pnpm migration:run
```

### Migration Không Được Áp dụng

**Kiểm tra:**

1. File migration tồn tại trong `src/database/migrations/`
2. Migration chưa được chạy (kiểm tra bảng `typeorm_migrations`)
3. Kết nối cơ sở dữ liệu thành công

**Debug:**

```bash
# Hiển thị trạng thái migration
pnpm migration:show

# Kiểm tra lịch sử migration
psql -d msm_car_booking -c "SELECT * FROM typeorm_migrations ORDER BY id DESC;"

# Bật query logging
DB_LOGGING=true pnpm migration:run
```

### Kết nối Cơ sở dữ liệu Thất bại

**Nguyên nhân phổ biến:**

1. PostgreSQL không chạy
2. Thông tin xác thực sai trong `.env`
3. Xung đột port (sử dụng port khác)

**Kiểm tra:**

```bash
# Test kết nối
psql -h localhost -U postgres -d msm_car_booking -c "SELECT 1;"

# Kiểm tra PostgreSQL đang chạy
docker compose ps postgres

# Xem logs PostgreSQL
docker compose logs postgres
```

---

## Thực hành Tốt nhất

### Phát triển

✅ **NÊN:**
- Sử dụng migrations cho tất cả thay đổi schema
- Tạo migrations sau khi chỉnh sửa entities
- Kiểm tra migrations với `run` và `revert`
- Cập nhật scripts seed khi schema thay đổi
- Giữ entities là nguồn truth

❌ **KHÔNG NÊN:**
- Commit mà không tạo migration
- Chỉnh sửa file migration sau khi đã áp dụng
- Xóa file migration
- Sử dụng `DB_SYNCHRONIZE=true` trong bất kỳ môi trường nào

### Production

✅ **NÊN:**
- Luôn backup trước migrations
- Xem lại SQL được tạo
- Kiểm tra migrations trên staging trước
- Sử dụng `DB_SYNCHRONIZE=false`
- Giám sát sau triển khai
- Chạy migrations trong maintenance window

❌ **KHÔNG NÊN:**
- Chạy migrations chưa kiểm tra
- Bỏ qua backups
- Sửa đổi migrations sau triển khai
- Bỏ qua hệ thống migration
- Áp dụng migrations mà không backup

---

## Tối ưu Hiệu suất

### Kiểm tra Hiệu suất Query

Kiểm tra việc sử dụng index với `EXPLAIN ANALYZE`:

```sql
-- Test tìm kiếm user
EXPLAIN ANALYZE
SELECT * FROM users
WHERE (full_name ILIKE '%john%' OR email ILIKE '%john%')
AND role = 'DRIVER'
AND is_active = true;
```

**Output tốt:** "Index Scan using idx_users_fullname_trgm"
**Output xấu:** "Seq Scan on users"

### Hướng dẫn Index

- Thêm indexes cho các cột thường được lọc
- Sử dụng composite indexes cho lọc đa cột
- Sử dụng partial indexes cho queries có điều kiện
- Giám sát việc sử dụng index với pg_stat_user_indexes

---

## Tài liệu Liên quan

- [Kiến trúc Backend](./index.md)
- [Thuật toán Ghép xe](./vehicle-matching-algorithm.md)
- [Thiết lập Docker](../devops/01-docker.md)
- [Hướng dẫn Triển khai VPS](../devops/08-vps-deployment-guide.md)

---

## Tham khảo Nhanh

| Tác vụ | Phát triển | Production |
|--------|------------|------------|
| **Cập nhật Schema** | Chỉnh sửa entity → tạo migration → áp dụng | Tạo migration → triển khai |
| **Triển khai Đầu tiên** | `pnpm migration:run` | `pnpm migration:run` |
| **Rollback** | `pnpm migration:revert` | `pnpm migration:revert` |
| **Xác minh** | `SELECT * FROM typeorm_migrations` | `SELECT * FROM typeorm_migrations` |

**Nhớ:** Cả hai môi trường đều sử dụng migrations để quản lý schema an toàn, có phiên bản
