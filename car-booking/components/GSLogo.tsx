import Image from 'next/image';

interface GSLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function GSLogo({ className = "", width = 100, height = 50 }: GSLogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/gs-logo.png"
        alt="GS Battery"
        width={width}
        height={height}
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}

// Simplified version for smaller sizes
export function GSLogoSmall({ className = "", size = 30 }: { className?: string; size?: number }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/gs-logo.png"
        alt="GS Battery"
        width={size * 2} // Logo is wider than tall
        height={size}
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}