# Metashot

A TypeScript REST API service that generates PNG images from Metabase embed URLs using Playwright and uploads them to S3-compatible storage.

## Features

- Generate PNG screenshots from any URL (designed for Metabase embeds)
- Upload images to S3-compatible storage (MinIO)
- Return presigned URLs with configurable expiration
- Configurable viewport dimensions and wait conditions
- Health check endpoint
- TypeScript with full type safety

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start local dependencies:
```bash
docker-compose up -d
```

3. Copy environment configuration:
```bash
cp .env.example .env
```

4. Run the application:
```bash
npm run dev
```

## API Endpoints

### POST /api/screenshot
Generate a screenshot from a URL.

**Request Body:**
```json
{
  "url": "https://example.com/metabase/embed",
  "width": 1920,
  "height": 1080,
  "waitForSelector": ".dashboard",
  "timeout": 30000
}
```

**Response:**
```json
{
  "presignedUrl": "http://localhost:9000/metashot-images/screenshot-123456789-abc123.png?...",
  "fileName": "screenshot-123456789-abc123.png",
  "expiresAt": "2024-01-01T12:00:00.000Z"
}
```

### GET /api/health
Health check endpoint.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run typecheck` - Run TypeScript type checking

## Docker Services

The `docker-compose.yml` provides:
- **MinIO** (S3-compatible storage) on port 9000
- **Metabase** for testing embed URLs on port 3000

## Configuration

Environment variables:
- `PORT` - Server port (default: 8080)
- `S3_ENDPOINT` - S3 endpoint URL
- `S3_ACCESS_KEY_ID` - S3 access key
- `S3_SECRET_ACCESS_KEY` - S3 secret key
- `S3_BUCKET` - S3 bucket name
- `S3_REGION` - S3 region
- `PRESIGNED_URL_EXPIRY` - Presigned URL expiry in seconds