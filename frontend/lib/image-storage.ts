// Image storage utilities for Supabase Storage + Cloudflare Images

import { createBrowserClient } from './supabase'

const CLOUDFLARE_ACCOUNT_ID = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID
const CLOUDFLARE_IMAGES_BASE = CLOUDFLARE_ACCOUNT_ID
  ? `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_ID}`
  : null

export interface UploadResult {
  url: string
  thumbnailUrl?: string
  publicUrl: string
}

/**
 * Normalize MIME type for image files
 */
function normalizeMimeType(file: File): string {
  const type = file.type.toLowerCase()
  const ext = file.name.split('.').pop()?.toLowerCase()

  // Normalize common image MIME types
  if (type === 'image/jpg' || ext === 'jpg' || ext === 'jpeg') {
    return 'image/jpeg'
  }
  if (type === 'image/png' || ext === 'png') {
    return 'image/png'
  }
  if (type === 'image/webp' || ext === 'webp') {
    return 'image/webp'
  }

  // Return original type if already normalized
  return type
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImageToSupabase(
  file: File,
  userId: string,
  pathPrefix: string = 'pins'
): Promise<string> {
  const supabase = createBrowserClient()
  
  const fileExt = file.name.split('.').pop()?.toLowerCase()
  const fileName = `${pathPrefix}/${userId}/${Date.now()}.${fileExt}`
  const filePath = fileName

  // Normalize MIME type to ensure compatibility
  const normalizedMimeType = normalizeMimeType(file)
  
  console.log('Uploading image:', {
    fileName: file.name,
    originalType: file.type,
    normalizedType: normalizedMimeType,
    size: file.size,
  })

  // Create a new File with normalized MIME type if needed
  const normalizedFile = file.type !== normalizedMimeType
    ? new File([file], file.name, { type: normalizedMimeType })
    : file

  const { data, error } = await supabase.storage
    .from('pin-images')
    .upload(filePath, normalizedFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: normalizedMimeType,
    })

  if (error) {
    console.error('Supabase upload error:', error)
    // Provide more helpful error message
    if (error.message.includes('mime type') || error.message.includes('MIME')) {
      throw new Error(`Image type not supported by storage. Please use JPEG, PNG, or WebP format. (Received: ${file.type || 'unknown'})`)
    }
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('pin-images')
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * Process image through Cloudflare Images (if configured)
 * Returns optimized URLs for CDN delivery
 */
export async function processWithCloudflare(
  supabaseUrl: string,
  options?: {
    width?: number
    height?: number
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
    quality?: number
  }
): Promise<string | null> {
  if (!CLOUDFLARE_IMAGES_BASE) {
    // Cloudflare not configured, return original URL
    return supabaseUrl
  }

  // Extract image path from Supabase URL
  // Format: https://[project].supabase.co/storage/v1/object/public/pin-images/[path]
  const urlParts = supabaseUrl.split('/pin-images/')
  if (urlParts.length < 2) {
    return supabaseUrl
  }

  const imagePath = urlParts[1]
  
  // Build Cloudflare Images URL
  // Format: https://imagedelivery.net/[account-id]/[image-id]/[variant]
  // For now, we'll use the Supabase URL directly
  // In production, you'd upload to Cloudflare Images first, then serve from there
  
  // TODO: Implement Cloudflare Images upload API integration
  // This requires server-side processing due to API token security
  
  return supabaseUrl
}

/**
 * Generate thumbnail URL
 */
export function getThumbnailUrl(
  originalUrl: string,
  width: number = 400,
  height: number = 400
): string {
  if (CLOUDFLARE_IMAGES_BASE) {
    // Use Cloudflare Images for thumbnails
    // This would require proper Cloudflare Images integration
    // For now, return original URL
    return originalUrl
  }

  // For Supabase, you could use image transformations if available
  // Or serve original and let browser scale
  return originalUrl
}

/**
 * Upload and process image (main function)
 */
export async function uploadPinImage(
  file: File,
  userId: string
): Promise<UploadResult> {
  // Validate file
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB')
  }

  // Normalize and validate MIME type
  const normalizedType = normalizeMimeType(file)
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
  
  if (!acceptedTypes.includes(normalizedType)) {
    // Check by file extension as fallback
    const ext = file.name.split('.').pop()?.toLowerCase()
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp']
    
    if (!ext || !validExtensions.includes(ext)) {
      throw new Error(`Image must be JPEG, PNG, or WebP format. (Detected: ${file.type || 'unknown'})`)
    }
  }

  // Upload to Supabase Storage
  const publicUrl = await uploadImageToSupabase(file, userId)

  // Process with Cloudflare (if configured)
  const optimizedUrl = await processWithCloudflare(publicUrl, {
    width: 1200,
    height: 1200,
    fit: 'cover',
    quality: 85,
  })

  // Generate thumbnail
  const thumbnailUrl = getThumbnailUrl(optimizedUrl || publicUrl, 400, 400)

  return {
    url: optimizedUrl || publicUrl,
    thumbnailUrl,
    publicUrl,
  }
}

