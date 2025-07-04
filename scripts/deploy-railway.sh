#!/bin/bash

# Deploy to Railway
echo "🚀 Deploying Gemini MCP Server to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is required but not installed."
    echo "📥 Install it from: https://docs.railway.app/develop/cli#install"
    exit 1
fi

# Login check
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway first:"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI authenticated"

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo ""
echo "🔧 Don't forget to set environment variables:"
echo "   railway variables set GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here"
echo ""
echo "🔗 Check your deployment:"
echo "   railway status"
echo "   railway logs"