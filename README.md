# iMessage Gift Project

A comprehensive toolkit for extracting iMessages from Mac and creating beautiful, searchable gifts from conversation history.

## 🎁 Project Overview

This repository contains tools to:
- Extract iMessages from Mac Messages database
- Export conversations with images and metadata
- Create searchable databases for analysis
- Build interactive web applications for gifts

## 📁 Repository Contents

### Core Extraction Tools
- `enhanced_imessage_extractor.py` - Main extraction script with JSON export and image support
- `imessage_extractor.py` - Basic CSV export version
- `contact_finder.py` - Find contacts in Messages database
- `message_query_tool.py` - Search and analyze extracted messages
- `permission_helper.py` - Troubleshoot database access permissions

### Documentation
- `GIFT_PROJECT_GUIDE.md` - Complete guide for creating iMessage gifts
- `NITZAN_EXTRACTION_GUIDE.md` - Specific troubleshooting guide
- `example_usage.py` - Example script showing programmatic usage

### Configuration
- `requirements.txt` - Python dependencies
- `.gitignore` - Excludes sensitive data and large files

## 🚀 Quick Start

### Prerequisites
- macOS (required for iMessage database access)
- Python 3.6+
- Messages app with conversations

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd imessage

# Install dependencies
pip3 install -r requirements.txt
```

### Grant Permissions
1. Open **System Settings** > **Privacy & Security** > **Full Disk Access**
2. Add **Terminal** (or your terminal app) to the list
3. Close Messages app
4. Test permissions: `python3 permission_helper.py`

### Extract Messages
```bash
# Find contacts
python3 contact_finder.py "contact_name"

# Extract messages
python3 enhanced_imessage_extractor.py --contact "contact_id" --output messages.json
```

## 🔧 Usage Examples

### Find a Contact
```bash
python3 contact_finder.py "john"
```

### Extract All Messages
```bash
python3 enhanced_imessage_extractor.py --contact "+1234567890" --output all_messages.json
```

### Search Extracted Messages
```bash
python3 message_query_tool.py messages.db --search "love"
```

### Get Conversation Statistics
```bash
python3 message_query_tool.py messages.db --stats
```

## 📊 Output Format

The enhanced extractor creates:
- **JSON file**: Complete message history with metadata
- **SQLite database**: Searchable database with full-text search
- **Backup**: Automatic backup of Messages database

### JSON Structure
```json
{
  "metadata": {
    "contact_identifier": "+1234567890",
    "extraction_date": "2024-01-15T10:30:00",
    "total_messages": 5000,
    "date_range": {
      "start": "2020-03-15 14:22:33",
      "end": "2024-01-15 09:45:12"
    },
    "conversation_stats": {...}
  },
  "messages": [
    {
      "message_id": 12345,
      "text": "Hello!",
      "date": 1642244553000000000,
      "is_from_me": true,
      "readable_date": "2022-01-15 14:22:33",
      "attachments": [...]
    }
  ]
}
```

## 🎨 Gift Creation

### Web Application
- Use the extracted JSON data with React/Next.js
- Deploy to Vercel for hosting
- Use Vercel v0 for rapid UI prototyping

### Features to Build
- Timeline view of conversations
- Image gallery with thumbnails
- Search and filter functionality
- Message highlighting and favorites
- Export selected messages

## 🔒 Privacy & Security

⚠️ **Important**: This tool accesses personal message data.

- **Backup**: Automatic database backups are created
- **Local Only**: Data stays on your machine unless you choose to share
- **Gitignore**: Sensitive files are excluded from version control
- **Permissions**: Requires explicit user consent for database access

## 🛠️ Troubleshooting

### Permission Issues
- Grant Terminal "Full Disk Access" in System Preferences
- Close Messages app before running scripts
- Use `permission_helper.py` to diagnose issues

### Contact Not Found
- Try different phone number formats
- Use `contact_finder.py` to see exact contact IDs
- Check that the contact exists in Messages app

### Database Schema Issues
- The enhanced extractor handles different macOS versions
- Some columns may not exist in older Messages databases
- Scripts automatically adapt to available schema

## 📝 License

This project is provided for educational and personal use. Please respect privacy and data protection laws.

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve this tool.

## 📞 Support

For detailed troubleshooting, see:
- `GIFT_PROJECT_GUIDE.md` - Complete project guide
- `NITZAN_EXTRACTION_GUIDE.md` - Specific troubleshooting steps

---

**Happy gift-making! 🎁💕** 