#!/bin/bash

# Build and run TypeScript
npm run build

# Install Google Generative AI if not present
python3 -c "import google.generativeai" 2>/dev/null || {
    echo "Installing Google Generative AI Python package..."
    pip3 install google-generativeai
}

# Start the HTTP server
exec node dist/server-http.js