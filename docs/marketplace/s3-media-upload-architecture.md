# S3 Media Upload Architecture Plan

## Overview

This document outlines the architecture for implementing S3-style media storage for BreederHQ. The system will support direct browser-to-S3 uploads using presigned URLs, eliminating the need for users to manually manage third-party image hosting.

## Current State

**Frontend Implementation (Completed)**
- ✅ ImageUpload component created with hybrid URL + upload button UI
- ✅ Logo field using ImageUpload component
- ✅ Banner field using ImageUpload component
- ✅ Upload button shows "coming soon" message
- ✅ URL input still works for power users

**Backend Status**
- ❌ No S3 integration yet
- ❌ No presigned URL generation
- ❌ No media upload endpoints

## Architecture Goals

1. **User-Friendly**: Drag-and-drop, mobile camera, paste from clipboard
2. **Performant**: Direct browser-to-S3 uploads (no server proxy)
3. **Secure**: Presigned URLs with expiration and size limits
4. **Cost-Effective**: Cloudflare R2 recommended for zero egress fees
5. **Scalable**: CDN-backed delivery with automatic optimization
6. **Privacy**: Media access controls aligned with breeder visibility settings

## Storage Provider Comparison

### Recommended: Cloudflare R2

**Pros:**
- Zero egress fees (unlimited bandwidth at no cost)
- S3-compatible API (easy migration from/to AWS S3)
- Integrated with Cloudflare CDN
- Very low storage costs: $0.015/GB/month
- No bandwidth charges (AWS charges $0.09/GB egress)

**Cost Estimate:**
- 100 breeders × 50 photos × 2MB average = 10GB storage
- Storage: 10GB × $0.015 = $0.15/month
- Bandwidth: $0/month (unlimited with R2)
- **Total: ~$0.15/month**

**Cons:**
- Newer service (less mature than S3)
- Requires Cloudflare account

### Alternative: AWS S3 + CloudFront

**Pros:**
- Industry standard, battle-tested
- Rich ecosystem of tools
- Global infrastructure

**Cost Estimate:**
- Storage: 10GB × $0.023 = $0.23/month
- Bandwidth (assuming 100GB/month): 100GB × $0.09 = $9/month
- **Total: ~$9.23/month**

**Cons:**
- Higher costs due to egress fees
- More complex setup

**Decision: Use Cloudflare R2** for cost-effectiveness and zero egress fees.

## Implementation Phases

### Phase 1: Backend Infrastructure (MVP)

**1.1 Environment Setup**
- Create R2 bucket: `breederhq-media-production`
- Configure CORS policy for browser uploads
- Set up R2 API credentials (Access Key ID + Secret)
- Configure CDN custom domain: `media.breederhq.com`

**1.2 API Endpoints**

Create new route file: `src/routes/media-upload.ts`

#### POST `/api/v1/media/presigned-url`
Generate presigned upload URL for direct browser-to-S3 upload.

**Request Body:**
```typescript
{
  fileName: string;        // Original filename (e.g., "puppy.jpg")
  fileType: string;        // MIME type (e.g., "image/jpeg")
  fileSize: number;        // Size in bytes
  purpose: "logo" | "banner" | "animal" | "offspring" | "post";
  context?: {              // Optional context for validation
    animalId?: number;
    programId?: string;
  }
}
```

**Response:**
```typescript
{
  uploadUrl: string;       // Presigned S3 URL for PUT upload
  publicUrl: string;       // CDN URL for uploaded file
  uploadId: string;        // Unique upload ID for tracking
  expiresAt: string;       // ISO timestamp when uploadUrl expires
  maxSizeBytes: number;    // Size limit enforced by presigned URL
}
```

**Validation:**
- Check user authentication
- Verify tenant membership
- Validate file type (images: jpg, png, webp; videos: mp4, mov)
- Validate file size (images: 10MB max, videos: 100MB max)
- Generate unique key: `tenants/{tenantId}/{purpose}/{uploadId}-{sanitizedFileName}`

**Security:**
- Presigned URL expires in 15 minutes
- Include Content-Type and Content-Length in presigned URL
- Rate limit: 100 uploads per user per hour

#### POST `/api/v1/media/confirm-upload`
Confirm successful upload and optionally create media record.

**Request Body:**
```typescript
{
  uploadId: string;
  publicUrl: string;
}
```

**Response:**
```typescript
{
  ok: true;
  mediaId?: number;        // Optional: If creating media record
}
```

**Validation:**
- Verify upload exists in S3
- Check file size matches original request
- Optionally create Media entity for tracking

