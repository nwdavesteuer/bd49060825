# David-Nitzan iMessage Extraction Project

This project contains the complete extraction and processing of David-Nitzan iMessage conversations from multiple data sources.

## Project Structure

### 📁 final_datasets/
Contains the final, verified datasets ready for use:
- **final_complete_david_nitzan_conversation.json** - Complete conversation (46,562 messages)
- **final_complete_david_nitzan_conversation.csv** - Supabase-ready CSV
- **final_complete_david_nitzan_conversation_supabase.json** - Supabase-ready JSON

### 📁 scripts/
All Python scripts used for extraction and processing:
- Extraction scripts (imessage_extractor.py, etc.)
- Processing scripts (filter_direct_messages.py, etc.)
- Verification scripts (verify_complete_extraction.py, etc.)

### 📁 archive/
Intermediate and outdated files from the extraction process:
- Various extraction results and intermediate datasets
- Kept for reference but not the authoritative versions

### 📁 backups/
Backup files from earlier extractions:
- Various backup datasets and exports
- Historical extraction results

### 📁 supabase_exports/
Supabase-specific export files:
- Supabase extractors and structure files
- Supabase-ready exports

### 📁 guides/
Project documentation and guides:
- GIFT_PROJECT_GUIDE.md
- NITZAN_EXTRACTION_GUIDE.md
- README.md
- SUPABASE_IMPORT_SUMMARY.md

### 📁 temp/
Temporary files that can be deleted:
- Example files and temporary scripts
- Files that are no longer needed

## Data Quality

The final dataset contains:
- ✅ 46,562 messages from July 2015 - July 2025
- ✅ Only direct David-Nitzan conversations
- ✅ No group chats or other people
- ✅ Chronologically ordered
- ✅ Proper sender identification
- ✅ All data sources verified and deduplicated

## Usage

1. **For Supabase import**: Use files in `final_datasets/`
2. **For analysis**: Use the JSON files in `final_datasets/`
3. **For reproduction**: Use scripts in `scripts/`
4. **For reference**: Check files in `archive/`

## Key Files

- **final_datasets/final_complete_david_nitzan_conversation.json** - The definitive dataset
- **scripts/create_final_complete_dataset.py** - Script that created the final dataset
- **guides/README.md** - Main project documentation
