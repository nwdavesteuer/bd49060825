# Data Management Guide

This guide explains how to handle large data files that are excluded from the repository.

## 📁 Excluded Directories

The following directories contain large files and are excluded from Git:

- `archive/` - Historical data and development tools
- `backups/` - Database backups and exports
- `final_datasets/` - Final processed datasets
- `temp/` - Temporary files

## 🗄️ Data Storage Options

### Option 1: External Storage (Recommended)

Store large files in external storage services:

- **Google Drive**: For CSV and JSON files
- **Dropbox**: For database backups
- **AWS S3**: For production data
- **Git LFS**: For version-controlled large files

### Option 2: Local Storage

Keep large files locally but outside the repository:

```bash
# Create a data directory outside the repo
mkdir ~/message-data
cp archive/*.json ~/message-data/
cp final_datasets/*.csv ~/message-data/
```

### Option 3: Database-Only

Use only the Supabase database:

- All data is stored in the cloud
- No local files needed
- Real-time access from anywhere

## 📊 File Size Analysis

### Large Files to Exclude

| File | Size | Purpose | Storage Recommendation |
|------|------|---------|----------------------|
| `comprehensive_contact_search_*.json` | 219MB | Contact search results | External storage |
| `ipad_nitzan_messages_*.json` | 45MB | iPad message export | External storage |
| `direct_david_nitzan_messages_*.json` | 37MB | Direct message filter | External storage |
| `correct_david_nitzan_messages.json` | 36MB | Final filtered dataset | External storage |
| `final_*_conversation.json` | 35MB | Final conversation data | External storage |

### Files to Keep in Repository

- Configuration files (`.env`, `package.json`)
- Source code (`.tsx`, `.ts`, `.js`)
- Documentation (`.md` files)
- Small utility scripts

## 🔧 Data Import Process

### For New Data

1. **Store externally**: Put large files in external storage
2. **Import to Supabase**: Use the diagnostic tools to import
3. **Update documentation**: Document the data source and schema
4. **Test the app**: Verify the data loads correctly

### For Development

1. **Use sample data**: Create small test datasets
2. **Use live database**: Connect to the production Supabase
3. **Mock data**: Create mock data for testing

## 📈 Repository Size Optimization

### Before (Current)
- **Total size**: ~1.5GB
- **Large files**: ~500MB in JSON/CSV
- **Git history**: Bloated with large files

### After (Optimized)
- **Total size**: ~50MB
- **Large files**: Excluded from Git
- **Git history**: Clean and fast

## 🚀 Deployment Strategy

### Production
- Use Supabase database only
- No large files in deployment
- Fast builds and deployments

### Development
- Use external storage for large files
- Keep repository lean
- Fast cloning and branching

## 📝 Best Practices

1. **Never commit large files** to Git
2. **Use external storage** for data files
3. **Document data sources** in README
4. **Keep repository focused** on code
5. **Use environment variables** for configuration

## 🔍 Monitoring Repository Size

Check repository size regularly:

```bash
# Check current size
du -sh .

# Check Git repository size
git count-objects -vH

# Check for large files
find . -size +10M -type f
```

## 🛠️ Migration Commands

If you need to migrate existing large files:

```bash
# Move large files to external storage
mv archive/ ~/external-storage/archive/
mv backups/ ~/external-storage/backups/
mv final_datasets/ ~/external-storage/final_datasets/

# Remove from Git tracking
git rm -r --cached archive/ backups/ final_datasets/

# Commit the changes
git add .gitignore
git commit -m "Exclude large data files from repository"
``` 