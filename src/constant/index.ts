export const NOT_SERVER_ERROR_IMAGE = "https://res.cloudinary.com/dpb4rfzui/image/upload/v1769296869/79dfd929-b368-4373-8b6a-ca88c3e553d2_x8vknd.jpg";

export const PLACEHOLDER_IMAGE = "https://res.cloudinary.com/dpb4rfzui/image/upload/v1769292017/HomeImage_rkpe2e.jpg";

/** Use for product images: returns PLACEHOLDER_IMAGE when url is null, undefined, or empty. Never returns "". */
export function getProductImageUrl(url: string | null | undefined): string {
  const trimmed =
    url != null && typeof url === "string" && url.trim().length > 0
      ? url.trim()
      : PLACEHOLDER_IMAGE;
  return trimmed.length > 0 ? trimmed : PLACEHOLDER_IMAGE;
}