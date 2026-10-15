import ProductDetail from '../components/ProductDetail';
import { getProductById } from '../lib/api';
import type { Product } from '../types/product';
import { notFound, redirect } from 'next/navigation';

const LEGACY_PRODUCT_IDS: Record<string, string> = {
  '1': 'coffee-den',
  '2': 'bac-xiu',
  '3': 'tra-dao-cam-sa',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const currentId = LEGACY_PRODUCT_IDS[id];
  if (currentId) redirect(`/products/${currentId}`);

  let product: Product;

  try {
    product = await getProductById(id);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white py-8 px-4">
      <ProductDetail product={product} />
    </main>
  );
}
