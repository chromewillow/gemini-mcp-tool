# Remote Deployment Guide - Gemini MCP Server

This guide covers deploying the Gemini MCP Server to various cloud platforms as a remote HTTP service.

## Overview

The remote deployment converts the local MCP server into an HTTP API that can be accessed from anywhere. This enables:

- **Remote Access**: Use Gemini capabilities from any client
- **Scalability**: Deploy to cloud platforms with auto-scaling
- **Integration**: Easy integration with web applications and services
- **Reliability**: Cloud platform reliability and uptime

## Prerequisites

- Google Gemini API Key ([Get one here](https://ai.google.dev/))
- Node.js 16+ installed locally (for building)
- Python 3.8+ (required for Gemini API calls)

## Quick Start

1. **Clone and Setup**
```bash
git clone https://github.com/chromewillow/gemini-mcp-tool.git
cd gemini-mcp-tool
npm install
npm run build
```

2. **Test Locally**
```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key npm run start:http
```

3. **Deploy to Cloud** (choose one)
   - Railway: `./scripts/deploy-railway.sh`
   - Docker: `docker-compose up`
   - Vercel: `vercel --prod`

## Deployment Options

### 1. Railway (Recommended)

Railway offers easy deployment with automatic builds and environment management.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
./scripts/deploy-railway.sh

# Set environment variables
railway variables set GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### 2. Docker

Use Docker for containerized deployment on any platform.

```bash
# Build and run locally
docker-compose up

# Or build and push to registry
docker build -t gemini-mcp-server .
docker run -p 3000:3000 -e GOOGLE_GENERATIVE_AI_API_KEY=your_key gemini-mcp-server
```

### 3. Render

Deploy using the included `render.yaml` configuration:

1. Connect your GitHub repo to Render
2. Set environment variable: `GOOGLE_GENERATIVE_AI_API_KEY`
3. Deploy automatically on push

### 4. Vercel

For serverless deployment:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variable
vercel env add GOOGLE_GENERATIVE_AI_API_KEY
```

## API Endpoints

Once deployed, your server will expose:

### Health Check
```
GET /health
```
Returns server status and configuration info.

### List Tools
```
POST /mcp/tools/list
```
Returns available MCP tools.

### Call Tool
```
POST /mcp/tools/call
{
  "name": "ask-gemini",
  "arguments": {
    "prompt": "What is the capital of France?",
    "model": "gemini-1.5-flash"
  }
}
```

## Testing Your Deployment

Use the included test script:

```bash
# Test local deployment
npm run test:remote

# Test remote deployment
GEMINI_MCP_URL=https://your-deployment.railway.app npm run test:remote
```

## Available Tools

- **ask-gemini**: Send prompts to Gemini with file analysis support
- **sandbox-test**: Test code execution in sandbox mode
- **Ping**: Simple connectivity test
- **Help**: Show available models and features

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Your Gemini API key |
| `PORT` | No | Port to run server (default: 3000) |
| `NODE_ENV` | No | Environment (production/development) |

## Security Considerations

- **API Key**: Store securely in environment variables
- **CORS**: Configure appropriately for your use case
- **Rate Limiting**: Consider adding rate limiting for production
- **HTTPS**: Always use HTTPS in production

## Monitoring and Debugging

### View Logs
```bash
# Railway
railway logs

# Docker
docker logs container_name

# Vercel
vercel logs
```

### Health Monitoring
The `/health` endpoint provides:
- Server status
- API key configuration status
- Timestamp
- Service information

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify key is correctly set
   - Check API quotas and limits
   - Ensure key has proper permissions

2. **Python Dependencies**
   - Ensure `google-generativeai` is installed
   - Check Python version compatibility

3. **Timeout Issues**
   - Increase timeout settings
   - Check network connectivity
   - Verify API endpoint accessibility

### Getting Help

1. Check server logs for detailed error messages
2. Test with simple prompts first
3. Verify API key works with direct Python calls
4. Open GitHub issues for persistent problems

## Cost Considerations

- **Gemini API**: Pay per token/request
- **Hosting**: Most platforms offer free tiers
- **Scaling**: Monitor usage and costs

## Integration Examples

### cURL
```bash
curl -X POST https://your-deployment.railway.app/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ask-gemini",
    "arguments": {
      "prompt": "Explain quantum computing",
      "model": "gemini-1.5-flash"
    }
  }'
```

### JavaScript
```javascript
const response = await fetch('https://your-deployment.railway.app/mcp/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'ask-gemini',
    arguments: { prompt: 'Hello from JavaScript!' }
  })
});
const result = await response.json();
```

## Next Steps

- Set up monitoring and alerting
- Configure custom domain
- Add authentication if needed
- Scale based on usage patterns
- Integrate with your applications