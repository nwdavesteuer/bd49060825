#!/usr/bin/env node

// Build per-year CSVs that exactly match the audio files present in
// public/audio/love-notes-mp3 by looking up message text/date in Supabase

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio', 'love-notes-mp3')
const OUTPUT_DIR = path.join(process.cwd(), 'data')
const TABLE_NAME = 'fulldata_set'

// Load env from .env.local (preferred) then fall back to .env
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true })
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return '"' + str + '"'
}

async function fetchMessage(messageId) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('message_id, text, readable_date, primary_emotion')
    .eq('message_id', messageId)
    .limit(1)

  if (error) throw error
  return data && data.length ? data[0] : null
}

async function main() {
  if (!fs.existsSync(AUDIO_DIR)) {
    console.error('Audio directory not found:', AUDIO_DIR)
    process.exit(1)
  }

  const files = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'))
  if (files.length === 0) {
    console.log('No MP3 files found in', AUDIO_DIR)
    return
  }

  // Group by year
  const byYear = new Map()
  for (const file of files) {
    const m = file.match(/^david-(\d{4})-love-note-(\d+)\.mp3$/)
    if (!m) continue
    const year = m[1]
    const messageId = parseInt(m[2], 10)
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year).push({ file, year, messageId })
  }

  for (const [year, list] of [...byYear.entries()].sort()) {
    console.log(`\nProcessing year ${year} (${list.length} files) ...`)
    const rows = []
    for (const item of list) {
      try {
        const msg = await fetchMessage(item.messageId)
        if (!msg) {
          console.warn(`  ! No DB row for message_id ${item.messageId} (${item.file})`)
          rows.push({
            id: item.messageId,
            text: '',
            date: '',
            emotion: '',
            filename: item.file.replace('.mp3', '.wav'),
          })
          continue
        }

        // Normalize text: hide stray 0s
        const rawText = msg.text ?? ''
        const text = (rawText === 0 || rawText === '0') ? '' : String(rawText)
        const date = msg.readable_date || ''
        const emotion = msg.primary_emotion || 'love'

        rows.push({
          id: item.messageId,
          text,
          date,
          emotion,
          filename: item.file.replace('.mp3', '.wav'),
        })
      } catch (err) {
        console.warn(`  ! Error fetching ${item.messageId}:`, err.message)
      }
    }

    // Sort rows by date then id for stability
    rows.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.id - b.id)

    const header = ['id', 'text', 'date', 'emotion', 'filename']
    const csv = [header.join(',')]
    for (const r of rows) {
      csv.push([
        csvEscape(r.id),
        csvEscape(r.text),
        csvEscape(r.date),
        csvEscape(r.emotion),
        csvEscape(r.filename),
      ].join(','))
    }

    const outPath = path.join(OUTPUT_DIR, `${year}-david-love-notes-for-audio.csv`)
    fs.writeFileSync(outPath, csv.join('\n'))
    console.log(`  Wrote ${rows.length} rows → ${outPath}`)
  }

  console.log('\nDone.')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})


