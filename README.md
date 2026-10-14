# BrewLite

BrewLite là monorepo gồm API NestJS và cửa hàng Next.js. Menu dùng dữ liệu mẫu từ backend; người dùng có thể chọn size, topping và quản lý giỏ hàng.

## Yêu cầu

- Node.js 20.9 trở lên
- npm

## Cài đặt

```bash
npm --prefix backend install
npm --prefix frontend install
```

Tạo file môi trường local:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

## Chạy ứng dụng

Mở hai terminal tại thư mục gốc monorepo.

Terminal 1, chạy API tại `http://localhost:3000`:

```bash
npm --prefix backend run start:dev
```

Terminal 2, chạy cửa hàng tại `http://localhost:3001`:

```bash
npm --prefix frontend run dev -- --port 3001
```

Frontend dùng `NEXT_PUBLIC_API_URL` để gọi API. Nếu backend chưa chạy, menu và trang chi tiết dùng dữ liệu mẫu dự phòng.
Backend cho phép origin frontend được cấu hình bằng `FRONTEND_ORIGIN` (mặc định `http://localhost:3001`).

## API

- `GET /products`: danh sách sản phẩm
- `GET /products/:id`: chi tiết sản phẩm

## Chức năng

- Hiển thị menu với loading, empty state và fallback dữ liệu mẫu.
- Chọn size S/M/L và nhiều topping; giá cập nhật theo lựa chọn.
- Thêm sản phẩm vào giỏ, tăng/giảm số lượng, xóa món và xem tổng tiền.
- Zustand persist giữ giỏ hàng qua điều hướng và tải lại trang.

## Kiểm tra

```bash
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend run build
```