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

## Thanh toán mock (Task 8)

Thanh toán là mô phỏng nội bộ; không nhập thông tin thẻ thật và không gọi Momo/VNPay/Stripe. Sau khi cập nhật `backend/.env`, cấu hình kết quả ở phía backend:

```env
MOCK_PAYMENT_RESULT=success
```

- `success`: mock gateway trả kết quả thành công (mặc định khi không đặt biến).
- `failure`: mock gateway trả thất bại để kiểm thử nhánh `PAYMENT_FAILED`.
- Giá trị khác bị từ chối dưới dạng lỗi cấu hình, không tự giả định thành công.

Khởi động lại backend sau khi sửa file `.env`. Có thể tạm đặt biến trực tiếp trong PowerShell trước khi chạy backend:

```powershell
$env:MOCK_PAYMENT_RESULT = "failure"
npm --prefix backend run start:dev
```

Đặt lại thành `success` để demo thành công. Các giao dịch chỉ sử dụng kết quả mô phỏng; không lưu dữ liệu thẻ.

### API đặt đơn và thanh toán

`POST /orders` cần JWT và nhận các lựa chọn, không nhận giá từ frontend:

```json
{
  "items": [
    { "productId": "coffee-den", "size": "M", "toppings": ["Trân châu"], "quantity": 1 }
  ]
}
```

`POST /payments` cũng cần `Authorization: Bearer <JWT>`:

```json
{ "orderId": "<id-trả-về-từ-POST-orders>", "method": "WALLET" }
```

`method` nhận `WALLET` hoặc `CARD`. Backend tra cứu đơn thuộc user hiện tại và lấy `amount` từ `Order.totalAmount`; body không được gửi `amount` hay `userId`. Response tạo payment attempt gồm `id`, `orderId`, `orderCode`, `amount`, `method`, `status`, `orderStatus` và `createdAt`. `status` là `SUCCEEDED` hoặc `FAILED`; order lần lượt chuyển `PAID` hoặc `PAYMENT_FAILED`. Đơn `PAYMENT_FAILED` có thể thử lại, nhưng đơn `PAID`/`CANCELLED` không thể thanh toán lại. Schema có cột `idempotencyKey` nullable để mở rộng ở Task 10; Task 8 chưa triển khai semantics idempotency.

### Migration và demo

Sau khi cập nhật source, cài dependencies, sinh Prisma Client và áp dụng migration mới:

```bash
npm --prefix backend install
npm --prefix frontend install
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate
```

Luồng UI: thêm món → giỏ hàng → đăng nhập nếu cần → tạo order → chọn Ví/Thẻ → xác nhận thanh toán. Cart chỉ được xóa sau response xác nhận `SUCCEEDED` + `PAID`; nếu mock thất bại hoặc API lỗi, cart được giữ lại và trang checkout cho phép retry đơn hiện tại khi trạng thái cho phép.
