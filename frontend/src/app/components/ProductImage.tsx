'use client';

import { useState } from 'react';
import Image from 'next/image';

const FALLBACK_IMAGE = '/images/product-placeholder.svg';

interface ProductImageProps {
  src?: string;
  alt: string;
  className: string;
}

export default function ProductImage({ src, alt, className }: ProductImageProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = src && !imageFailed ? src : FALLBACK_IMAGE;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={800}
      height={800}
      className={className}
      onError={() => setImageFailed(true)}
      unoptimized
    />
  );
}
