/**
 * Common types used across the application
 * Available globally without import
 */

declare global {
  /**
   * Generic API response wrapper
   */
  type ApiResponse<T = Record<string, never>> = {
    data?: T;
    error?: string;
    message?: string;
  };

  /**
   * Pagination metadata
   */
  type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  /**
   * Paginated API response
   */
  type PaginatedResponse<T> = {
    data: T[];
    meta: PaginationMeta;
  };

  /**
   * Toast notification props
   */
  type ToastProps = {
    title: string;
    description?: string;
  };

  /**
   * Component props with children
   */
  type ComponentWithChildren = {
    children: React.ReactNode;
  };

  /**
   * Component props with className
   */
  type ComponentWithClassName = {
    className?: string;
  };
}

export {};
