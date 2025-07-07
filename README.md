# Metashot

Metabase is a fantastic business intelligence tool. However, one of the things that I've run into when implementing it
at different places is the fact that there's no way to programatically extract a screen cap of a question created in
metabase.

You can get at the raw data, even metadata about the question. But Metabase _itself_ won't just generate a visualization
for you that you can throw into other tools. That changes today.

Metashot is a TypeScript REST API service that generates PNG images from Metabase questions using Playwright. It automatically
generates secure embed URLs using JWT tokens, captures screenshots of the visualizations, uploads them to S3-compatible 
storage, and returns presigned download URLs. This makes it suitable to integrate with tools that need to ask for a 
fully realized image given a Metabase question ID.

## Features

- Generate PNG screenshots from Metabase questions using question IDs
- Automatic JWT-based embed URL generation for secure access
- Upload images to S3-compatible storage
- Return presigned URLs with configurable expiration
- Configurable viewport dimensions
- Bearer token authentication support
- Health check endpoint

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

### GET /
Returns API information.

**Response:**
```json
{
  "name": "Metashot API",
  "version": "1.0.0",
  "description": "Generate PNG images from Metabase embed URLs"
}
```

### POST /api/screenshot
Generate a screenshot from a Metabase question.

**Authentication:**
If `AUTH_TOKEN` is configured, requests must include:
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "questionId": 123,
  "width": 1920,
  "height": 1080
}
```

**Parameters:**
- `questionId` (required): The ID of the Metabase question to screenshot
- `width` (optional): Viewport width in pixels (default: 1920)
- `height` (optional): Viewport height in pixels (default: 1080)

**Response:**
```json
{
  "presignedUrl": "http://localhost:9000/metashot-images/screenshot-123456789-abc123.png?...",
  "fileName": "screenshot-123456789-abc123.png",
  "expiresAt": "2024-01-01T12:00:00.000Z"
}
```

### GET /api/health
Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "ok"
}
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run typecheck` - Run TypeScript type checking

## Deployment

### Docker

A Docker container is available for easy deployment:

```bash
# Build the Docker image
docker build -t metashot .

# Run the container
docker run -d -p 8080:8080 --name metashot metashot
```

### Kubernetes with Helm

A Helm chart is provided for Kubernetes deployment:

```bash
# Install with basic configuration
helm install metashot helm/metashot \
  --set env.METABASE_SITE_URL=https://metabase.example.com \
  --set env.METABASE_SECRET_KEY=your-metabase-secret-key \
  --set env.S3_BUCKET=my-screenshots-bucket

# Install with external secrets
helm install metashot helm/metashot \
  --set secretRefs.s3SecretAccessKey.enabled=true \
  --set secretRefs.s3SecretAccessKey.secretName=metashot-secrets \
  --set secretRefs.s3SecretAccessKey.secretKey=s3-secret-key \
  --set secretRefs.authToken.enabled=true \
  --set secretRefs.authToken.secretName=metashot-secrets \
  --set secretRefs.authToken.secretKey=auth-token
```

The Helm chart supports:
- External secret references for sensitive environment variables
- Ingress configuration
- Horizontal Pod Autoscaling
- Custom resource limits and requests
- Extra Kubernetes objects deployment

## Docker Services

The `docker-compose.yml` provides:
- **MinIO** (S3-compatible storage) on port 9000
- **Metabase** for testing embed URLs on port 3000

## How It Works

Metashot integrates directly with Metabase's embedding feature:

1. **Prerequisites**: The Metabase question must be shared via public embedding (in Metabase, go to the question > sharing icon > "Embed this question in an application")
2. You provide a Metabase question ID
3. Metashot generates a secure JWT token using your `METABASE_SECRET_KEY`
4. It creates an embed URL for the question with appropriate parameters
5. Playwright navigates to the embed URL and waits for the visualization to load
6. A full-page screenshot is captured in PNG format
7. The image is uploaded to S3-compatible storage
8. A presigned URL is returned for temporary access to the image

The generated embed URLs include:
- JWT token with configurable expiry (default: 10 minutes)
- Bordered and titled display (configurable in future versions)
- Support for passing additional parameters to Metabase questions

## Configuration

Environment variables:
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (development/production)
- `AUTH_TOKEN` - Bearer token required for API authentication (optional)
- `METABASE_SITE_URL` - Base URL of your Metabase instance (e.g., https://metabase.example.com)
- `METABASE_SECRET_KEY` - Secret key for generating Metabase embed tokens (found in Metabase Admin > Settings > Embedding)
- `S3_ENDPOINT` - S3 endpoint URL (optional, defaults to AWS S3; set for MinIO or other S3-compatible services)
- `S3_ACCESS_KEY_ID` - S3 access key
- `S3_SECRET_ACCESS_KEY` - S3 secret key
- `S3_BUCKET` - S3 bucket name
- `S3_REGION` - S3 region
- `PRESIGNED_URL_EXPIRY` - Presigned URL expiry in seconds (default: 3600, 1 hour)
