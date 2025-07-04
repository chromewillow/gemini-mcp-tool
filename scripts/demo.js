#!/usr/bin/env node

import axios from 'axios';

const API_KEY = 'AIzaSyAv_JjcKkanGkDw_pbivEJ2gzkIjF52kSo';
const BASE_URL = process.env.GEMINI_MCP_URL || 'http://localhost:3000';

async function demo() {
  console.log('🎬 Gemini MCP Server Demo');
  console.log(`🔗 Server: ${BASE_URL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    // Demo 1: Basic Query
    console.log('📝 Demo 1: Basic AI Query');
    console.log('Prompt: "Explain what an MCP server is in one sentence"');
    
    const demo1 = await axios.post(`${BASE_URL}/mcp/tools/call`, {
      name: 'ask-gemini',
      arguments: {
        prompt: 'Explain what an MCP server is in one sentence',
        model: 'gemini-1.5-flash'
      }
    }, { timeout: 30000 });
    
    console.log('Response:', demo1.data.content[0].text);
    console.log('');

    // Demo 2: Code Question
    console.log('💻 Demo 2: Programming Question');
    console.log('Prompt: "Write a simple Python function to calculate fibonacci numbers"');
    
    const demo2 = await axios.post(`${BASE_URL}/mcp/tools/call`, {
      name: 'ask-gemini',
      arguments: {
        prompt: 'Write a simple Python function to calculate fibonacci numbers',
        model: 'gemini-1.5-flash'
      }
    }, { timeout: 30000 });
    
    console.log('Response:', demo2.data.content[0].text.substring(0, 300) + '...');
    console.log('');

    // Demo 3: Math with Sandbox
    console.log('🧮 Demo 3: Math with Code Execution');
    console.log('Prompt: "Calculate 15! (factorial) using Python"');
    
    const demo3 = await axios.post(`${BASE_URL}/mcp/tools/call`, {
      name: 'ask-gemini',
      arguments: {
        prompt: 'Calculate 15! (factorial) using Python and show me the result',
        sandbox: true
      }
    }, { timeout: 45000 });
    
    console.log('Response:', demo3.data.content[0].text);
    console.log('');

    console.log('🎉 Demo completed successfully!');
    console.log('');
    console.log('🔧 Integration Example:');
    console.log(`curl -X POST ${BASE_URL}/mcp/tools/call \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"name":"ask-gemini","arguments":{"prompt":"Hello World!"}}'`);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused. Is the server running?');
      console.error('   Start with: npm run start:http');
    } else if (error.response) {
      console.error('❌ Server Error:', error.response.status);
      console.error('   Response:', error.response.data);
    } else if (error.message.includes('timeout')) {
      console.error('❌ Request timed out. Server might be processing...');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

// Set the API key in environment
process.env.GOOGLE_GENERATIVE_AI_API_KEY = API_KEY;

demo();