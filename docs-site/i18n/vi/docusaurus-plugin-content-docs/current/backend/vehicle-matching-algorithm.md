# Kế hoạch triển khai thuật toán ghép xe

## Tổng quan

Triển khai thuật toán **Chấm điểm có trọng số với tối ưu hóa theo lô** để tự động gán xe cho các yêu cầu đặt xe.

**Tại sao chọn cách tiếp cận này:**
- Độ phức tạp O(B×V) - đủ nhanh cho 50 đặt xe × 50 xe trong `<100ms`
- Dễ điều chỉnh trọng số theo ưu tiên nghiệp vụ
- Có thể giải thích - mỗi phân công cho thấy lý do xe được chọn
- Đơn giản hơn thuật toán Hungarian nhưng vẫn hiệu quả

---

## Thiết kế thuật toán

### Luồng xử lý

```
Đặt xe chờ → Lọc ràng buộc cứng → Chấm điểm cặp khả thi → Gán tham lam → Lưu trữ
```

### 1. Ràng buộc cứng (KHÔNG BAO GIỜ được vi phạm)

| Ràng buộc | Kiểm tra |
|-----------|----------|
| HC1: Sức chứa | `vehicle.capacity >= booking.passenger_count` |
| HC2: Định mức KM | `remaining_quota >= booking.estimated_km` |
| HC3: Ca tài xế | Tài xế có ca SCHEDULED/ACTIVE trong thời gian đặt xe |
| HC4: Bảo dưỡng | `vehicle.status != MAINTENANCE/INACTIVE` |
| HC5: Trùng thời gian | Không có đặt xe xung đột cho cùng xe |

### 2. Công thức chấm điểm (thang 0-100)

```
TỔNG = W1×S_quota + W2×S_distance + W3×S_utilization + W4×S_fit
```

| Yếu tố | Trọng số | Công thức |
|--------|----------|-----------|
| Cân bằng định mức KM | 30% | `(remaining_km - estimated_km) / max_remaining × 100` |
| Khoảng cách | 35% | `100 - (distance_km / 50) × 100` |
| Cân bằng sử dụng | 15% | `100 - (over_ratio - 1) × 50` |
| Phù hợp loại xe | 20% | `100 - (vehicleRank - minViableRank) × 25` |

### 3. Xử lý trường hợp biên

- **Không có xe khả thi** → Tạo bản ghi `external_dispatches`, thông báo người dùng
- **Đặt xe cạnh tranh** → Sắp xếp ưu tiên: BLOCK_SCHEDULE > MULTI_STOP > SINGLE_TRIP, sau đó theo thời gian
- **Tất cả xe đã gán** → Đặt xe ưu tiên thấp hơn chuyển sang điều xe ngoài

---

## Các tác vụ triển khai

### Tác vụ 1: Tạo module ghép xe

**Các file cần tạo:**
```
backend/src/modules/vehicle-matching/
├── vehicle-matching.module.ts
├── vehicle-matching.service.ts
├── vehicle-matching.scheduler.ts
├── vehicle-matching.controller.ts
├── interfaces/
│   ├── booking-request.interface.ts
│   ├── vehicle-candidate.interface.ts
│   └── scoring-weights.interface.ts
├── dto/
│   └── assignment-result.dto.ts
└── utils/
    └── haversine.util.ts
```

### Tác vụ 2: Triển khai thuật toán lõi (vehicle-matching.service.ts)

**Các phương thức chính:**
1. `runBatchOptimization()` - Điểm vào chính
2. `collectPendingBookings()` - Lấy đặt xe PENDING/CONFIRMED với tọa độ đón
3. `collectAvailableVehicles()` - Lấy xe AVAILABLE với GPS, định mức, chuyến đi
4. `buildFeasibilityMatrix()` - Kiểm tra ràng buộc cứng cho tất cả cặp
5. `scoreFeasiblePairs()` - Tính điểm có trọng số
6. `greedyAssign()` - Gán theo thứ tự ưu tiên với giải quyết xung đột
7. `persistAssignments()` - Cập nhật đặt xe, tạo điều xe ngoài, thông báo

