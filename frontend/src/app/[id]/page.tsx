import ProductDetail from '../components/ProductDetail';
import { getProductById, getMockProductById } from '../lib/api';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  let product;

  try {
    // Ưu tiên gọi API thật
    product = await getProductById(id);
  } catch {
    // Fallback sang dữ liệu mẫu khi backend chưa sẵn sàng
    product = getMockProductById(id);
  }

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white py-8 px-4">
      <ProductDetail product={product} />
    </main>
  );
}
