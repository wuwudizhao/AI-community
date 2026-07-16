import Image from 'next/image';

export function PixelProjectAnalysisIcon({ className }: { className?: string }) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={['pixel-project-analysis-icon', className].filter(Boolean).join(' ')}
      height={24}
      src="/icons/project-analysis.png"
      width={24}
    />
  );
}
