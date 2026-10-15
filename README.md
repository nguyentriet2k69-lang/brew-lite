# BrewLite

BrewLite là monorepo gồm API NestJS, PostgreSQL/Prisma và cửa hàng Next.js. Sản phẩm được đọc từ database; người dùng có thể tạo tài khoản, đăng nhập, chọn size/topping và quản lý giỏ hàng.

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

Đổi `JWT_SECRET` và `ADMIN_PASSWORD` trong `backend/.env` trước khi chạy seed. Các file `.env` local không được commit.

## Database

Khởi động PostgreSQL bằng Docker Compose:

```bash
docker compose up -d postgres
```

Tạo Prisma Client, chạy migration và nạp sản phẩm mẫu cùng admin:

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate -- --name init
npm --prefix backend run prisma:seed
```

Seed tạo admin theo `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong `backend/.env`; đăng ký qua giao diện sẽ tạo tài khoản `USER` thông thường.

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

Frontend dùng `NEXT_PUBLIC_API_URL` để gọi API. Backend cho phép origin frontend được cấu hình bằng `FRONTEND_ORIGIN` (mặc định `http://localhost:3001`). Menu/detail báo lỗi nếu API hoặc database chưa sẵn sàng; không thay bằng dữ liệu mock.

## API

- `GET /products`: danh sách sản phẩm
- `GET /products/:id`: chi tiết sản phẩm
- `POST /products`: tạo sản phẩm, cần `Authorization: Bearer <JWT>` với role `ADMIN`
- `POST /auth/register`: tạo tài khoản USER; password tối thiểu 8 ký tự
- `POST /auth/login`: xác thực email/password và nhận `accessToken`

Ví dụ body đăng ký:

```json
{"name":"Nguyen Van A","email":"a@example.com","password":"StrongPass123"}
```

Ví dụ body tạo sản phẩm (chỉ admin):

```json
{"name":"Matcha latte","description":"Matcha và sữa","price":45000,"imageUrl":"/images/matcha.png","category":"Trà"}
```

## Chức năng

- Hiển thị menu với loading/empty/error state và dữ liệu thật từ PostgreSQL.
- Đăng ký/đăng nhập, hash mật khẩu bcrypt, JWT và guard role USER/ADMIN.
- Chọn size S/M/L và nhiều topping; giá cập nhật theo lựa chọn.
- Thêm sản phẩm vào giỏ, tăng/giảm số lượng, xóa món và xem tổng tiền.
- Zustand persist giữ giỏ hàng qua điều hướng và tải lại trang.

Giao diện auth: `http://localhost:3001/login` và `http://localhost:3001/register`.

## Kiểm tra

```bash
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend run build
```