# iMessage Extractor for Mac

A Python script to extract iMessages from the Mac Messages database for specific contacts. This tool allows you to export your iMessage conversations to CSV format for backup, analysis, or migration purposes.

## Features

- Extract iMessages for specific contacts by phone number, email, or name
- Export messages to CSV format with timestamps and metadata
- Automatic backup of the Messages database before extraction
- Support for both iMessage and SMS conversations
- List recent contacts with message counts
- Limit the number of messages extracted
- User-friendly command-line interface

## Prerequisites

- macOS (this script only works on Mac)
- Python 3.6 or higher
- Messages app must be enabled and have conversations
- Terminal access

## Installation

1. Clone or download this repository
2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

Extract messages for a specific contact:

```bash
python imessage_extractor.py --contact "John Doe"
```

### Advanced Usage

```bash
# Extract messages and save to a specific file
python imessage_extractor.py --contact "john@example.com" --output my_messages.csv

# Limit the number of messages extracted
python imessage_extractor.py --contact "+1234567890" --limit 100

# List recent contacts instead of extracting messages
python imessage_extractor.py --list-contacts

# Use short form arguments
python imessage_extractor.py -c "John Doe" -o messages.csv -l 50
```

### Command Line Arguments

- `--contact`, `-c`: Contact identifier (required)
  - Can be a phone number: `"+1234567890"`
  - Can be an email address: `"john@example.com"`
  - Can be a partial name: `"John"` or `"John Doe"`
- `--output`, `-o`: Output CSV file path (optional)
  - If not provided, a default filename will be generated
- `--limit`, `-l`: Limit number of messages to extract (optional)
- `--list-contacts`: List recent contacts instead of extracting messages

## Examples

### Extract messages by phone number
```bash
python imessage_extractor.py --contact "+1234567890"
```

### Extract messages by email
```bash
python imessage_extractor.py --contact "john@example.com"
```

### Extract messages by name
```bash
python imessage_extractor.py --contact "John Doe"
```

### Extract last 50 messages and save to specific file
```bash
python imessage_extractor.py --contact "John" --limit 50 --output recent_messages.csv
```

### List top 20 contacts by message count
```bash
python imessage_extractor.py --list-contacts
```

## Output Format

The script generates a CSV file with the following columns:

- `ROWID`: Internal database ID
- `guid`: Unique message identifier
- `text`: Message content
- `date`: Message timestamp (in nanoseconds since 2001)
- `date_read`: When the message was read
- `is_from_me`: Whether you sent the message (1) or received it (0)
- `cache_has_attachments`: Whether the message has attachments
- `contact_id`: Contact identifier (phone/email)
- `service`: Message service (iMessage/SMS)
- `readable_date`: Human-readable timestamp
- `contact_name`: Contact name

## Important Notes

### Security and Privacy
- The script creates a backup of your Messages database before extraction
- Backups are stored in `~/Desktop/iMessage_Backup/`
- The original database is never modified
- Be careful with extracted data and respect privacy

### Database Location
The Messages database is located at:
```
~/Library/Messages/chat.db
```

### Permissions
You may need to grant Terminal access to your Messages database:
1. Go to System Preferences > Security & Privacy > Privacy
2. Select "Full Disk Access" from the left sidebar
3. Click the lock icon and enter your password
4. Add Terminal (or your terminal app) to the list

### Limitations
- Only works on macOS
- Requires Messages app to be set up
- Some messages may not be accessible due to encryption
- Group messages are not currently supported

## Troubleshooting

### "Messages database not found" error
- Make sure you're running this on a Mac
- Ensure the Messages app is installed and set up
- Check that the database exists at `~/Library/Messages/chat.db`

### "No contact found" error
- Try using the exact phone number or email address
- Use partial matching (e.g., "John" instead of "John Doe")
- Check the contact exists in your Messages app

### Permission denied errors
- Grant Terminal full disk access (see Permissions section above)
- Make sure you have read permissions for the Messages folder

### Database locked errors
- Close the Messages app before running the script
- Wait a few minutes and try again

## Data Privacy

⚠️ **Important**: This script accesses your personal message data. Please be aware that:

- Messages may contain sensitive personal information
- Extracted data should be handled securely
- Consider the privacy implications before sharing extracted data
- The script creates backups, so ensure backup storage is secure

## License

This script is provided for educational and personal use. Please respect privacy and data protection laws when using this tool.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this tool.

## Disclaimer

This tool is provided as-is without any warranty. Use at your own risk and in compliance with applicable laws and privacy regulations. 