# Async Filename Loading Explanation

## 🔄 What is Async Filename Loading?

**Async filename loading** means that instead of immediately knowing the audio filename when a component renders, we need to **wait** for the filename to be loaded from an external source.

## 📊 The Problem We Solved

### Before (Synchronous - didn't work):
```typescript
// ❌ This didn't work because the filename wasn't immediately available
const audioFilename = getAudioFilename(messageId, year) // Returns a Promise now!
```

### After (Asynchronous - works):
```typescript
// ✅ This works because we wait for the filename to be loaded
const filename = await getAudioFilename(messageId, year)
```

## 🔍 Why Was This Necessary?

1. **CSV Data Loading**: The correct audio filenames are stored in CSV files (like `2022-david-love-notes-for-audio.csv`)
2. **API Calls**: We need to make HTTP requests to load this CSV data
3. **File Existence Checks**: We need to verify if the audio file actually exists on the server

## 🏗️ How It Works in Our Code

### Step 1: Component Renders
```typescript
function MessageBubble({ message, showLoveNotes }) {
  const [audioFilename, setAudioFilename] = useState<string | null>(null)
  const [hasAudio, setHasAudio] = useState(false)
```

### Step 2: Async Effect Triggers
```typescript
useEffect(() => {
  const loadAudioFilename = async () => {
    if (showLoveNotes && String(message.is_from_me) === "1") {
      try {
        // Step 3: Load the correct filename from CSV
        const messageYear = message.year || new Date(message.readable_date).getFullYear()
        const messageId = String(message.message_id)
        const filename = await getAudioFilename(messageId, messageYear)
        const exists = await hasAudioFile(messageId, messageYear)
        
        // Step 4: Update state with the loaded filename
        setAudioFilename(filename)
        setHasAudio(exists)
      } catch (error) {
        console.error('Error loading audio filename:', error)
        setHasAudio(false)
      }
    } else {
      setHasAudio(false)
    }
  }

  loadAudioFilename()
}, [message, showLoveNotes])
```

### Step 3: Audio File Manager Loads CSV
```typescript
// In lib/audio-file-manager.ts
async function loadCSVForYear(year: number): Promise<Map<string, string>> {
  if (csvCache[year]) {
    return csvCache[year] // Return cached data if available
  }

  try {
    // Make API call to load CSV data
    const response = await fetch(`/api/love-notes/${year}`)
    if (!response.ok) {
      return new Map()
    }

    const csvText = await response.text()
    const lines = csvText.split('\n').slice(1) // Skip header
    const mapping = new Map<string, string>()

    // Parse CSV and create mapping
    for (const line of lines) {
      if (line.trim()) {
        const [id, , , , filename] = line.split(',').map(field => field.replace(/"/g, ''))
        if (id && filename) {
          mapping.set(id, filename)
        }
      }
    }

    csvCache[year] = mapping // Cache the result
    return mapping
  } catch (error) {
    console.error(`Error loading CSV for year ${year}:`, error)
    return new Map()
  }
}
```

### Step 4: Component Uses Loaded Filename
```typescript
// Step 5: Render audio control only if filename is loaded
{isLoveNote && audioFilename && (
  <EnhancedMessageAudioControl
    audioFile={audioFilename} // ✅ Now we have the correct filename!
    messageId={String(message.message_id)}
    year={message.year || new Date(message.readable_date).getFullYear()}
  />
)}
```

## 🎯 The Flow Diagram

```
1. MessageBubble renders
   ↓
2. useEffect triggers loadAudioFilename()
   ↓
3. getAudioFilename() called
   ↓
4. loadCSVForYear() called
   ↓
5. API call to /api/love-notes/[year]
   ↓
6. CSV file loaded and parsed
   ↓
7. Mapping created: messageId → filename
   ↓
8. hasAudioFile() checks if file exists
   ↓
9. State updated: setAudioFilename(filename)
   ↓
10. Component re-renders with audio control
```

## 🔧 Key Benefits

1. **Correct Filenames**: Uses the actual audio filenames from CSV files
2. **Performance**: Caches CSV data to avoid repeated API calls
3. **Error Handling**: Graceful fallbacks when files don't exist
4. **User Experience**: Audio controls only show when files are available

## 🐛 Common Issues Fixed

1. **404 Errors**: No more trying to load non-existent files
2. **Wrong Filenames**: Uses correct timestamp-based filenames
3. **Loading States**: Proper async handling with loading states
4. **Caching**: Efficient caching to avoid repeated API calls

## 📝 Example CSV Mapping

```csv
id,text,date,emotion,filename
"48663","Hey baby, sending you all my love...","2022-05-13T16:35:31.807+00:00","love","david-2022-love-note-48663.wav"
"40644","Thanks love, I am also feeling sad...","2022-01-05T08:39:12.403653+00:00","love","david-2022-love-note-40644.wav"
```

The async loading ensures we get the correct filename `david-2022-love-note-48663.wav` instead of trying to use a simple ID like `david-2022-love-note-48663.wav`. 