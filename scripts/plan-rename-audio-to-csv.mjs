#!/usr/bin/env node

// Plan a batch rename of MP3 files so their message_id matches the intended
// IDs from the per-year CSV (public/data/{year}-david-love-notes-for-audio.csv).
// Matching uses Supabase text/date for each existing MP3 and finds the best
// CSV row by a combined text-similarity and date-proximity score.

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true })
dotenv.config()

const TABLE_NAME = 'fulldata_set'
const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio', 'love-notes-mp3')
const CSV_DIR_PUBLIC = path.join(process.cwd(), 'public', 'data')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseKey)

function parseArgs() {
  const args = process.argv.slice(2)
  const options = { year: null, dryRun: true }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--year' && args[i+1]) { options.year = args[++i] }
    else if (a === '--apply') { options.dryRun = false }
    else if (a === '--dry-run') { options.dryRun = true }
  }
  if (!options.year) {
    console.error('Usage: node scripts/plan-rename-audio-to-csv.mjs --year 2021 [--apply]')
    process.exit(1)
  }
  return options
}

function normalizeText(s) {
  if (!s) return ''
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function jaccardSimilarity(a, b) {
  const A = new Set(normalizeText(a).split(' ').filter(Boolean))
  const B = new Set(normalizeText(b).split(' ').filter(Boolean))
  if (A.size === 0 && B.size === 0) return 1
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  const union = A.size + B.size - inter
  return union === 0 ? 0 : inter / union
}

function dateScore(a, b) {
  if (!a || !b) return 0
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  if (isNaN(da) || isNaN(db)) return 0
  const days = Math.abs(da - db) / (1000 * 60 * 60 * 24)
  // within same day ~1, degrade with distance
  return 1 / (1 + days)
}

async function fetchMessage(messageId) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('message_id, text, readable_date')
    .eq('message_id', messageId)
    .limit(1)
  if (error) throw error
  return data && data.length ? data[0] : null
}

async function loadCsvRows(year) {
  const csvPath = path.join(CSV_DIR_PUBLIC, `${year}-david-love-notes-for-audio.csv`)
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`)
  }
  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.split(/\r?\n/).filter(Boolean)
  const header = lines.shift()
  const rows = []
  for (const line of lines) {
    // naive CSV split that respects quotes
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
    const [id, text, date, emotion, filename] = cols.map(c => c.replace(/^"|"$/g, ''))
    rows.push({ id: parseInt(id, 10), text, date, emotion, filename })
  }
  return rows
}

async function main() {
  const { year, dryRun } = parseArgs()
  const audioFiles = fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith(`david-${year}-love-note-`) && f.endsWith('.mp3'))
  if (audioFiles.length === 0) {
    console.error('No audio files for year', year)
    process.exit(1)
  }
  const csvRows = await loadCsvRows(year)

  // Build DB info for each audio file
  const audioInfo = []
  for (const file of audioFiles) {
    const m = file.match(/david-(\d{4})-love-note-(\d+)\.mp3/)
    if (!m) continue
    const messageId = parseInt(m[2], 10)
    const db = await fetchMessage(messageId)
    audioInfo.push({ file, messageId, text: db?.text ?? '', date: db?.readable_date ?? '' })
  }

  // Matching
  const remaining = new Set(audioInfo.map((_, i) => i))
  const mappings = []
  for (const row of csvRows) {
    let bestIdx = -1
    let bestScore = -1
    for (const idx of remaining) {
      const cand = audioInfo[idx]
      const tScore = jaccardSimilarity(row.text, cand.text)
      const dScore = dateScore(row.date, cand.date)
      const score = 0.7 * tScore + 0.3 * dScore
      if (score > bestScore) { bestScore = score; bestIdx = idx }
    }
    if (bestIdx >= 0) {
      mappings.push({
        csvId: row.id,
        csvDate: row.date,
        csvSnippet: row.text.slice(0, 60),
        fromFile: audioInfo[bestIdx].file,
        fromId: audioInfo[bestIdx].messageId,
        fromDate: audioInfo[bestIdx].date,
        fromSnippet: String(audioInfo[bestIdx].text || '').slice(0, 60),
        score: bestScore,
      })
      remaining.delete(bestIdx)
    }
  }

  // Report
  const high = mappings.filter(m => m.score >= 0.6)
  const med = mappings.filter(m => m.score >= 0.4 && m.score < 0.6)
  const low = mappings.filter(m => m.score < 0.4)
  console.log(`\nYear ${year}: ${audioFiles.length} audio files; ${csvRows.length} csv rows`)
  console.log(`High-confidence matches (>=0.6): ${high.length}`)
  console.log(`Medium-confidence matches (0.4-0.6): ${med.length}`)
  console.log(`Low-confidence matches (<0.4): ${low.length}`)

  // Emit rename commands
  const plan = []
  for (const m of mappings) {
    const newName = `david-${year}-love-note-${m.csvId}.mp3`
    if (m.fromFile !== newName) {
      plan.push({ from: m.fromFile, to: newName, score: m.score })
    }
  }

  console.log(`\nProposed renames: ${plan.length}`)
  for (const p of plan) {
    console.log(`${p.score.toFixed(2)}  ${p.from} -> ${p.to}`)
  }

  if (dryRun) {
    console.log('\nDry-run only. To apply, rerun with --apply')
    return
  }

  // Apply renames
  let applied = 0
  for (const p of plan) {
    const src = path.join(AUDIO_DIR, p.from)
    const dst = path.join(AUDIO_DIR, p.to)
    if (fs.existsSync(dst)) {
      console.warn('Skipping, target exists:', p.to)
      continue
    }
    fs.renameSync(src, dst)
    applied++
  }
  console.log(`\nApplied ${applied} renames.`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})


