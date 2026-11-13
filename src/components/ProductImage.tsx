import { useState } from 'react';
import { Package } from 'lucide-react';
import { resolveProductImage } from '../lib/imageRegistry';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveProductImage(src);

  if (!resolved || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F1F5F9] text-[#64748B] p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Package className="w-8 h-8 mb-1.5 text-[#94A3B8]" strokeWidth={1.5} />
        <span className="text-xs font-medium text-center line-clamp-2 text-[#475569]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      loading="lazy"
    />
  );
}
