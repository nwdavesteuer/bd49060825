#!/usr/bin/env node

// Build per-year manifests mapping CSV rows to actual MP3 filenames
// Usage: node scripts/build-love-notes-manifests.mjs --years 2017,2018,...

import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const MP3_DIR = path.join(process.cwd(), 'public', 'audio', 'love-notes-mp3')
const OUT_DIR = path.join(process.cwd(), 'public', 'audio', 'love-notes-manifests')

function parseArgs() {
  const args = process.argv.slice(2)
  const options = { years: [] }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--years' && args[i+1]) options.years = args[++i].split(',').map(s => s.trim())
  }
  if (!options.years.length) {
    console.error('Usage: node scripts/build-love-notes-manifests.mjs --years 2017,2018,...')
    process.exit(1)
  }
  return options
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
    const [idRaw, text, date, emotion, filename] = cols.map(c => c.replace(/^"|"$/g, ''))
    const id = String(idRaw).trim()
    if (!id || id.toLowerCase() === 'undefined' || id.toLowerCase() === 'nan') continue
    rows.push({ id, text, date, emotion: emotion || 'love', filename })
  }
  return rows
}

function findMp3For(year, id) {
  const base = `david-${year}-love-note-${id}`
  const exact = path.join(MP3_DIR, `${base}.mp3`)
  if (fs.existsSync(exact)) return path.basename(exact)
  // fallback: first prefix match
  const files = fs.readdirSync(MP3_DIR).filter(f => f.startsWith(base) && f.endsWith('.mp3'))
  return files[0] || null
}

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }) }

async function main() {
  const { years } = parseArgs()
  ensureDir(OUT_DIR)
  for (const year of years) {
    const fixed = path.join(DATA_DIR, `${year}-david-love-notes-for-audio-fixed.csv`)
    const standard = path.join(DATA_DIR, `${year}-david-love-notes-for-audio.csv`)
    const csvPath = fs.existsSync(fixed) ? fixed : standard
    if (!fs.existsSync(csvPath)) {
      console.warn(`CSV not found for ${year}: ${csvPath}`)
      continue
    }
    const rows = parseCsv(csvPath)
    const manifest = rows.map(r => {
      const mp3 = findMp3For(year, r.id)
      return {
        year: Number(year),
        csv_id: r.id,
        date: r.date || null,
        filename: mp3,
        hasAudio: !!mp3
      }
    })
    const outFile = path.join(OUT_DIR, `${year}.json`)
    fs.writeFileSync(outFile, JSON.stringify({ year: Number(year), entries: manifest }, null, 2))
    console.log(`Built manifest for ${year}: ${manifest.length} entries → ${outFile}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })





