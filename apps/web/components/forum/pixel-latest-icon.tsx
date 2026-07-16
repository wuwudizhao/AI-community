import Image from 'next/image';

export function PixelLatestIcon({ className }: { className?: string }) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={['pixel-latest-icon', className].filter(Boolean).join(' ')}
      height={32}
      src="/icons/pixel/latest.png"
      width={32}
    />
  );
}
