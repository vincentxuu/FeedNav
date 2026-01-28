/* eslint-disable no-unused-vars */
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

interface AppPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const AppPagination = ({ currentPage, totalPages, onPageChange, className }: AppPaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePageClick = (e: React.MouseEvent, page: number) => {
    e.preventDefault();
    onPageChange(page);
  };

  const pageNumbers = [];
  const MAX_PAGES_SHOWN = 5;
  const HALF_PAGES_SHOWN = Math.floor(MAX_PAGES_SHOWN / 2);

  if (totalPages <= MAX_PAGES_SHOWN + 2) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else if (currentPage <= HALF_PAGES_SHOWN + 1) {
    for (let i = 1; i <= MAX_PAGES_SHOWN; i++) {
      pageNumbers.push(i);
    }
    pageNumbers.push('...');
    pageNumbers.push(totalPages);
  } else if (currentPage >= totalPages - HALF_PAGES_SHOWN) {
    pageNumbers.push(1);
    pageNumbers.push('...');
    for (let i = totalPages - MAX_PAGES_SHOWN + 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1);
    pageNumbers.push('...');
    for (let i = currentPage - HALF_PAGES_SHOWN + 1; i <= currentPage + HALF_PAGES_SHOWN - 1; i++) {
      pageNumbers.push(i);
    }
    pageNumbers.push('...');
    pageNumbers.push(totalPages);
  }

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => handlePageClick(e, currentPage - 1)}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>
        {pageNumbers.map((num, index) => (
          <PaginationItem key={`${num}-${index}`}>
            {typeof num === 'number' ? (
              <PaginationLink
                href="#"
                isActive={currentPage === num}
                onClick={(e) => handlePageClick(e, num)}
              >
                {num}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => handlePageClick(e, currentPage + 1)}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};