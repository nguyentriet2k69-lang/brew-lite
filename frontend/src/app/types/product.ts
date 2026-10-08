export interface Product {
  id: string;          // Mã sản phẩm (ví dụ: "1", "abc-123")
  name: string;        // Tên đồ uống (ví dụ: "Cà phê sữa đá")
  price: number;       // Giá tiền (ví dụ: 29000)
  imageUrl?: string;   // Link ảnh (dấu ? nghĩa là có thể có hoặc không)
  description?: string; // Mô tả món (có thể có hoặc không)
}