**1.3 Database Schema (Optional)**

Table: `Media` (for tracking uploaded files)
```sql
CREATE TABLE Media (
  id SERIAL PRIMARY KEY,
  tenantId INTEGER NOT NULL REFERENCES Tenant(id),
  uploadedBy VARCHAR(255) NOT NULL,
  uploadId VARCHAR(255) NOT NULL UNIQUE,
  purpose VARCHAR(50) NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  fileType VARCHAR(100) NOT NULL,
  fileSizeBytes INTEGER NOT NULL,
  publicUrl TEXT NOT NULL,
  s3Key TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  deletedAt TIMESTAMP NULL
);

CREATE INDEX idx_media_tenant ON Media(tenantId);
CREATE INDEX idx_media_uploadId ON Media(uploadId);
```

Benefits:
- Track storage usage per tenant
- Support soft-delete (mark deletedAt, cleanup S3 async)
- Audit trail for uploads
- Future: Generate thumbnails, detect duplicates

### Phase 2: Frontend Integration

**2.1 Update ImageUpload Component**

File: `apps/marketplace/src/shared/ImageUpload.tsx`

Replace placeholder upload handler with real implementation:

```typescript
const handleUploadClick = async () => {
  // 1. Open file picker
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp";

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // 2. Request presigned URL from backend
      const presignedRes = await client.requestPresignedUrl({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        purpose: "logo", // or "banner", passed as prop
      });

      // 3. Upload directly to S3
      await fetch(presignedRes.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "Content-Length": file.size.toString(),
        },
        body: file,
      });

      // 4. Confirm upload with backend
      await client.confirmUpload({
        uploadId: presignedRes.uploadId,
        publicUrl: presignedRes.publicUrl,
      });

      // 5. Update form with CDN URL
      onChange(presignedRes.publicUrl);

    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  input.click();
};
```

**2.2 Add Loading States**

Update ImageUpload component to show:
- Upload progress indicator
- Disable inputs during upload
- Show success message on completion
- Show error message on failure

**2.3 Add Drag-and-Drop (Phase 2b)**

Enhance ImageUpload with drag-and-drop zone:
- Highlight drop zone on dragover
- Accept dropped files
- Show file preview before upload
- Support paste from clipboard

### Phase 3: Advanced Features (Future)

**3.1 Image Optimization**
- Automatic resizing on upload (generate 400x400 for logos, 1200x400 for banners)
- WebP conversion for smaller file sizes
- Thumbnail generation (200x200, 400x400, 800x800)
- Lazy loading with blur placeholder

**3.2 Video Support**
- Presigned URL for video uploads
- Video transcoding to standard formats
- Thumbnail extraction from first frame
- Progress indicator for large files

**3.3 Bulk Upload**
- Multi-file selection
- Progress tracking per file
- Batch presigned URL generation
- Queue management

**3.4 Media Gallery**
- Browse previously uploaded media
- Reuse existing images
- Organize by purpose/date
- Search and filter

**3.5 CDN Optimization**
- Cache-Control headers (1 year for immutable files)
- Automatic image format selection (WebP/AVIF)
- Responsive image URLs (query params for size)
- GeoIP-based CDN routing

## Security Considerations

### Upload Security
1. **Authentication**: Require valid session for presigned URL generation
2. **Authorization**: Check tenant membership before allowing uploads
3. **File Type Validation**: Whitelist allowed MIME types, validate on server
4. **File Size Limits**: Enforce in presigned URL and backend validation
5. **Rate Limiting**: Prevent abuse with per-user upload quotas
6. **Content Scanning**: Future: Scan for malware, inappropriate content

### Access Control
1. **Public URLs**: Use CDN URLs without authentication (public media only)
2. **Private Media**: Future: Use signed URLs with expiration for private content
3. **Tenant Isolation**: Prefix S3 keys with `tenants/{tenantId}/` to prevent cross-tenant access
4. **Deletion**: Soft-delete in DB, async cleanup in S3 to prevent accidental data loss

