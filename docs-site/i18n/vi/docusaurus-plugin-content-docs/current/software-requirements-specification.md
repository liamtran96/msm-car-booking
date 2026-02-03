---
id: software-requirements-specification
title: Đặc tả yêu cầu phần mềm
sidebar_position: 1
---

# Bảng đặc tả yêu cầu phần mềm quản lý xe

## 1. Yêu cầu chức năng

### 1.1. Phân hệ Đặt xe & Điều phối

- **Tự động hóa điều phối**: Hệ thống tự động sắp xếp và điều xe dựa trên lịch trình, giảm thao tác thủ công cho người phụ trách (PIC).
- **Đặt lịch trước (Advance Booking)**: Cho phép người dùng hoặc admin tạo yêu cầu đặt xe cho các ngày trong tương lai.
- **Đặt xe nhiều điểm dừng (Multi-stop/Block Schedule)**:
  - Hỗ trợ nhân viên đi công tác tại nhiều địa điểm liên tiếp.
  - Tính năng "Block lịch": Giữ xe trong một khoảng thời gian dài, hạn chế việc phải tạo nhiều chuyến lẻ tẻ cho cùng một hành trình.
- **Quản lý điểm đón (Pickup Points)**: Hệ thống cho phép định nghĩa và phân luồng các điểm đón/trả khách cố định hoặc linh hoạt.

### 1.2. Phân hệ Quản lý Đội xe

- **Tracking GPS Real-time**: PIC xem được vị trí hiện tại của xe trên bản đồ số theo thời gian thực.
- **Quản lý KM (Odometer)**:
  - Ghi nhận số km hoạt động trong tháng của từng xe.
  - Theo dõi định mức km được giao (Quota).

### 1.3. Thông báo

- **Đa kênh**: Gửi thông báo xác nhận, xe đến, hoặc hủy chuyến qua App Notification và Cuộc gọi tự động (Call).

### 1.4. Báo cáo

- Báo cáo tổng hợp chi phí, tổng số km, lịch sử chuyến đi theo từng xe/phòng ban/người dùng.

## 2. Quy trình nghiệp vụ & Logic xử lý

### 2.1. Phân loại đối tượng sử dụng

- **Nhóm Daily (Hàng ngày)**: Dành cho SIC (nhân viên hợp đồng/tuyến cố định).
- **Nhóm Sometimes (Phát sinh)**: Dành cho Business Trippers (nhân viên đi công tác), External Guests (khách ngoài).

### 2.2. Xử lý tình huống vượt định mức KM

**Cấu hình tham số**: Hệ thống cho phép Admin cấu hình "Ngưỡng cho phép vượt" (Tolerance Limit) (Ví dụ: 50km, 100km...).

**Quy trình kiểm tra khi đặt xe**:
- Hệ thống tính toán: Tổng KM dự kiến = (KM thực tế hiện tại + KM của chuyến đi mới).
- **Kịch bản 1 (Trong hạn mức)**: Nếu Tổng KM dự kiến nhỏ hơn hoặc bằng (Định mức tháng + Ngưỡng cho phép vượt), CHO PHÉP hệ thống điều xe đó (Có hiển thị cảnh báo mức độ tiêu thụ KM cho PIC).
- **Kịch bản 2 (Vượt hạn mức)**: Nếu Tổng KM dự kiến vượt quá (Định mức tháng + Ngưỡng cho phép vượt), Hệ thống tự động điều hướng sang phương án GA request sắp xe ngoài (Grab/Taxi).

## 3. Yêu cầu kỹ thuật

### 3.1. Nền tảng ứng dụng

- **Web Portal**: Dành cho Admin/PIC/GA quản trị.
- **Mobile App**: Dành cho Tài xế và Người dùng (End-user). Bắt buộc hỗ trợ cả Android và iOS.

### 3.2. Hệ thống GPS & Phần cứng (IoT)

- **Hệ thống độc lập (Standalone)**: Xây dựng hệ thống thu thập dữ liệu từ hộp đen/GPS riêng. Xử lý dữ liệu trực tiếp, không phụ thuộc/nhúng web của bên thứ 3.
- **Bảo mật định vị**: Có cơ chế kiểm tra bảo mật (Security check) khi sử dụng định vị GPS trên điện thoại người dùng.

### 3.3. Hạ tầng & Triển khai

- **Lưu trữ**: Triển khai trên Máy chủ vật lý (Server Room tại công ty) HOẶC Private Cloud.
- **Khả năng tích hợp**: Có API/Service để liên kết (Link) với Portal hiện tại hoặc hệ thống Office của công ty.
- **Khả năng mở rộng**: Kiến trúc hệ thống phải hỗ trợ mở rộng tính năng dễ dàng sau này.

## Ma trận chức năng

