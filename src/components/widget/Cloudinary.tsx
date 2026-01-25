"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (url: string) => void;
  currentImageUrl?: string;
  folder?: string;
  className?: string;
}

interface CloudinaryUploadInfo {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  [key: string]: unknown;
}

export function CloudinaryUploadWidget({
  onUploadSuccess,
  currentImageUrl,
  folder = "",
  className = "",
}: CloudinaryUploadWidgetProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImageUrl);
  const [isUploading, setIsUploading] = useState(false);

  // Sync preview with currentImageUrl prop when it changes (e.g., when editing)
  useEffect(() => {
    setPreviewUrl(currentImageUrl);
  }, [currentImageUrl]);

  const handleSuccess = (result: CloudinaryUploadWidgetResults) => {
    setIsUploading(false);
    if (result.info && typeof result.info !== "string") {
      const info = result.info as CloudinaryUploadInfo;
      setPreviewUrl(info.secure_url);
      onUploadSuccess(info.secure_url);
    }
  };

  const handleClearImage = () => {
    setPreviewUrl(undefined);
    onUploadSuccess("");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <CldUploadWidget
        signatureEndpoint="/api/cloudinary/sign"
        options={{
          folder,
          maxFiles: 1,
          resourceType: "image",
          sources: ["local", "url", "camera"],
          multiple: false,
          cropping: true,
          croppingAspectRatio: 1,
          croppingShowDimensions: true,
          showSkipCropButton: false,
          styles: {
            palette: {
              window: "#FFFFFF",
              windowBorder: "#E5E5E5",
              tabIcon: "#000000",
              menuIcons: "#555555",
              textDark: "#000000",
              textLight: "#FFFFFF",
              link: "#000000",
              action: "#000000",
              inactiveTabIcon: "#999999",
              error: "#EF4444",
              inProgress: "#000000",
              complete: "#10B981",
              sourceBg: "#F9FAFB",
            },
            fonts: {
              default: null,
              "'Inter', sans-serif": {
                url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
                active: true,
              },
            },
          },
        }}
        onSuccess={handleSuccess}
        onOpen={() => setIsUploading(true)}
        onClose={() => setIsUploading(false)}
        onQueuesEnd={(result, { widget }) => {
          widget.close();
        }}
      >
        {({ open }) => (
          <div className="space-y-3">
            {/* Preview */}
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-black/10 bg-black/5">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="aspect-square w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  aria-label="Eliminar imagen"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => open()}
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-black/20 bg-black/5 transition hover:border-black/40 hover:bg-black/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/10">
                  <ImageIcon size={24} className="text-black/50" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-black/70">
                    Haz clic para subir
                  </p>
                  <p className="text-xs text-black/50">PNG, JPG hasta 10MB</p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => open()}
              disabled={isUploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload size={16} />
              {isUploading ? "Subiendo..." : previewUrl ? "Cambiar imagen" : "Subir imagen"}
            </button>
          </div>
        )}
      </CldUploadWidget>
    </div>
  );
}

export default CloudinaryUploadWidget;
