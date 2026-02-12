/**
 * Cloudinary upload types
 * Available globally without import
 */

declare global {
  type CloudinaryUploadInfo = {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
  } & Record<string, string | number | boolean | null | undefined>;
}

export {};
