import Image from 'next/image';

export function PixelCoinIcon({ className }: { className?: string }) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={['pixel-coin-icon', className].filter(Boolean).join(' ')}
      height={32}
      src="/icons/pixel/coin.png"
      width={32}
    />
  );
}
