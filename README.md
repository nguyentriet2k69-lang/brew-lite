# ☕ BrewLite - Ứng dụng Đặt Cà phê Không tiền mặt

> **Kiến trúc:** Monorepo (Next.js + NestJS + PostgreSQL)  
> **Quy trình phát triển:** Agile Scrum (Tasks 1 - 9)  
> **Repository:** [https://github.com/nguyentriet2k69-lang/brew-lite](https://github.com/nguyentriet2k69-lang/brew-lite)

---

## 📚 Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
3. [Yêu cầu hệ thống](#3-yêu-cầu-hệ-thống)
4. [Hướng dẫn Cài đặt & Chạy dự án](#4-hướng-dẫn-cài-đặt--chạy-dự-án)
5. [Hướng dẫn Test API (End-to-End)](#5-hướng-dẫn-test-api-end-to-end)
6. [Chi tiết API Đặt hàng & Thanh toán](#6-chi-tiết-api-đặt-hàng--thanh-toán)
7. [Cấu hình Thanh toán Mô phỏng (Task 8)](#7-cấu-hình-thanh-toán-mô-phỏng-task-8)
8. [Các tính năng đã hoàn thiện](#8-các-tính-năng-đã-hoàn-thiện)

---

## 1. Giới thiệu

**BrewLite** là một ứng dụng web cho phép khách hàng đặt và thanh toán đồ uống trực tuyến. Hệ thống được xây dựng với mục tiêu mang lại trải nghiệm mượt mà từ lúc chọn món, tùy chỉnh size/topping, quản lý giỏ hàng cho đến khi thanh toán (mô phỏng) và xem lịch sử đơn hàng.

---

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | Next.js (App Router), TypeScript, TailwindCSS, Zustand |
| **Backend** | NestJS, TypeScript, Prisma ORM, JWT (Passport) |
| **Database** | PostgreSQL 16 |
| **DevOps** | Docker, Docker Compose |

---

## 3. Yêu cầu hệ thống

- Đã cài đặt **Node.js** (phiên bản 20.9 trở lên).
- Đã cài đặt **Docker & Docker Desktop** (Khuyến nghị sử dụng để chạy dự án một cách nhanh nhất).

---

## 4. Hướng dẫn Cài đặt & Chạy dự án

### Cách 1: Chạy toàn bộ hệ thống bằng Docker (Khuyên dùng)

Phương pháp này tự động khởi tạo Database, nạp dữ liệu mẫu (seed) và chạy cả Frontend lẫn Backend chỉ với một câu lệnh.

**Bước 1:** Mở Terminal (PowerShell) tại thư mục gốc của dự án.
**Bước 2:** Chạy lệnh sau để build và khởi động hệ thống:

    docker compose up -d --build

**Bước 3:** Đợi khoảng 1-2 phút để Docker tải và khởi động.
- 🌐 **Truy cập giao diện Web:** [http://localhost:3001](http://localhost:3001)
- ⚙️ **Truy cập API Backend:** [http://localhost:3000](http://localhost:3000)

> **Lưu ý:** Hệ thống đã được cấu hình tự động chạy file `seed.mjs` để tạo sẵn dữ liệu mẫu và tài khoản Admin mỗi khi khởi động.

### Cách 2: Chạy thủ công (Local)

**Bước 1: Cài đặt Dependencies**

    npm --prefix backend install
    npm --prefix frontend install

**Bước 2: Cấu hình biến môi trường**

    Copy-Item backend/.env.example backend/.env
    Copy-Item frontend/.env.example frontend/.env.local

*(Hãy mở file `backend/.env` và thay đổi `JWT_SECRET` dài ít nhất 32 ký tự).*

**Bước 3: Khởi động Database & Nạp dữ liệu**

    docker compose up -d postgres
    npm --prefix backend run prisma:generate
    npm --prefix backend run prisma:migrate -- --name init
    npm --prefix backend run prisma:seed

**Bước 4: Chạy ứng dụng (Mở 2 Terminal riêng biệt)**
- **Terminal 1 (Backend):** `npm --prefix backend run start:dev`
- **Terminal 2 (Frontend):** `npm --prefix frontend run dev -- --port 3001`

---

## 5. Hướng dẫn Test API (End-to-End)

Đảm bảo Docker đang chạy 3 container (Postgres, Backend, Frontend). Mở PowerShell lên và giữ nguyên cửa sổ này trong suốt quá trình test (để lưu biến `$token`, `$headers`, `$order`).

**Bước 1: Lấy danh sách Menu**

    Invoke-RestMethod -Uri "http://localhost:3000/products" -Method Get

*(Kết quả: In ra mảng JSON các sản phẩm. Hãy nhìn vào trường `"id"` của sản phẩm để dùng cho Bước 4).*

**Bước 2: Đăng ký tài khoản**

    Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method Post -ContentType "application/json" -Body '{"name":"SinhVien","email":"test99@gmail.com","password":"12345678"}'

**Bước 3: Đăng nhập & Lấy Token**

*Lệnh 1: Gọi API đăng nhập và lưu kết quả vào biến `$res`.*

    $res = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"test99@gmail.com","password":"12345678"}'

*Lệnh 2: Trích xuất Token.*

    $token = $res.accessToken

*Lệnh 3: Tạo Header chứa Token.*

    $headers = @{ Authorization = "Bearer $token" }

**Bước 4: Tạo đơn hàng**

*Lưu ý: Backend yêu cầu tham số là `quantity` và bắt buộc phải có `toppings` (có thể để mảng rỗng `[]`).*

    $order = Invoke-RestMethod -Uri "http://localhost:3000/orders" -Method Post -Headers $headers -ContentType "application/json" -Body '{"items":[{"productId":"bac-xiu","size":"M","quantity":1,"toppings":[]}]}'

*In thông tin đơn hàng vừa tạo:*

    $order | Format-List id, code, status, totalAmount

**Bước 5: Thanh toán đơn hàng**

*Tự động lấy ID đơn hàng từ biến `$order`, không cần copy thủ công.*

    $payment = Invoke-RestMethod -Uri "http://localhost:3000/payments" -Method Post -Headers $headers -ContentType "application/json" -Body "{`"orderId`":`"$($order.id)`",`"method`":`"WALLET`"}"

*In kết quả thanh toán (Trạng thái đơn hàng phải là `PAID`):*

    $payment | Format-List id, orderId, status, orderStatus

**Bước 6: Xem lịch sử đơn hàng**

    Invoke-RestMethod -Uri "http://localhost:3000/orders/me" -Method Get -Headers $headers | Format-Table code, status, totalAmount

---

## 6. Chi tiết API Đặt hàng & Thanh toán

### 6.1. Tạo đơn hàng (`POST /orders`)
Yêu cầu JWT, nhận các lựa chọn từ client và không nhận giá từ frontend để đảm bảo bảo mật. Body mẫu:

    {
      "items": [
        { "productId": "coffee-den", "size": "M", "toppings": ["Trân châu"], "quantity": 1 }
      ]
    }

### 6.2. Thanh toán (`POST /payments`)
Yêu cầu Header `Authorization: Bearer <JWT>`. Body mẫu:

    { "orderId": "<id-trả-về-từ-POST-orders>", "method": "WALLET" }

- `method` nhận `WALLET` hoặc `CARD`. 
- Backend tra cứu đơn thuộc user hiện tại và lấy `amount` từ `Order.totalAmount`; body không được gửi `amount` hay `userId`.
- Response trả về gồm `id`, `orderId`, `orderCode`, `amount`, `method`, `status`, `orderStatus` và `createdAt`. `status` là `SUCCEEDED` hoặc `FAILED`; order lần lượt chuyển `PAID` hoặc `PAYMENT_FAILED`.
- Đơn `PAYMENT_FAILED` có thể thử lại, nhưng đơn `PAID`/`CANCELLED` không thể thanh toán lại.

---

## 7. Cấu hình Thanh toán Mô phỏng (Task 8)

Hệ thống sử dụng cổng thanh toán giả lập (Mock Payment Gateway), không gọi API của bên thứ 3. Để thay đổi kết quả thanh toán, bạn sửa biến môi trường trong `backend/.env`:
- `MOCK_PAYMENT_RESULT=success`: Giao dịch luôn thành công (Mặc định).
- `MOCK_PAYMENT_RESULT=failure`: Giao dịch luôn thất bại (Đơn hàng chuyển sang `PAYMENT_FAILED`).

*(Lưu ý: Sau khi sửa file `.env`, bạn cần khởi động lại Backend hoặc chạy lại `docker compose up -d` để áp dụng).*

**Luồng UI:** Thêm món → giỏ hàng → đăng nhập nếu cần → tạo order → chọn Ví/Thẻ → xác nhận thanh toán. Cart chỉ được xóa sau response xác nhận `SUCCEEDED` + `PAID`; nếu mock thất bại hoặc API lỗi, cart được giữ lại và trang checkout cho phép retry đơn hiện tại.

---

## 8. Các tính năng đã hoàn thiện

- [x] **Task 1-3:** Khởi tạo dự án, kết nối Database, hiển thị Menu động từ API.
- [x] **Task 4-5:** Trang chi tiết sản phẩm, chọn Size/Topping, quản lý Giỏ hàng (Zustand Persist - giỏ hàng được lưu riêng biệt cho từng User).
- [x] **Task 6:** Tạo đơn hàng, tính toán tiền bạc bảo mật ở Backend.
- [x] **Task 7:** Đăng ký/Đăng nhập, bảo mật JWT, phân quyền User/Admin.
- [x] **Task 8:** Tích hợp thanh toán Mock, xử lý luồng thành công/thất bại.
- [x] **Task 9:** Xây dựng trang Xác nhận đơn hàng, trang Lịch sử đơn hàng, cấu hình Docker Compose chạy 3 service.