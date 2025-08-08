#!/usr/bin/env node

// Rerender love-notes audio via Hume TTS from CSVs with correct message IDs
// Usage:
//   node scripts/rerender-from-csv.mjs --years 2021,2022 --limit 2 [--apply]
// Env:
//   HUME_API_KEY (required)
//   HUME_TTS_URL  (optional, default: 'https://api.hume.ai/v0/text-to-speech')
//   HUME_MODEL_ID (optional, default: 'octave')
//   HUME_VOICE_ID (optional, default: 'David5')

import fs from 'fs'
import path from 'path'
import os from 'os'
import dotenv from 'dotenv'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffmpeg from 'fluent-ffmpeg'

// Load .env.local without overriding already-set env vars (e.g., when passed inline)
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false })
dotenv.config({ override: false })

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const CSV_DIR = path.join(process.cwd(), 'public', 'data')
const WAV_DIR = path.join(process.cwd(), 'public', 'audio', 'love-notes')
const MP3_DIR = path.join(process.cwd(), 'public', 'audio', 'love-notes-mp3')

const HUME_API_KEY = process.env.HUME_API_KEY
const HUME_TTS_URL = process.env.HUME_TTS_URL || 'https://api.hume.ai/v0/text-to-speech'
const HUME_MODEL_ID = process.env.HUME_MODEL_ID || 'octave'
const HUME_VOICE_ID = process.env.HUME_VOICE_ID || 'David5'

if (!HUME_API_KEY) {
  console.error('HUME_API_KEY is required (set via env or .env.local)')
  process.exit(1)
}

function parseArgs() {
  const args = process.argv.slice(2)
  const options = { years: [], limit: null, apply: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--years' && args[i+1]) options.years = args[++i].split(',').map(s => s.trim())
    else if (a === '--limit' && args[i+1]) options.limit = parseInt(args[++i], 10)
    else if (a === '--apply') options.apply = true
  }
  if (!options.years.length) {
    console.error('Usage: node scripts/rerender-from-csv.mjs --years 2021,2022 [--limit 2] [--apply]')
    process.exit(1)
  }
  return options
}

function ensureDirs() {
  for (const d of [WAV_DIR, MP3_DIR]) {
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
    const [id, text, date, emotion] = cols.map(c => c.replace(/^"|"$/g, ''))
    rows.push({ id: parseInt(id, 10), text, date, emotion: emotion || 'love' })
  }
  return rows
}

async function humeTTS({ text, model_id, voice_id }) {
  const resp = await fetch(HUME_TTS_URL, {
    method: 'POST',
    headers: {
      'X-Hume-Api-Key': HUME_API_KEY,
      'Content-Type': 'application/json',
    },
    // Include both voice and voice_id for compatibility across Hume APIs
    body: JSON.stringify({ text, model_id, voice_id, voice: voice_id }),
  })
  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Hume TTS failed ${resp.status}: ${errText}`)
  }
  const data = await resp.json()
  if (!data || !data.audio) throw new Error('Hume TTS response missing audio')
  return Buffer.from(data.audio, 'base64')
}

async function writeFile(filePath, buffer) {
  await fs.promises.writeFile(filePath, buffer)
}

function convertToMp3(wavPath, mp3Path) {
  return new Promise((resolve, reject) => {
    ffmpeg(wavPath)
      .audioCodec('libmp3lame')
      .outputOptions(['-q:a 2'])
      .on('end', resolve)
      .on('error', reject)
      .save(mp3Path)
  })
}

async function processYear(year, rows, limit, apply) {
  console.log(`\nYear ${year} — ${rows.length} rows${limit ? ` (limit ${limit})` : ''}`)
  const selected = limit ? rows.slice(0, limit) : rows
  let done = 0
  for (const r of selected) {
    const base = `david-${year}-love-note-${r.id}`
    const wavPath = path.join(WAV_DIR, `${base}.wav`)
    const mp3Path = path.join(MP3_DIR, `${base}.mp3`)

    if (fs.existsSync(mp3Path)) {
      console.log(`  ✓ exists: ${path.basename(mp3Path)}`)
      done++; continue
    }

    console.log(`  ${apply ? 'render' : 'plan  '} ${base} — text: ${r.text.slice(0, 60)}...`)
    if (!apply) continue

    const audio = await humeTTS({ text: r.text, model_id: HUME_MODEL_ID, voice_id: HUME_VOICE_ID })
    await writeFile(wavPath, audio)
    await convertToMp3(wavPath, mp3Path)
    done++
  }
  console.log(`  ${apply ? 'Rendered/converted' : 'Planned'} ${done} files`)
}

async function main() {
  const { years, limit, apply } = parseArgs()
  ensureDirs()
  for (const year of years) {
    const csvPath = path.join(CSV_DIR, `${year}-david-love-notes-for-audio.csv`)
    if (!fs.existsSync(csvPath)) {
      console.warn(`CSV not found for ${year}: ${csvPath}`)
      continue
    }
    const rows = parseCsv(csvPath)
    await processYear(year, rows, limit, apply)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})


