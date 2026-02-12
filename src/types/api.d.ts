/**
 * API response types
 * Available globally without import
 */

declare global {
  /**
   * Pagination metadata used by API list endpoints
   */
  type ApiPagination = {
    currentPage: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  /**
   * Standard success response wrapper
   */
  type ApiSuccessResponse<T> = {
    success: true;
    data: T;
    pagination?: ApiPagination;
    message?: string;
  };

  /**
   * Standard error response wrapper
   */
  type ApiErrorDetails = {
    missingProductIds?: number[];
    inactiveProductIds?: number[];
    items?: Array<{
      productId: number;
      name?: string;
      available?: number;
      requested?: number;
    }>;
  };

  type ApiErrorResponse = {
    success: false;
    error: string;
    message?: string;
  } & ApiErrorDetails;

  /**
   * Response shapes used by list endpoints
   */
  type ApiListResponse<T> =
    | ApiSuccessResponse<T[]>
    | { data: T[]; pagination?: ApiPagination }
    | T[];

  /**
   * Response shapes used by detail endpoints
   */
  type ApiItemResponse<T> =
    | ApiSuccessResponse<T>
    | { data: T }
    | T;

  /**
   * Response shapes used by mutations
   */
  type ApiMutationResponse<T> =
    | ApiSuccessResponse<T>
    | { success: true; data?: T; message?: string }
    | ApiErrorResponse;

  /**
   * Error payload used by API error parsing helpers
   */
  type ApiErrorPayload = {
    message?: string;
    error?: string;
  };
}

export {};
