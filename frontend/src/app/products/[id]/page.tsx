import { notFound } from 'next/navigation';
import ProductDetail from '@/app/components/ProductDetail';
import { getProductById } from '@/app/lib/api';
import type { Product } from '@/app/types/product';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product: Product;

  try {
    product = await getProductById(id);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <ProductDetail product={product} />
    </main>
  );
}
