#!/usr/bin/env node

import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = process.env.SUPABASE_BUCKET || 'love-notes'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MP3_DIR = path.join(process.cwd(), 'public', 'audio', 'love-notes-mp3')
const MANIFEST_DIR = path.join(process.cwd(), 'public', 'audio', 'love-notes-manifests')

async function uploadFile(key, absPath, contentType) {
  const buf = await fsp.readFile(absPath)
  const { error } = await supabase.storage.from(BUCKET).upload(key, buf, {
    upsert: true,
    contentType,
    cacheControl: '86400, immutable'
  })
  if (error) {
    console.error(`Upload failed: ${key}`, error.message)
  } else {
    console.log(`Uploaded: ${key}`)
  }
}

async function main() {
  // Ensure bucket exists
  // Note: bucket creation requires Admin API; assume created ahead of time via dashboard

  // Upload MP3s
  if (fs.existsSync(MP3_DIR)) {
    const files = await fsp.readdir(MP3_DIR)
    for (const f of files) {
      if (!f.endsWith('.mp3')) continue
      const key = `mp3/${f}`
      await uploadFile(key, path.join(MP3_DIR, f), 'audio/mpeg')
    }
  } else {
    console.warn('MP3 directory not found:', MP3_DIR)
  }

  // Upload manifests
  if (fs.existsSync(MANIFEST_DIR)) {
    const files = await fsp.readdir(MANIFEST_DIR)
    for (const f of files) {
      if (!f.endsWith('.json')) continue
      const key = `manifests/${f}`
      await uploadFile(key, path.join(MANIFEST_DIR, f), 'application/json')
    }
  } else {
    console.warn('Manifest directory not found:', MANIFEST_DIR)
  }
}

main().catch(err => { console.error(err); process.exit(1) })




