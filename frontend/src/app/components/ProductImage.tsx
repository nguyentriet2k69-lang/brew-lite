'use client';

import { useState } from 'react';

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
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setImageFailed(true)}
    />
  );
}
