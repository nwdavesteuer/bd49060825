#!/usr/bin/env node

// Prepare files and a shell script to render audio with the Hume CLI (Octave)
// Usage:
//   node scripts/prepare-hume-cli-render.mjs --years 2021,2022 [--limit 2]

import fs from 'fs'
import path from 'path'

// Use authoritative data directory (prefer fixed CSVs when present)
const CSV_DIR = path.join(process.cwd(), 'data')
const INPUT_DIR = path.join(process.cwd(), 'temp', 'hume-input')
const WAV_DIR = path.join(process.cwd(), 'public', 'audio', 'love-notes')
const MP3_DIR = path.join(process.cwd(), 'public', 'audio', 'love-notes-mp3')

function parseArgs() {
  const args = process.argv.slice(2)
  const options = { years: [], limit: null }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--years' && args[i+1]) options.years = args[++i].split(',').map(s => s.trim())
    else if (a === '--limit' && args[i+1]) options.limit = parseInt(args[++i], 10)
  }
  if (!options.years.length) {
    console.error('Usage: node scripts/prepare-hume-cli-render.mjs --years 2021,2022 [--limit 2]')
    process.exit(1)
  }
  return options
}

function ensureDirs() {
  for (const d of [INPUT_DIR, WAV_DIR, MP3_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
  }
}

function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split(/\r?\n/).filter(Boolean)
  lines.shift() // header
  const rows = []
  for (const line of lines) {
    const cols = []
    let cur = ''
    let inq = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inq && line[i+1] === '"') { cur += '"'; i++ } else { inq = !inq }
      } else if (ch === ',' && !inq) {
        cols.push(cur); cur = ''
      } else { cur += ch }
    }
    cols.push(cur)
    const [idRaw, text, date, emotion] = cols.map(c => c.replace(/^"|"$/g, ''))
    const id = String(idRaw).trim()
    if (!id || id.toLowerCase() === 'undefined' || id.toLowerCase() === 'nan') continue
    rows.push({ id, text, date, emotion: emotion || 'love' })
  }
  return rows
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
}

async function main() {
  const { years, limit } = parseArgs()
  ensureDirs()

  const planLines = []
  for (const year of years) {
    const fixed = path.join(CSV_DIR, `${year}-david-love-notes-for-audio-fixed.csv`)
    const standard = path.join(CSV_DIR, `${year}-david-love-notes-for-audio.csv`)
    const csvPath = fs.existsSync(fixed) ? fixed : standard
    if (!fs.existsSync(csvPath)) {
      console.warn(`CSV not found for ${year}: ${csvPath}`)
      continue
    }
    const rows = parseCsv(csvPath)
    const selected = limit ? rows.slice(0, limit) : rows
    for (const r of selected) {
      const base = `david-${year}-love-note-${r.id}`
      const txtPath = path.join(INPUT_DIR, `${year}`, `${base}.txt`)
      const wavPath = path.join(WAV_DIR, `${base}.wav`)
      const mp3Path = path.join(MP3_DIR, `${base}.mp3`)
      writeFile(txtPath, r.text ?? '')
      planLines.push(`${year},${r.id},${txtPath},${wavPath},${mp3Path}`)
    }
  }

  const planCsv = path.join(process.cwd(), 'scripts', 'hume-cli-plan.csv')
  writeFile(planCsv, ['year,id,text_path,wav_path,mp3_path', ...planLines].join('\n'))

  const renderSh = path.join(process.cwd(), 'scripts', 'hume-cli-render.sh')
  const sh = `#!/usr/bin/env bash
set -euo pipefail

MODEL="${process.env.HUME_MODEL_ID || 'octave'}"
VOICE="${process.env.HUME_VOICE_ID || 'David5'}"

while IFS=, read -r YEAR ID TEXT_PATH WAV_PATH MP3_PATH; do
  if [[ "$YEAR" == "year" ]]; then continue; fi
  echo "Rendering $YEAR/$ID"
  # Requires: npm i -g @humeai/cli and hume login (or HUME_API_KEY env)
  # Generate MP3s directly into the mp3 directory with the exact target name
  OUT_DIR_MP3=$(dirname "$MP3_PATH")
  PREFIX_MP3=$(basename "$MP3_PATH" .mp3)
  # Skip if already exists
  if [ -f "$MP3_PATH" ]; then
    echo "✓ exists: $MP3_PATH"
    continue
  fi
  if [ -n "$HUME_API_KEY" ]; then
    if ! hume tts "$(cat "$TEXT_PATH")" \
      --voice-name "$VOICE" \
      --output-dir "$OUT_DIR_MP3" \
      --prefix "$PREFIX_MP3" \
      --play off \
      --format mp3 \
      --api-key "$HUME_API_KEY"; then
      echo "! failed: $YEAR/$ID" >&2
      continue
    fi
  else
    if ! hume tts "$(cat "$TEXT_PATH")" \
      --voice-name "$VOICE" \
      --output-dir "$OUT_DIR_MP3" \
      --prefix "$PREFIX_MP3" \
      --play off \
      --format mp3; then
      echo "! failed: $YEAR/$ID" >&2
      continue
    fi
  fi
  # If the CLI added suffixes, normalize filename to the exact expected path
  if [ ! -f "$MP3_PATH" ]; then
    CAND=$(ls "$OUT_DIR_MP3"/"$PREFIX_MP3"* 2>/dev/null | head -n 1 || true)
    if [ -n "$CAND" ] && [ "$CAND" != "$MP3_PATH" ]; then
      mv -f "$CAND" "$MP3_PATH"
    fi
  fi
done < "${planCsv}"
`
  writeFile(renderSh, sh)
  fs.chmodSync(renderSh, 0o755)

  console.log(`Prepared ${planLines.length} items.`)
  console.log(`Plan CSV: ${planCsv}`)
  console.log(`Render script: ${renderSh}`)
  console.log('Run:')
  console.log(`  HUME_API_KEY=YOUR_KEY bash ${renderSh}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})


