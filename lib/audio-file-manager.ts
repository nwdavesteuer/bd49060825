export interface AudioFileInfo {
  filename: string
  year: number
  messageId: string
  exists: boolean
}

export interface AudioFileStats {
  totalFiles: number
  filesByYear: Record<number, number>
  missingFiles: string[]
}

// Cache for CSV data to avoid repeated file reads
const csvCache: Record<number, Map<string, string>> = {}

// Cache for actual audio files to avoid repeated API calls
let audioFilesCache: AudioFileInfo[] | null = null
let audioFilenameSetCache: Set<string> | null = null

/**
 * Load CSV data for a specific year
 */
async function loadCSVForYear(year: number): Promise<Map<string, string>> {
  if (csvCache[year]) {
    return csvCache[year]
  }

  try {
    const response = await fetch(`/api/love-notes/${year}`)
    if (!response.ok) {
      console.warn(`Failed to load CSV for year ${year}`)
      return new Map()
    }

    const csvText = await response.text()
    const lines = csvText.split('\n').slice(1) // Skip header
    const mapping = new Map<string, string>()

    for (const line of lines) {
      if (line.trim()) {
        // Handle CSV parsing more robustly - split by comma but respect quotes
        const fields: string[] = []
        let currentField = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            fields.push(currentField.trim())
            currentField = ''
          } else {
            currentField += char
          }
        }
        fields.push(currentField.trim()) // Add the last field
        
        if (fields.length >= 5) {
          const id = fields[0].replace(/"/g, '').trim()
          const filename = fields[4].replace(/"/g, '').trim()
          if (id && filename && id !== 'undefined') {
            mapping.set(id, filename)
          }
        }
      }
    }

    console.log(`📊 Loaded ${mapping.size} CSV mappings for year ${year}`)
    csvCache[year] = mapping
    return mapping
  } catch (error) {
    console.error(`Error loading CSV for year ${year}:`, error)
    return new Map()
  }
}

/**
 * Get all available audio files with their metadata
 */
async function getAvailableAudioFilesWithMetadata(): Promise<AudioFileInfo[]> {
  if (audioFilesCache) {
    return audioFilesCache
  }

  try {
    const response = await fetch('/api/audio-files')
    if (!response.ok) {
      console.warn('Failed to load audio files list')
      return []
    }

    const audioFiles = await response.json()
    const fileInfos: AudioFileInfo[] = []

    for (const filename of audioFiles) {
      // Handle both naming patterns:
      // 1. david-{year}-love-note-{timestamp}_{sequence}.mp3 (2015-2017)
      // 2. david-{year}-love-note-{messageId}.mp3 (2018-2024)
      const match = filename.match(/david-(\d{4})-love-note-(.+)\.mp3/)
      if (match) {
        const year = parseInt(match[1])
        const messageId = match[2]
        fileInfos.push({
          filename,
          year,
          messageId,
          exists: true
        })
      }
    }

    audioFilesCache = fileInfos
    return fileInfos
  } catch (error) {
    console.error('Error getting available audio files:', error)
    return []
  }
}

/**
 * Build and cache a Set of exact audio filenames for O(1) existence checks
 */
export async function getAudioFilenameSet(): Promise<Set<string>> {
  if (audioFilenameSetCache) return audioFilenameSetCache
  const files = await getAvailableAudioFilesWithMetadata()
  audioFilenameSetCache = new Set(files.map(f => f.filename))
  return audioFilenameSetCache
}

/**
 * Dynamically detect available audio files in the love-notes directory
 */
export async function getAvailableAudioFiles(): Promise<AudioFileInfo[]> {
  return await getAvailableAudioFilesWithMetadata()
}

/**
 * Get audio file stats for a specific year
 */
export async function getAudioFileStats(year?: number): Promise<AudioFileStats> {
  const files = await getAvailableAudioFiles()
  
  const filesByYear: Record<number, number> = {}
  const missingFiles: string[] = []
  
  files.forEach(file => {
    filesByYear[file.year] = (filesByYear[file.year] || 0) + 1
  })
  
  // Calculate expected vs actual files for each year
  const expectedFiles = {
    2015: 171,
    2016: 103,
    2017: 18,
    2018: 28,
    2019: 32,
    2020: 43,
    2021: 39,
    2022: 78,
    2023: 76,
    2024: 39
  }
  
  Object.entries(expectedFiles).forEach(([yearStr, expected]) => {
    const yearNum = parseInt(yearStr)
    const actual = filesByYear[yearNum] || 0
    const missing = expected - actual
    
    if (missing > 0) {
      for (let i = 0; i < missing; i++) {
        missingFiles.push(`david-${yearStr}-love-note-${i}.mp3`)
      }
    }
  })
  
  return {
    totalFiles: files.length,
    filesByYear,
    missingFiles
  }
}

/**
 * Check if a specific audio file exists
 */
export async function hasAudioFile(messageId: string, year: number): Promise<boolean> {
  const filename = `david-${year}-love-note-${messageId}.mp3`
  const set = await getAudioFilenameSet()
  return set.has(filename)
}

/**
 * Check multiple audio files at once (simplified approach)
 */
export async function checkMultipleAudioFiles(messages: Array<{messageId: string, year: number}>): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>()
  try {
    const set = await getAudioFilenameSet()
    for (const {messageId, year} of messages) {
      const filename = `david-${year}-love-note-${messageId}.mp3`
      results.set(messageId, set.has(filename))
    }
  } catch (error) {
    console.error('Error checking multiple audio files:', error)
  }
  return results
}

/**
 * Get the correct audio filename for a message
 */
export async function getAudioFilename(messageId: string, year: number): Promise<string> {
  try {
    // IMPORTANT: Don't use CSV files - they have wrong IDs
    // Just construct the filename directly with the database message ID
    // Format: david-{year}-love-note-{messageId}.mp3
    const filename = `david-${year}-love-note-${messageId}.mp3`
    
    console.log(`🎵 Constructed filename: ${filename} for message ${messageId} year ${year}`)
    
    // Return the filename - the UI will check if it exists
    return filename
  } catch (error) {
    console.error(`Error getting audio filename for message ${messageId} year ${year}:`, error)
    return `david-${year}-love-note-${messageId}.mp3`
  }
}

/**
 * Get all audio files for a specific year
 */
export async function getAudioFilesForYear(year: number): Promise<string[]> {
  try {
    const audioFiles = await getAvailableAudioFilesWithMetadata()
    return audioFiles.filter(file => file.year === year).map(f => f.filename)
  } catch (error) {
    console.error(`Error getting audio files for year ${year}:`, error)
    return []
  }
} 