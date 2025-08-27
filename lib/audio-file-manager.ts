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
let audioFilenameByPrefixCache: Map<string, string> | null = null
const csvDateToFilenameCache: Record<number, Map<number, string>> = {}
const manifestCache: Record<number, Map<string, string>> = {}

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
    const dateToFilename = new Map<number, string>()

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
          const dateISO = fields[2].replace(/"/g, '').trim()
          if (id && filename && id !== 'undefined') {
            mapping.set(id, filename)
          }
          if (dateISO) {
            const t = Date.parse(dateISO)
            if (!Number.isNaN(t)) {
              // normalize to seconds
              const key = Math.floor(t / 1000)
              if (!dateToFilename.has(key)) dateToFilename.set(key, filename)
            }
          }
        }
      }
    }

    console.log(`📊 Loaded ${mapping.size} CSV mappings for year ${year}`)
    csvCache[year] = mapping
    csvDateToFilenameCache[year] = dateToFilename
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

async function loadManifest(year: number): Promise<Map<string, string>> {
  if (manifestCache[year]) return manifestCache[year]
  try {
    const manifestBase = (process as any)?.env?.NEXT_PUBLIC_MANIFEST_BASE_URL || ''
    const base = typeof manifestBase === 'string' && manifestBase.length > 0
      ? manifestBase.replace(/\/$/, '')
      : ''
    const url = base
      ? `${base}/${year}.json`
      : `/audio/love-notes-manifests/${year}.json`
    const res = await fetch(url)
    if (!res.ok) {
      // Cache negative result to avoid repeated 404 fetches
      const empty = new Map<string, string>()
      manifestCache[year] = empty
      return empty
    }
    const json = await res.json() as { year: number; entries: { csv_id: string; filename: string | null }[] }
    const map = new Map<string, string>()
    for (const e of json.entries) {
      if (e.filename) map.set(e.csv_id, e.filename)
    }
    manifestCache[year] = map
    return map
  } catch {
    const empty = new Map<string, string>()
    manifestCache[year] = empty
    return empty
  }
}

/**
 * Build and cache a Set of exact audio filenames for O(1) existence checks
 */
export async function getAudioFilenameSet(): Promise<Set<string>> {
  if (audioFilenameSetCache) return audioFilenameSetCache
  const files = await getAvailableAudioFilesWithMetadata()
  audioFilenameSetCache = new Set(files.map(f => f.filename))
  audioFilenameByPrefixCache = new Map()
  for (const f of files) {
    const prefix = f.filename.replace(/\.mp3$/, '')
    audioFilenameByPrefixCache.set(prefix, f.filename)
  }
  return audioFilenameSetCache
}

/** Resolve the actual filename for a given year/messageId.
 * Returns exact match if present, otherwise a best-effort by prefix
 */
export async function resolveAudioFilename(year: number, messageId: string): Promise<string | null> {
  // Prefer manifest mapping (authoritative for Love Notes)
  const man = await loadManifest(year)
  if (man.has(messageId)) return man.get(messageId) as string
  // Fallback to direct filesystem index
  const set = await getAudioFilenameSet()
  const exact = `david-${year}-love-note-${messageId}.mp3`
  if (set.has(exact)) return exact
  const prefix = `david-${year}-love-note-${messageId}`
  if (!audioFilenameByPrefixCache) return null
  for (const [p, fname] of audioFilenameByPrefixCache.entries()) {
    if (p.startsWith(prefix)) return fname
  }
  return null
}

/** Resolve filename by timestamp using year CSV when IDs don't match */
export async function resolveAudioFilenameByTimestamp(year: number, readableDate: string | Date): Promise<string | null> {
  const csvMap = await loadCSVForYear(year)
  // Ensure date cache exists
  const dateMap = csvDateToFilenameCache[year]
  if (!dateMap) return null
  const t = typeof readableDate === 'string' ? Date.parse(readableDate) : readableDate.getTime()
  if (Number.isNaN(t)) return null
  const sec = Math.floor(t / 1000)
  // Try exact second
  if (dateMap.has(sec)) return dateMap.get(sec) || null
  // Try within +/- 5 minutes
  const window = 5 * 60
  for (let delta = 1; delta <= window; delta++) {
    if (dateMap.has(sec + delta)) return dateMap.get(sec + delta) || null
    if (dateMap.has(sec - delta)) return dateMap.get(sec - delta) || null
  }
  return null
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
  const resolved = await resolveAudioFilename(year, messageId)
  return !!resolved
}

/**
 * Check multiple audio files at once (simplified approach)
 */
export async function checkMultipleAudioFiles(messages: Array<{messageId: string, year: number}>): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>()
  try {
    await Promise.all(messages.map(async ({ messageId, year }) => {
      const resolved = await resolveAudioFilename(year, messageId)
      results.set(messageId, !!resolved)
    }))
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