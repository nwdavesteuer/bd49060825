# David-Nitzan Conversation Dataset

## Final Datasets

This directory contains the final, verified David-Nitzan conversation datasets ready for use.

### Files:

1. **final_complete_david_nitzan_conversation.json** - Complete conversation dataset (46,562 messages)
   - Date range: July 23, 2015 - July 27, 2025
   - David: 17,388 messages (37.3%)
   - Nitzan: 29,174 messages (62.7%)
   - All sources verified and deduplicated

2. **final_complete_david_nitzan_conversation.csv** - Supabase-ready CSV format
   - Same data as JSON but in CSV format for database import

3. **final_complete_david_nitzan_conversation_supabase.json** - Supabase-ready JSON format
   - Optimized JSON structure for Supabase import

4. **pure_david_nitzan_no_jonathan.json/csv/supabase.json** - Alternative versions
   - Same data but from different processing steps

## Usage

These files are ready for:
- Supabase database import
- Analysis and processing
- Backup and archival

## Data Quality

- ✅ Only direct David-Nitzan conversations
- ✅ No group chats or other people
- ✅ Chronologically ordered
- ✅ Proper sender identification
- ✅ Complete 10-year span
- ✅ All data sources verified
