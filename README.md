# Message Analysis App

A Next.js application for analyzing and visualizing message data with Supabase integration.

## 🚀 Features

- **Message Browser**: Browse and search through 44,590+ messages
- **Love Letters**: Generate cinematic love letters from message data
- **Visualizations**: Interactive heatmaps and charts
- **Word Evolution**: Track word usage over time
- **Database Diagnostics**: Monitor and debug Supabase connections

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── mobile-messages/    # Main message browser
│   ├── love-letters/       # Love letter generator
│   ├── visual-heatmap/     # Data visualizations
│   ├── word-evolution/     # Word analysis
│   └── diagnostic/         # Database diagnostics
├── components/             # React components
│   ├── mobile-message-app.tsx    # Main message browser
│   ├── cinematic-love-letters.tsx # Love letter generator
│   ├── weekly-visual-heatmap.tsx # Visualizations
│   ├── word-cloud-evolution.tsx  # Word clouds
│   └── supabase-diagnostic.tsx   # Database tools
├── lib/                   # Utility libraries
│   └── supabase.ts        # Supabase client configuration
└── archive/               # Archived development tools (not in repo)
```

## 🗄️ Data Storage Strategy

### Large Files Management

This repository uses a **data-exclusion strategy** to keep the repository size manageable:

- **Large data files** (CSV, JSON, SQL) are excluded from the repository
- **Archive directories** contain development tools and historical data
- **Backup directories** store database exports and snapshots

### Data Sources

The application connects to a **Supabase database** containing:
- **44,590+ messages** in the `fulldata_set` table
- **Message metadata** including dates, senders, and content
- **Optimized queries** with pagination for large datasets

### Local Development

For local development, you can:

1. **Use the live Supabase database** (recommended)
2. **Import your own data** using the diagnostic tools
3. **Create sample data** for testing

## 🛠️ Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account and project

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Start development server
pnpm dev
```

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Database Schema

The main table `fulldata_set` contains:
- `message_id`: Unique identifier
- `readable_date`: Formatted date string
- `sender`: Message sender
- `content`: Message text
- `timestamp`: Unix timestamp

## 🚀 Deployment

The application is optimized for deployment on Vercel:

```bash
# Build for production
pnpm build

# Deploy to Vercel
vercel --prod
```

## 📈 Performance

- **Optimized queries** with pagination (1000 records per request)
- **Lazy loading** for large datasets
- **Cached responses** for improved performance
- **Compressed builds** for faster deployment

## 🔧 Troubleshooting

### Database Connection Issues

1. Check your Supabase credentials in `.env.local`
2. Verify the `fulldata_set` table exists
3. Use the diagnostic tools to test connections

### Large Dataset Performance

1. Ensure pagination is working correctly
2. Check network tab for query performance
3. Verify Supabase query limits

## 📝 License

This project is for personal use and message analysis.
