# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production dependencies stage  
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies and clean cache
RUN npm ci --only=production && npm cache clean --force

# Runtime stage - minimal Alpine with Playwright support
FROM node:22-alpine AS runtime

# Install necessary packages for Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Tell Playwright to use the installed Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S metashot -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=metashot:nodejs /app/dist ./dist

# Copy production dependencies from deps stage  
COPY --from=deps --chown=metashot:nodejs /app/node_modules ./node_modules

# Copy package.json for runtime
COPY --from=builder --chown=metashot:nodejs /app/package.json ./

# Switch to non-root user
USER metashot

# Expose the port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]