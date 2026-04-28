"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-xl border border-[#D9DED7] bg-white px-4 py-2 text-sm font-medium text-[#5A6560] transition-colors hover:border-[#5C4033] hover:text-[#5C4033] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        上一页
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2 text-[#9AA59D]">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`min-w-[40px] rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === page
                  ? "bg-[#5C4033] text-white"
                  : "border border-[#D9DED7] bg-white text-[#5A6560] hover:border-[#5C4033] hover:text-[#5C4033]"
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-xl border border-[#D9DED7] bg-white px-4 py-2 text-sm font-medium text-[#5A6560] transition-colors hover:border-[#5C4033] hover:text-[#5C4033] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        下一页
      </button>
    </div>
  );
}

interface LoadMoreProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loading?: boolean;
  className?: string;
}

export function LoadMore({
  onLoadMore,
  hasMore,
  loading = false,
  className = "",
}: LoadMoreProps) {
  if (!hasMore) {
    return (
      <div className={`py-8 text-center text-sm text-[#9AA59D] ${className}`}>
        已加载全部内容
      </div>
    );
  }

  return (
    <div className={`flex justify-center py-8 ${className}`}>
      <button
        onClick={onLoadMore}
        disabled={loading}
        className="rounded-xl border border-[#D9DED7] bg-white px-8 py-3 text-sm font-medium text-[#5A6560] transition-colors hover:border-[#5C4033] hover:text-[#5C4033] disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#5C4033] border-t-transparent" />
            加载中...
          </span>
        ) : (
          "加载更多"
        )}
      </button>
    </div>
  );
}
