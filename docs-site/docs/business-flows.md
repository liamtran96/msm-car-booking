BẢNG ĐẶC TẢ YÊU CẦU PHẦN MỀM QUẢN LÝ XE (REQUIREMENTS SPECIFICATION)
1. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)
1.1. Phân hệ Đặt xe & Điều phối (Booking & Dispatching)
Tự động hóa điều phối: Hệ thống tự động sắp xếp và điều xe dựa trên lịch trình, giảm thao tác thủ công cho người phụ trách (PIC).
Đặt lịch trước (Advance Booking): Cho phép người dùng hoặc admin tạo yêu cầu đặt xe cho các ngày trong tương lai.
Đặt xe nhiều điểm dừng (Multi-stop/Block Schedule):
Hỗ trợ nhân viên đi công tác tại nhiều địa điểm liên tiếp.
Tính năng "Block lịch": Giữ xe trong một khoảng thời gian dài, hạn chế việc phải tạo nhiều chuyến lẻ tẻ cho cùng một hành trình.
Quản lý điểm đón (Pickup Points): Hệ thống cho phép định nghĩa và phân luồng các điểm đón/trả khách cố định hoặc linh hoạt.
1.2. Phân hệ Quản lý Đội xe (Fleet Management)
Tracking GPS Real-time: PIC xem được vị trí hiện tại của xe trên bản đồ số theo thời gian thực.
Quản lý KM (Odometer):
Ghi nhận số km hoạt động trong tháng của từng xe.
Theo dõi định mức km được giao (Quota).
1.3. Thông báo (Notification System)
Đa kênh: Gửi thông báo xác nhận, xe đến, hoặc hủy chuyến qua App Notification và Cuộc gọi tự động (Call).
1.4. Báo cáo (Reporting)
Báo cáo tổng hợp chi phí, tổng số km, lịch sử chuyến đi theo từng xe/phòng ban/người dùng.
2. QUY TRÌNH NGHIỆP VỤ & LOGIC XỬ LÝ (BUSINESS LOGIC)
2.1. Phân loại đối tượng sử dụng (User Segments)
Nhóm Daily (Hàng ngày): Dành cho SIC (nhân viên hợp đồng/tuyến cố định).
Nhóm Sometimes (Phát sinh): Dành cho Business Trippers (nhân viên đi công tác), External Guests (khách ngoài).
2.2. Xử lý tình huống Vượt định mức KM (Over-KM Handling Logic)
Cấu hình tham số: Hệ thống cho phép Admin cấu hình "Ngưỡng cho phép vượt" (Tolerance Limit) (Ví dụ: 50km, 100km...).
Quy trình kiểm tra khi đặt xe:
Hệ thống tính toán: Tổng KM dự kiến = (KM thực tế hiện tại + KM của chuyến đi mới).
Kịch bản 1 (Trong hạn mức): Nếu Tổng KM dự kiến ≤ (Định mức tháng + Ngưỡng cho phép vượt) $\rightarrow$ CHO PHÉP hệ thống điều xe đó (Có hiển thị cảnh báo mức độ tiêu thụ KM cho PIC).
Kịch bản 2 (Vượt hạn mức): Nếu Tổng KM dự kiến > (Định mức tháng + Ngưỡng cho phép vượt) > Hệ thống tự động điều hướng sang phương án GA request sắp xe ngoài (Grab/Taxi).
3. YÊU CẦU KỸ THUẬT (TECHNICAL REQUIREMENTS)
3.1. Nền tảng ứng dụng (Platform)
Web Portal: Dành cho Admin/PIC/GA quản trị.
Mobile App: Dành cho Tài xế và Người dùng (End-user). Bắt buộc hỗ trợ cả Android và iOS.
3.2. Hệ thống GPS & Phần cứng (Hardware & IoT)
Hệ thống độc lập (Standalone): Xây dựng hệ thống thu thập dữ liệu từ hộp đen/GPS riêng. Xử lý dữ liệu trực tiếp, không phụ thuộc/nhúng web của bên thứ 3.
Bảo mật định vị: Có cơ chế kiểm tra bảo mật (Security check) khi sử dụng định vị GPS trên điện thoại người dùng.
3.3. Hạ tầng & Triển khai (Infrastructure)
Lưu trữ: Triển khai trên Máy chủ vật lý (Server Room tại công ty) HOẶC Private Cloud.
Khả năng tích hợp: Có API/Service để liên kết (Link) với Portal hiện tại hoặc hệ thống Office của công ty.
Khả năng mở rộng: Kiến trúc hệ thống phải hỗ trợ "Extend function" (mở rộng tính năng) dễ dàng sau này.