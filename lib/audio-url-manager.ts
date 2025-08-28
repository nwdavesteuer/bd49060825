import { getAudioFileUrl, getS3AudioFileUrl } from './supabase-storage'

/**
 * Get the appropriate URL for an audio file, trying multiple sources
 */
export function getAudioUrl(filename: string): string {
  // For now, we'll use the Supabase public URL
  // If that doesn't work, we could fall back to local files
  const supabaseUrl = getAudioFileUrl(filename)
  
  // You can also try the S3-compatible URL if the public URL doesn't work:
  // const s3Url = getS3AudioFileUrl(filename)
  
  return supabaseUrl
}

/**
 * Get the base path for audio files based on environment
 */
export function getAudioBasePath(): string {
  // Check if we should use Supabase storage or local files
  const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE_STORAGE !== 'false'
  
  if (useSupabase) {
    return 'https://fblwndzprmvjajayxjln.supabase.co/storage/v1/object/public/love-notes/mp3'
  }
  
  // Fallback to local files
  return '/audio/love-notes-mp3'
}

/**
 * Construct the full URL for an audio file
 */
export function constructAudioUrl(filename: string): string {
  const basePath = getAudioBasePath()
  return `${basePath}/${filename}`
}