### Tác vụ 3: Triển khai Scheduler (vehicle-matching.scheduler.ts)

- Cron job: `@Cron('0 */5 * * * *')` - Mỗi 5 phút
- Khóa phân tán để ngăn chạy đồng thời
- Endpoint kích hoạt thủ công để tối ưu hóa theo yêu cầu

### Tác vụ 4: Thêm API Endpoints (vehicle-matching.controller.ts)

| Endpoint | Mô tả |
|----------|-------|
| `POST /vehicle-matching/optimize` | Kích hoạt tối ưu hóa theo lô ngay lập tức |
| `GET /vehicle-matching/preview/:bookingId` | Xem trước điểm ghép cho một đặt xe |
| `GET /vehicle-matching/config` | Lấy cấu hình trọng số hiện tại |
| `PATCH /vehicle-matching/config` | Cập nhật trọng số (chỉ admin) |

### Tác vụ 5: Thêm cấu hình

**Biến môi trường:**
```env
MATCHING_INTERVAL_MINUTES=5
WEIGHT_QUOTA=0.30
WEIGHT_DISTANCE=0.35
WEIGHT_UTILIZATION=0.15
WEIGHT_FIT=0.20
MAX_DISTANCE_KM=50
DEFAULT_TRIP_DURATION_MINUTES=120
```

### Tác vụ 6: Cài đặt Dependencies

```bash
npm install @nestjs/schedule  # Cho cron jobs
```

---

## Các file quan trọng cần sửa đổi

| File | Thay đổi |
|------|----------|
| `backend/src/app.module.ts` | Import VehicleMatchingModule |
| `backend/src/modules/bookings/bookings.service.ts` | Thêm truy vấn đặt xe chờ với điểm dừng |
| `backend/src/modules/vehicles/vehicles.service.ts` | Thêm truy vấn xe khả dụng với GPS/định mức |
| `backend/.env.example` | Thêm biến cấu hình ghép xe |

---

## Các bước xác minh

1. **Unit tests:**
   - Test tính toán chấm điểm với đầu vào đã biết
   - Test lọc ràng buộc cứng
   - Test logic sắp xếp ưu tiên

2. **Integration tests:**
   - Tạo đặt xe test ở trạng thái PENDING
   - Chạy tối ưu hóa theo lô
   - Xác minh phân công khớp xe mong đợi
   - Xác minh điều xe ngoài cho trường hợp không có xe

3. **Xác minh thủ công:**
   ```bash
   # Khởi động backend
   cd backend && npm run start:dev

   # Kích hoạt tối ưu hóa
   curl -X POST http://localhost:3001/api/v1/vehicle-matching/optimize

   # Kiểm tra đặt xe đã được gán
   curl http://localhost:3001/api/v1/bookings?status=ASSIGNED
   ```

---

## Truy vấn cơ sở dữ liệu (Tham khảo)

### Thu thập đặt xe chờ với điểm đón
```sql
SELECT b.*, ts.latitude, ts.longitude
FROM bookings b
LEFT JOIN trip_stops ts ON ts.booking_id = b.id AND ts.stop_order = 0
WHERE b.status IN ('PENDING', 'CONFIRMED')
  AND b.scheduled_date >= CURRENT_DATE;
```

### Thu thập xe khả dụng với GPS và định mức
```sql
SELECT v.*,
       gps.latitude, gps.longitude,
       kq.quota_km, kq.tolerance_km, kq.used_km
FROM vehicles v
LEFT JOIN LATERAL (
    SELECT latitude, longitude FROM gps_locations
    WHERE vehicle_id = v.id ORDER BY recorded_at DESC LIMIT 1
) gps ON true
LEFT JOIN km_quotas kq ON kq.vehicle_id = v.id
    AND kq.month = DATE_TRUNC('month', CURRENT_DATE)
WHERE v.status = 'AVAILABLE' AND v.is_active = true;
```

---

## Phạm vi ước tính

- **File mới:** ~10 file
- **File sửa đổi:** ~4 file
- **Logic chính:** ~500 dòng TypeScript
