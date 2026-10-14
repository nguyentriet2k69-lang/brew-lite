import { notFound } from 'next/navigation';
import ProductDetail from '@/app/components/ProductDetail';
import { getMockProductById, getProductById } from '@/app/lib/api';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product;

  try {
    product = await getProductById(id);
  } catch {
    product = getMockProductById(id);
  }

  if (!product) notFound();

  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <ProductDetail product={product} />
    </main>
  );
}
