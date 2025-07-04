# Multi-stage build for production deployment
FROM node:18-alpine AS base

# Install Python and pip for Gemini API
RUN apk add --no-cache python3 py3-pip

# Install Google Generative AI Python package
RUN pip3 install google-generativeai

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install Python and pip for Gemini API
RUN apk add --no-cache python3 py3-pip

# Install Google Generative AI Python package
RUN pip3 install google-generativeai

# Create app directory
WORKDIR /app

# Copy built application
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the HTTP server
CMD ["node", "dist/server-http.js"]