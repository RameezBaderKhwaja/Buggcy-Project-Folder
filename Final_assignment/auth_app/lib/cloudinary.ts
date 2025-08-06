import { v2 as cloudinary } from "cloudinary"
import { CLOUDINARY_CONFIG } from "./config"

if (CLOUDINARY_CONFIG.CLOUD_NAME && CLOUDINARY_CONFIG.API_KEY && CLOUDINARY_CONFIG.API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
    api_key: CLOUDINARY_CONFIG.API_KEY,
    api_secret: CLOUDINARY_CONFIG.API_SECRET,
  })
}

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
}

export async function uploadImage(
  file: Buffer | string,
  folder?: string,
  options?: {
    public_id?: string
    transformation?: Record<string, unknown>
  }
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(file as string, {
      folder: folder || "user_profiles",
      public_id: options?.public_id,
      transformation: options?.transformation || {
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "face",
        quality: "auto",
        format: "webp",
      },
      ...(options || {}),
    })

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    }
  } catch (error: unknown) {
    console.error("Cloudinary upload error:", error)
    throw new Error("Failed to upload image")
  }
}

export async function uploadToCloudinary(
  file: Buffer,
  options?: {
    folder?: string
    transformation?: Record<string, unknown>
  }
): Promise<CloudinaryUploadResult> {
  try {
    // Convert Buffer to base64 data URL
    const base64String = `data:image/jpeg;base64,${file.toString('base64')}`
    
    const result = await cloudinary.uploader.upload(base64String, {
      folder: options?.folder || "user_profiles",
      transformation: options?.transformation || {
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "face",
        quality: "auto",
        format: "webp",
      },
    })

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    }
  } catch (error: unknown) {
    console.error("Cloudinary upload error:", error)
    throw new Error("Failed to upload image to Cloudinary")
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return deleteImage(publicId)
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error: unknown) {
    console.error("Cloudinary delete error:", error)
    throw new Error("Failed to delete image")
  }
}

export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: string | number
    format?: string
  } = {},
): string {
  return cloudinary.url(publicId, {
    width: options.width || 400,
    height: options.height || 400,
    crop: "fill",
    gravity: "face",
    quality: options.quality || "auto",
    format: options.format || "webp",
  })
}
