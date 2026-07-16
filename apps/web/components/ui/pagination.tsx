import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function Pagination({
  page,
  totalPages,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}) {
  const pages = visiblePages(page, totalPages);
  return (
    <nav className="ui-pagination" aria-label="分页">
      {page <= 1 ? (
        <span className="ui-pagination__disabled" aria-disabled="true">
          <ChevronLeft size={16} /> 上一页
        </span>
      ) : (
        <Link href={hrefForPage(page - 1)} rel="prev">
          <ChevronLeft size={16} /> 上一页
        </Link>
      )}
      <span className="ui-pagination__pages">
        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            <span aria-hidden="true" className="ui-pagination__ellipsis" key={`ellipsis-${index}`}>
              …
            </span>
          ) : (
            <Link
              aria-current={item === page ? 'page' : undefined}
              className={item === page ? 'is-current' : undefined}
              href={hrefForPage(item)}
              key={item}
            >
              {item}
            </Link>
          ),
        )}
      </span>
      {page >= totalPages ? (
        <span className="ui-pagination__disabled" aria-disabled="true">
          下一页 <ChevronRight size={16} />
        </span>
      ) : (
        <Link href={hrefForPage(page + 1)} rel="next">
          下一页 <ChevronRight size={16} />
        </Link>
      )}
    </nav>
  );
}

function visiblePages(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const candidates = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...candidates]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];
  for (const value of sorted) {
    const previous = result[result.length - 1];
    if (typeof previous === 'number' && value - previous > 1) result.push('ellipsis');
    result.push(value);
  }
  return result;
}