| STT | Hạng mục (Module) | Tên chức năng | Mô tả chi tiết |
|----:|-------------------|---------------|----------------|
| 1 | Phân tích giải pháp tích hợp | Khảo sát & Thiết kế tích hợp | Xem hệ thống trước đó, phân tích source code, database, nghiệp vụ có sẵn |
| 2 | Xác thực | SSO | Tích hợp đăng nhập một lần (SSO) với Web-portal hiện tại của công ty |
| 3 | Quản trị hệ thống & phân quyền | Quản lý người dùng | Quản lý hồ sơ nhân viên, tài xế, Admin, PIC, GA, phân nhóm người dùng |
| 4 | Quản trị hệ thống & phân quyền | Phân quyền | Phân chia quyền hạn chi tiết cho từng nhóm đối tượng |
| 5 | Quản trị hệ thống & phân quyền | Cấu hình tham số | Thiết lập các tham số hệ thống như: Ngưỡng cảnh báo vượt km, định mức, loại xe... |
| 6 | Dashboard | Báo cáo tổng hợp chi phí | Thống kê và trực quan hóa các loại chi phí vận hành (nhiên liệu, sửa chữa, phí cầu đường, thuê ngoài) |
| 7 | Dashboard | Báo cáo tổng số km | Tổng hợp quãng đường di chuyển thực tế của từng đầu xe |
| 8 | Dashboard | Báo cáo lịch sử chuyến đi | Truy xuất chi tiết nhật ký hành trình theo xe/phòng ban/người dùng (lộ trình, thời gian, người sử dụng) |
| 9 | Quản lý hồ sơ đội xe | Danh sách xe | Danh sách xe theo khu vực Bắc - Nam (hiển thị số km trong tháng và định mức của từng xe) |
| 10 | Quản lý hồ sơ đội xe | Thêm / sửa / xóa xe | Thêm, chỉnh sửa, xóa xe theo khu vực Bắc - Nam |
| 11 | Quản lý hồ sơ đội xe | Thiết lập định mức | Cài đặt hạn mức Km tối đa theo tháng cho từng xe |
| 12 | Quản lý hồ sơ đội xe | Trạng thái xe | Có sẵn / Đã được đặt / Đang sửa chữa (real-time) |
| 13 | Giám sát hành trình GPS | Xem vị trí hiện tại | Theo dõi vị trí xe theo thời gian thực trên bản đồ số |
| 14 | Giám sát hành trình GPS | Xem lại lộ trình | Truy xuất lịch sử di chuyển trong quá khứ |
| 15 | Giám sát hành trình GPS | Quản lý điểm đón | Định nghĩa và phân luồng các điểm đón/trả khách cố định hoặc linh hoạt |
| 16 | Trung tâm điều phối thông minh | Lịch của từng xe | Timeline / giao diện lịch (calendar) dựa trên form đặt xe |
| 17 | Trung tâm điều phối thông minh | Thuật toán matching xe | Tự động quét và gán xe phù hợp nhất khi có yêu cầu |
| 18 | Trung tâm điều phối thông minh | Cảnh báo vượt hạn mức | Tự động cảnh báo cho PIC khi vượt định mức |
| 19 | Đặt xe hộ | Form đặt xe | Ngày, giờ, điểm đón/trả, gán người yêu cầu |
| 20 | Đặt xe hộ | Thêm điểm dừng | Thiết lập lộ trình đa điểm (điểm ghé/trung chuyển) |
| 21 | Đặt xe hộ | Block lịch | Khóa thủ công lịch hoạt động của xe hoặc tài xế |
| 22 | Đặt xe hộ | Huỷ đặt xe | Hủy yêu cầu, giải phóng xe/tài xế và gửi thông báo |
| 23 | Quản lý thuê xe ngoài | Hàng chờ thuê ngoài | Tự động tiếp nhận yêu cầu khi hệ thống nội bộ hết xe/hết quota |
| 24 | Quản lý thuê xe ngoài | Ghi nhận thông tin | Nhập nhanh thông tin chuyến thuê ngoài (hãng xe, biển số, chi phí dự kiến) |
| 25 | Quản lý thuê xe ngoài | Cập nhật trạng thái | Thông báo lại cho User thông tin xe thuê ngoài |
| 26 | Hệ thống giao tiếp & tích hợp | Cổng kết nối tổng đài | Tích hợp nhà cung cấp dịch vụ thoại để gọi đi từ hệ thống |
| 27 | Hệ thống giao tiếp & tích hợp | Kịch bản gọi tự động | Cấu hình các tình huống hệ thống tự động gọi |
| 28 | Hệ thống giao tiếp & tích hợp | Text-to-Speech | Chuyển văn bản (tên tài xế, biển số) thành giọng nói |