### CORS Configuration
R2 bucket CORS policy:
```json
{
  "CorsRules": [
    {
      "AllowedOrigins": ["https://app.breederhq.com", "https://app.breederhq.test"],
      "AllowedMethods": ["PUT", "POST"],
      "AllowedHeaders": ["Content-Type", "Content-Length"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

## Monitoring & Maintenance

### Metrics to Track
- Upload success rate (uploads confirmed / presigned URLs issued)
- Average upload time
- Storage usage per tenant
- Bandwidth usage
- Failed uploads by error type

### Cleanup Strategy
1. **Orphaned Uploads**: Delete S3 objects with no confirmed upload after 24 hours
2. **Soft-Deleted Media**: Permanently delete from S3 after 30 days
3. **Unused Media**: Future: Identify and cleanup unreferenced media

### Cost Monitoring
- Set billing alerts on R2 dashboard
- Track storage growth trends
- Monitor bandwidth (should be $0 with R2)
- Optimize storage with compression, duplicate detection

## Migration Path

### From URLs to Uploads
1. **Backward Compatibility**: Continue supporting URL input indefinitely
2. **Import Existing**: Future tool to import external URLs into R2
3. **Gradual Adoption**: Users can switch at their own pace

### From R2 to Alternative Provider
1. **S3-Compatible API**: Easy migration to AWS S3, MinIO, etc.
2. **Export Tool**: Bulk download media with metadata
3. **URL Rewriting**: Update database URLs in batch migration

## Development Checklist

### Backend Tasks
- [ ] Set up Cloudflare R2 bucket
- [ ] Configure R2 CORS policy
- [ ] Set up CDN custom domain
- [ ] Implement `POST /api/v1/media/presigned-url` endpoint
- [ ] Implement `POST /api/v1/media/confirm-upload` endpoint
- [ ] Add Media table migration (optional)
- [ ] Add rate limiting middleware
- [ ] Add file type validation
- [ ] Add file size validation
- [ ] Write integration tests for upload flow

### Frontend Tasks
- [ ] Add API client methods: `requestPresignedUrl`, `confirmUpload`
- [ ] Update ImageUpload component with real upload logic
- [ ] Add upload progress indicator
- [ ] Add error handling and retry logic
- [ ] Add success feedback
- [ ] Test on desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile browsers (iOS Safari, Android Chrome)
- [ ] Test drag-and-drop (Phase 2b)
- [ ] Test paste from clipboard (Phase 2b)

### Testing Scenarios
- [ ] Upload valid image (JPG, PNG, WebP)
- [ ] Upload oversized image (> 10MB) - should fail
- [ ] Upload invalid file type (PDF, EXE) - should fail
- [ ] Upload with expired presigned URL - should fail
- [ ] Upload without authentication - should fail
- [ ] Upload to another tenant's prefix - should fail
- [ ] Confirm upload with invalid uploadId - should fail
- [ ] Test CDN URL accessibility after upload
- [ ] Test visibility toggle (public/private)
- [ ] Test concurrent uploads (multiple files)

## API Client Updates

File: `apps/marketplace/src/api/client.ts`

Add new methods:

```typescript
export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  purpose: "logo" | "banner" | "animal" | "offspring" | "post";
  context?: {
    animalId?: number;
    programId?: string;
  };
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  uploadId: string;
  expiresAt: string;
  maxSizeBytes: number;
}

export interface ConfirmUploadRequest {
  uploadId: string;
  publicUrl: string;
}

export interface ConfirmUploadResponse {
  ok: true;
  mediaId?: number;
}

// Add to Client class:
async requestPresignedUrl(req: PresignedUrlRequest): Promise<PresignedUrlResponse> {
  const res = await fetch(`${this.baseUrl}/api/v1/media/presigned-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...this.authHeaders(),
      ...this.tenantHeaders(),
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async confirmUpload(req: ConfirmUploadRequest): Promise<ConfirmUploadResponse> {
  const res = await fetch(`${this.baseUrl}/api/v1/media/confirm-upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...this.authHeaders(),
      ...this.tenantHeaders(),
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

## Timeline Estimate

**Phase 1: Backend Infrastructure**
- Backend setup and endpoints
- Basic upload flow working

**Phase 2: Frontend Integration**
- ImageUpload component functional
- Upload working in logo/banner fields
- Testing and bug fixes

**Phase 3: Advanced Features** (Future)
- Drag-and-drop, bulk upload, media gallery
- Image optimization, video support
- Analytics and monitoring

## References

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [MDN File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [CORS Configuration Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## Success Criteria

✅ **MVP Complete When:**
1. Breeders can click "Upload from device" button
2. File picker opens, user selects image
3. Image uploads directly to R2
4. CDN URL returned and displayed in preview
5. Save/publish flow works with uploaded images
6. No manual URL entry required for typical users
7. Power users can still use URL input if desired

✅ **Production Ready When:**
8. Mobile upload tested (iOS Safari, Android Chrome)
9. Error handling covers common failure modes
10. Rate limiting prevents abuse
11. Cost monitoring in place
12. Documentation for backend team complete
