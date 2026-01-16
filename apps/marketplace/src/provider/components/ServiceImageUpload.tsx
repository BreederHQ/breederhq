// apps/marketplace/src/provider/components/ServiceImageUpload.tsx
// Multi-image upload component for service listings (1-10 images)
// Supports both URL input AND file upload to S3

import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { getPresignedUploadUrl, uploadImageToS3 } from "../../api/client";

interface ServiceImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ServiceImageUpload({
  images,
  onChange,
  maxImages = 10
}: ServiceImageUploadProps) {
  const [newImageUrl, setNewImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = () => {
    const url = newImageUrl.trim();
    if (!url) {
      setError("Please enter an image URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (images.includes(url)) {
      setError("This image URL has already been added");
      setTimeout(() => setError(null), 3000);
      return;
    }

    onChange([...images, url]);
    setNewImageUrl("");
    setError(null);
  };

  const handleRemoveImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onChange(newImages);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddImage();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, WEBP, or HEIC image");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image must be less than 10MB");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Check image limit
    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress("Getting upload URL...");

      // Get presigned upload URL from backend
      const { uploadUrl, cdnUrl } = await getPresignedUploadUrl(
        file.name,
        file.type,
        "service_listing"
      );

      setUploadProgress("Uploading image...");

      // Upload file directly to S3
      await uploadImageToS3(uploadUrl, file);

      setUploadProgress("Image uploaded successfully!");

      // Add CDN URL to images array
      onChange([...images, cdnUrl]);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Clear success message after 2 seconds
      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Add Image - Two Options: Upload File OR Paste URL */}
      <div className="space-y-3">
        {/* Option 1: Upload File */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Upload from your computer
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading || images.length >= maxImages}
            className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Choose File to Upload"}
          </button>
          {uploadProgress && (
            <p className="text-xs text-green-600 mt-1 font-medium">{uploadProgress}</p>
          )}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        {/* Option 2: Paste URL */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Paste an image URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com/image.jpg"
              disabled={uploading}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleAddImage}
              disabled={images.length >= maxImages || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          {images.length}/{maxImages} images added
        </p>
        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">
            Images ({images.length}) - First image will be the main photo
          </p>
          <div className="grid grid-cols-2 gap-3">
            {images.map((url, index) => (
              <div
                key={index}
                className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
              >
                {/* Image Preview */}
                <div className="aspect-[4/3] relative">
                  <img
                    src={url}
                    alt={`Service image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='12'%3EBroken Image%3C/text%3E%3C/svg%3E";
                    }}
                  />

                  {/* Main Photo Badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-600 text-white">
                        Main Photo
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay with Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {/* Move Left */}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleReorder(index, index - 1)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Move left"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Move Right */}
                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleReorder(index, index + 1)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Move right"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Image Number */}
                <div className="px-2 py-1 text-[10px] text-gray-600 text-center bg-white border-t border-gray-200">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="font-medium text-gray-700 mb-1">Tips for great photos:</p>
        <ul className="space-y-0.5 ml-4 list-disc">
          <li>First image becomes your main listing photo</li>
          <li>Use high-quality, well-lit images</li>
          <li>Show your service area, equipment, or results</li>
          <li>Upload files directly or paste image URLs</li>
          <li>Supported formats: JPG, PNG, WEBP, HEIC (max 10MB)</li>
        </ul>
      </div>
    </div>
  );
}

export default ServiceImageUpload;
