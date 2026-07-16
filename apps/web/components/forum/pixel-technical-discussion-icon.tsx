import Image from 'next/image';

export function PixelTechnicalDiscussionIcon({ className }: { className?: string }) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={['pixel-technical-discussion-icon', className].filter(Boolean).join(' ')}
      height={40}
      src="/icons/technical-discussion-v2.png"
      width={40}
    />
  );
}
