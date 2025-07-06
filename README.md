# Metashot

Metabase is a fantastic business intelligence tool. However, one of the things that I've run into when implementing it
at different places is the fact that there's no way to programatically extract a screen cap of a question created in
metabase.

You can get at the raw data, even metadata about the question. But Metabase _itself_ won't just generate a visualization
for you that you can throw into other tools. That changes today.

Metashot is a TypeScript REST API service that generates PNG images from Metabase embed URLs using Playwright. It then
uploads them to S3-compatible storage and returned the presigned download url. This makes it suitable to integrate with
tools that need to ask for a fully realized image given some inputs.

## Features

- Generate PNG screenshots from Metabase questions
- Upload images to S3-compatible storage
- Return presigned URLs with configurable expiration
- Configurable viewport dimensions and wait conditions
- Optional authorization token requirement
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
  --set env.METABASE_BASE_URL=https://metabase.example.com \
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

## Configuration

Environment variables:
- `PORT` - Server port (default: 8080)
- `AUTH_TOKEN` - The token requesters are required to present to get an image
- `S3_ENDPOINT` - S3 endpoint URL
- `S3_ACCESS_KEY_ID` - S3 access key
- `S3_SECRET_ACCESS_KEY` - S3 secret key
- `S3_BUCKET` - S3 bucket name
- `S3_REGION` - S3 region
- `PRESIGNED_URL_EXPIRY` - Presigned URL expiry in seconds (default 1hr)
