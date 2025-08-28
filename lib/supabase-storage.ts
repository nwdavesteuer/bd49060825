import { supabase } from './supabase'

// Supabase storage configuration
const BUCKET_NAME = 'love-notes'
const MP3_PATH = 'mp3'
const MANIFEST_PATH = 'manifests'

/**
 * Get a signed URL for an audio file from Supabase storage
 * Note: Files are in root directory, not in mp3/ subfolder
 */
export async function getAudioFileUrl(filename: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filename, 3600) // 1 hour expiry
    
    if (error) {
      console.error('Error creating signed URL:', error.message)
      return null
    }
    
    return data.signedUrl
  } catch (error) {
    console.error('Error creating signed URL:', error)
    return null
  }
}

/**
 * Get the public URL for an audio file (fallback method)
 * Note: This may not work if bucket is not truly public
 */
export function getPublicAudioFileUrl(filename: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename) // Files are in root, no mp3/ prefix
  
  return data.publicUrl
}

/**
 * Get a signed URL for a manifest file from Supabase storage
 */
export async function getManifestUrl(year: number): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(`${year}.json`, 3600) // Manifests might be in root too
    
    if (error) {
      console.error('Error creating signed URL for manifest:', error.message)
      return null
    }
    
    return data.signedUrl
  } catch (error) {
    console.error('Error creating signed URL for manifest:', error)
    return null
  }
}

/**
 * Check if an audio file exists in Supabase storage
 */
export async function checkAudioFileExists(filename: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(MP3_PATH, {
        search: filename
      })
    
    if (error) {
      console.error('Error checking file existence:', error)
      return false
    }
    
    return data?.some(file => file.name === filename) || false
  } catch (error) {
    console.error('Error checking file existence:', error)
    return false
  }
}

/**
 * List all audio files in Supabase storage
 */
export async function listAudioFiles(): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(MP3_PATH)
    
    if (error) {
      console.error('Error listing audio files:', error)
      return []
    }
    
    return data?.map(file => file.name) || []
  } catch (error) {
    console.error('Error listing audio files:', error)
    return []
  }
}

/**
 * Get the base URL for constructing direct S3-compatible URLs
 * This might be needed if the public URLs don't work due to permissions
 */
export function getS3BaseUrl(): string {
  return `https://fblwndzprmvjajayxjln.storage.supabase.co/storage/v1/s3/${BUCKET_NAME}`
}

/**
 * Get S3-compatible URL for an audio file
 */
export function getS3AudioFileUrl(filename: string): string {
  return `${getS3BaseUrl()}/${MP3_PATH}/${filename}`
}

/**
 * Get S3-compatible URL for a manifest file
 */
export function getS3ManifestUrl(year: number): string {
  return `${getS3BaseUrl()}/${MANIFEST_PATH}/${year}.json`
}
