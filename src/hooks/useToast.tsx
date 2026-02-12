"use client";

import toast from "react-hot-toast";

export function useToast() {
  return {
    showToast: ({ title, description }: { title: string; description?: string }) => {
      toast.success(description ? `${title}: ${description}` : title, {
        duration: 2200,
        style: {
          borderRadius: "1rem",
          background: "#fff",
          color: "#000",
          padding: "16px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
      });
    },
  };
}
