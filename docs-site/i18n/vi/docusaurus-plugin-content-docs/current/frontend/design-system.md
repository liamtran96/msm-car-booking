---
id: design-system
title: Hệ thống thiết kế
sidebar_position: 3
---

# Tài liệu hệ thống thiết kế Glassmorphism

Dự án này sử dụng hệ thống thiết kế glassmorphism tập trung được định nghĩa trong `src/index.css`. Cách thiết lập này cho phép thay đổi thẩm mỹ toàn cục chỉ bằng cách sửa đổi một vài biến.

## Kiểm soát Style toàn cục

Để thay đổi "giao diện" của toàn bộ ứng dụng, sửa đổi các biến trong block `@theme` của `src/index.css`:

```css
@theme inline {
  /* ... */

  /* Biến hệ thống Glassmorphism - THAY ĐỔI CÁC GIÁ TRỊ NÀY */
  --glass-opacity: 0.7;       /* Kiểm soát độ trong suốt tổng thể (0.0 - 1.0) */
  --glass-blur: 12px;         /* Kiểm soát cường độ làm mờ nền */
  --glass-border-opacity: 0.3; /* Kiểm soát độ tinh tế của viền */
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08); /* Kiểm soát độ nổi */
}
```

## Các lớp tiện ích

Sử dụng các lớp ngữ nghĩa này thay vì hardcode độ trong suốt và làm mờ trong các component của bạn:

| Lớp tiện ích | Mô tả |
| :--- | :--- |
| `.glass` | Hiệu ứng glass cơ bản (dùng cho header/banner). |
| `.glass-card` | Style card tiêu chuẩn với hiệu ứng hover. |
| `.glass-card-info` | Card màu xanh dương cho dữ liệu thông tin. |
| `.glass-card-success` | Card màu xanh lá cho trạng thái thành công. |
| `.glass-card-warning` | Card màu hổ phách cho điểm nhấn/cảnh báo. |
| `.glass-card-danger` | Card màu đỏ cho hành động nguy hiểm. |
| `.glass-card-purple` | Card màu tím cho dữ liệu logistics cụ thể. |

## Tại sao dùng cách tiếp cận này?

1.  **Tính nhất quán**: Đảm bảo tất cả các phần tử glass trong ứng dụng sử dụng cùng độ mờ và độ trong suốt.
2.  **Khả năng bảo trì**: Nếu bạn muốn giảm độ mờ, chỉ cần thay đổi ở **một nơi** (`index.css`) và nó sẽ cập nhật ở mọi nơi.
3.  **Tích hợp Tailwind**: Tất cả các lớp này được đăng ký như tiện ích Tailwind (qua `@utility`), nghĩa là bạn có thể sử dụng chúng như các lớp tiêu chuẩn (ví dụ: `<div className="glass-card p-4">`).
