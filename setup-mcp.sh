#!/bin/bash

# Setup script for MCP servers
echo "Setting up MCP servers for Phoenix Web development..."

# Check if gcloud is installed
if command -v gcloud &> /dev/null; then
    echo "✓ Google Cloud SDK found"
    
    # Get current project
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -n "$PROJECT_ID" ]; then
        echo "✓ Current GCP project: $PROJECT_ID"
    else
        echo "⚠ No GCP project set. Run: gcloud config set project phoenix-web-app"
    fi
else
    echo "⚠ Google Cloud SDK not found. Install from: https://cloud.google.com/sdk/docs/install"
fi

# Check if Firebase CLI is installed
if command -v firebase &> /dev/null; then
    echo "✓ Firebase CLI found"
else
    echo "⚠ Firebase CLI not found. Run: npm install -g firebase-tools"
fi

# Test MCP servers
echo ""
echo "Testing MCP servers..."

# Test filesystem server
if npx -y @modelcontextprotocol/server-filesystem /tmp > /dev/null 2>&1; then
    echo "✓ Filesystem MCP server works"
else
    echo "✗ Filesystem MCP server failed"
fi

# Test memory server
if npx -y @modelcontextprotocol/server-memory --help > /dev/null 2>&1; then
    echo "✓ Memory MCP server available"
else
    echo "✗ Memory MCP server not available"
fi

echo ""
echo "MCP Configuration saved to:"
echo "~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
echo "⚠️  IMPORTANT: Restart Claude Desktop for MCP servers to take effect!"
echo ""
echo "After restart, you'll see MCP tools available in Claude Desktop."