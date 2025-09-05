#!/usr/bin/env node

// Upload MP3s and manifests to Supabase Storage via its S3-compatible API
// Required env:
// - SUPABASE_S3_ENDPOINT (e.g., https://<project-ref>.storage.supabase.co/storage/v1/s3)
// - SUPABASE_S3_REGION (e.g., us-east-2)
// - SUPABASE_S3_ACCESS_KEY_ID
// - SUPABASE_S3_SECRET_ACCESS_KEY
// - SUPABASE_BUCKET (e.g., love-notes)

import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const {
  SUPABASE_S3_ENDPOINT,
  SUPABASE_S3_REGION = 'us-east-2',
  SUPABASE_S3_ACCESS_KEY_ID,
  SUPABASE_S3_SECRET_ACCESS_KEY,
  SUPABASE_BUCKET = 'love-notes',
} = process.env

if (!SUPABASE_S3_ENDPOINT || !SUPABASE_S3_ACCESS_KEY_ID || !SUPABASE_S3_SECRET_ACCESS_KEY) {
  console.error('Missing S3 env. Need SUPABASE_S3_ENDPOINT, SUPABASE_S3_ACCESS_KEY_ID, SUPABASE_S3_SECRET_ACCESS_KEY')
  process.exit(1)
}

const s3 = new S3Client({
  region: SUPABASE_S3_REGION,
  endpoint: SUPABASE_S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: SUPABASE_S3_ACCESS_KEY_ID,
    secretAccessKey: SUPABASE_S3_SECRET_ACCESS_KEY,
  },
})

const MP3_DIR = path.join(process.cwd(), 'public', 'audio', 'love-notes-mp3')
const MANIFEST_DIR = path.join(process.cwd(), 'public', 'audio', 'love-notes-manifests')

async function uploadFile(key, absPath, contentType) {
  const body = await fsp.readFile(absPath)
  await s3.send(new PutObjectCommand({
    Bucket: SUPABASE_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=86400, immutable',
  }))
  console.log('Uploaded:', key)
}

async function main() {
  if (fs.existsSync(MP3_DIR)) {
    const files = await fsp.readdir(MP3_DIR)
    for (const f of files) {
      if (!f.endsWith('.mp3')) continue
      await uploadFile(`mp3/${f}`, path.join(MP3_DIR, f), 'audio/mpeg')
    }
  } else {
    console.warn('MP3 directory not found:', MP3_DIR)
  }

  if (fs.existsSync(MANIFEST_DIR)) {
    const files = await fsp.readdir(MANIFEST_DIR)
    for (const f of files) {
      if (!f.endsWith('.json')) continue
      await uploadFile(`manifests/${f}`, path.join(MANIFEST_DIR, f), 'application/json')
    }
  } else {
    console.warn('Manifest directory not found:', MANIFEST_DIR)
  }
}

main().catch(err => { console.error(err); process.exit(1) })




