# Final Datasets

This directory contains the most recent and important datasets for the David-Nitzan conversation project.

## Current Files

### Primary Datasets
- `final_complete_david_nitzan_conversation.json` - Complete conversation dataset (34MB)
- `final_complete_david_nitzan_conversation.csv` - Complete conversation in CSV format (11MB)
- `final_complete_david_nitzan_conversation_supabase.json` - Supabase-compatible format (26MB)

### Supabase Import Files
- `supabase_exact_match.csv` - CSV matching original format exactly (9.4MB)
- `supabase_exact_match_minimal.csv` - Minimal version of exact match (9.3MB)
- `supabase_import_ready.json` - Clean JSON for Supabase import (23MB)
- `supabase_json_import.json` - Full JSON import file (23MB)
- `supabase_minimal_json.json` - Minimal JSON import file (11MB)

## Archive Locations

Old versions and experimental files have been moved to:
- `archive/supabase_exports/` - Various Supabase export attempts
- `archive/csv_versions/` - Different CSV format versions
- `archive/json_versions/` - Different JSON format versions
- `archive/sql_versions/` - SQL import files and chunks
- `archive/old_datasets/` - Previous dataset versions

## Usage

For Supabase import, try these files in order:
1. `supabase_exact_match.csv` (matches original format)
2. `supabase_json_import.json` (JSON format)
3. `supabase_import_ready.json` (clean JSON)

Last updated: 2025-07-29 20:28:54
