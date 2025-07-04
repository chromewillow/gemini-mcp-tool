#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { spawn } from "child_process";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to execute Python-based Gemini commands
async function executeGeminiPython(prompt: string, model = 'gemini-1.5-flash', sandbox = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let isResolved = false;

    // Create Python script for Gemini API call
    const pythonScript = `
import google.generativeai as genai
import os
import sys
import signal

def timeout_handler(signum, frame):
    print("Error: Request timed out", file=sys.stderr)
    sys.exit(1)

# Set timeout
signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(30)  # 30 second timeout

# Configure the API
api_key = "${process.env.GOOGLE_GENERATIVE_AI_API_KEY}"
if not api_key:
    print("Error: GOOGLE_GENERATIVE_AI_API_KEY not set", file=sys.stderr)
    sys.exit(1)

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name="${model}")
    
    # Handle sandbox mode
    generation_config = {}
    if ${sandbox ? 'True' : 'False'}:
        generation_config["code_execution"] = True
    
    response = model.generate_content("${prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}", generation_config=generation_config if generation_config else None)
    
    # Cancel timeout
    signal.alarm(0)
    
    print(response.text)
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;

    console.warn(`[Gemini MCP] Executing Gemini API call with model: ${model}`);

    const childProcess = spawn("python3", ["-c", pythonScript], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      },
    });

    // Set a timeout for the entire operation
    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        childProcess.kill('SIGTERM');
        reject(new Error("Request timed out after 45 seconds"));
      }
    }, 45000);

    // Progress indicator
    const progressInterval = setInterval(() => {
      if (!isResolved) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.warn(`[Gemini MCP] [${elapsed}s] Still processing...`);
      }
    }, 5000);

    // Listen for data from stdout
    childProcess.stdout.on("data", (data) => {
      const chunk = data.toString();
      stdout += chunk;
    });

    // Listen for data from stderr
    childProcess.stderr.on("data", (data) => {
      const msg = data.toString();
      stderr += msg;
      console.error(`[Gemini MCP] stderr: ${msg.trim()}`);
    });

    // Listen for process errors
    childProcess.on("error", async (error) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeout);
        clearInterval(progressInterval);
        console.error(`[Gemini MCP] Process error:`, error);
        reject(new Error(`Failed to spawn Python: ${error.message}`));
      }
    });

    // Listen for process close
    childProcess.on("close", async (code) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeout);
        clearInterval(progressInterval);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.warn(
          `[Gemini MCP] [${elapsed}s] Process finished with exit code: ${code}`,
        );

        if (code === 0) {
          console.warn(
            `[Gemini MCP] Success! Output length: ${stdout.length} bytes`,
          );

          const output = stdout.trim();
          resolve(output);
        } else {
          console.error(`[Gemini MCP] Failed with exit code ${code}`);
          const errorMessage = stderr.trim() || "Unknown error";
          reject(
            new Error(`Gemini API call failed: ${errorMessage}`),
          );
        }
      }
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'gemini-mcp-server',
    timestamp: new Date().toISOString(),
    api_key_configured: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
  });
});

// MCP Protocol endpoints
app.post('/mcp/tools/list', async (req, res) => {
  try {
    const tools = [
      {
        name: "ask-gemini",
        description: "Ask Gemini a question with optional file context using @ syntax",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The question or prompt to send to Gemini. Use @ syntax for file references (e.g., @file.js, @src/*.py)",
            },
            model: {
              type: "string",
              description: "Optional: Gemini model to use (e.g., 'gemini-1.5-flash', 'gemini-1.5-pro')",
            },
            sandbox: {
              type: "boolean",
              description: "Optional: Enable sandbox mode for code execution",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "sandbox-test",
        description: "Test the sandbox functionality",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Test prompt for sandbox",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "Ping",
        description: "Simple test tool that echoes back a message",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Message to echo back",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "Help",
        description: "Show information about available Gemini models",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ];

    res.json({ tools });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list tools' });
  }
});

app.post('/mcp/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    const validTools = ["ask-gemini", "sandbox-test", "Ping", "Help"];

    if (!validTools.includes(name)) {
      return res.status(400).json({ error: `Unknown tool: ${name}` });
    }

    console.warn(`[Gemini MCP HTTP] === TOOL INVOCATION ===`);
    console.warn(`[Gemini MCP HTTP] Tool: "${name}"`);
    console.warn(`[Gemini MCP HTTP] Raw arguments:`, JSON.stringify(args, null, 2));

    let result: string;

    if (name === "Ping") {
      const prompt = args?.prompt || "pong";
      result = `Ping response: ${prompt}`;
    } else if (name === "Help") {
      result = `Available Gemini Models:
- gemini-1.5-flash: Fast, efficient model for most tasks
- gemini-1.5-pro: More capable model for complex reasoning
- gemini-1.0-pro: Legacy model

Features:
- Text generation and analysis
- Code execution (sandbox mode)
- File analysis with @ syntax
- Large context window (up to 2M tokens)

API configured: ${!!process.env.GOOGLE_GENERATIVE_AI_API_KEY}`;
    } else if (name === "ask-gemini" || name === "sandbox-test") {
      const prompt = args?.prompt || "";
      const model = args?.model || "gemini-1.5-flash";
      const sandbox = args?.sandbox === true || args?.sandbox === "true";

      // Map short model names to full names
      const modelMap: { [key: string]: string } = {
        'flash': 'gemini-1.5-flash',
        'pro': 'gemini-1.5-pro',
        'gemini-flash': 'gemini-1.5-flash',
        'gemini-pro': 'gemini-1.5-pro'
      };
      
      const fullModelName = modelMap[model] || model;

      if (!prompt.trim()) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return res.status(500).json({ error: "GOOGLE_GENERATIVE_AI_API_KEY not configured" });
      }

      console.warn(`[Gemini MCP HTTP] Parsed prompt: "${prompt}"`);
      console.warn(`[Gemini MCP HTTP] Model: ${fullModelName}`);
      console.warn(`[Gemini MCP HTTP] Sandbox: ${sandbox}`);

      try {
        result = await executeGeminiPython(prompt, fullModelName, sandbox);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result = `Error executing ${name}: ${errorMessage}`;
      }
    } else {
      result = `Tool ${name} not implemented`;
    }

    res.json({
      content: [
        {
          type: "text",
          text: result,
        },
      ],
      isError: false,
    });

  } catch (error) {
    console.error(`[Gemini MCP HTTP] Error:`, error);
    res.status(500).json({
      content: [
        {
          type: "text",
          text: `Server error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Gemini MCP HTTP Server running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🛠️  Tools endpoint: http://localhost:${port}/mcp/tools/list`);
  console.log(`⚡ Call endpoint: http://localhost:${port}/mcp/tools/call`);
  console.log(`🔑 API Key configured: ${!!process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
});

export default app;