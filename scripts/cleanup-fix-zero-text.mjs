#!/usr/bin/env node
// Normalize any rows where text is 0 or "0" to NULL in Supabase

// Load .env.local manually without adding a dependency
import fs from 'node:fs'
import path from 'node:path'
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) {
      const key = m[1]
      let val = m[2]
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1)
      }
      process.env[key] = val
    }
  }
}
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(url, anon)
const TABLE = process.env.TABLE_NAME || 'fulldata_set'

async function run() {
  try {
    console.log(`Checking for zero-text rows in ${TABLE}...`)

    // Update numeric 0
    let { error: e1 } = await supabase
      .from(TABLE)
      .update({ text: null })
      .eq('text', 0)

    if (e1) throw e1

    // Update string '0'
    let { error: e2 } = await supabase
      .from(TABLE)
      .update({ text: null })
      .eq('text', '0')

    if (e2) throw e2

    console.log('✅ Cleanup complete. Rows where text was 0 or "0" are now NULL.')
  } catch (err) {
    console.error('Cleanup failed:', err)
    process.exit(1)
  }
}

run()


