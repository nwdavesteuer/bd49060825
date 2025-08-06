import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const id = searchParams.get('id')

  // Create a simple SVG placeholder image
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f0f0f0"/>
      <rect x="50" y="50" width="300" height="200" fill="#e0e0e0" stroke="#ccc" stroke-width="2"/>
      <text x="200" y="140" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
        📸 Photo
      </text>
      <text x="200" y="160" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">
        ${date || 'Unknown Date'}
      </text>
      <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="10" fill="#999">
        ${id || 'Local Photo'}
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600'
    }
  })
} 