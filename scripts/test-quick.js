#!/usr/bin/env node

import axios from 'axios';

const API_KEY = 'AIzaSyAv_JjcKkanGkDw_pbivEJ2gzkIjF52kSo';
const BASE_URL = process.env.GEMINI_MCP_URL || 'http://localhost:3000';

async function quickTest() {
  console.log('🧪 Quick Test of Gemini MCP Remote Server');
  console.log(`🔗 Server URL: ${BASE_URL}`);
  console.log('');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: List Tools
    console.log('2️⃣ Testing tools list...');
    const toolsResponse = await axios.post(`${BASE_URL}/mcp/tools/list`);
    console.log('✅ Tools list successful');
    console.log('');

    // Test 3: Ping Tool
    console.log('3️⃣ Testing Ping tool...');
    const pingResponse = await axios.post(`${BASE_URL}/mcp/tools/call`, {
      name: 'Ping',
      arguments: {
        prompt: 'Quick test ping!'
      }
    });
    console.log('✅ Ping test successful:', pingResponse.data.content[0].text);
    console.log('');

    // Test 4: Help Tool
    console.log('4️⃣ Testing Help tool...');
    const helpResponse = await axios.post(`${BASE_URL}/mcp/tools/call`, {
      name: 'Help',
      arguments: {}
    });
    console.log('✅ Help test successful');
    console.log('');

    console.log('🎉 Quick tests completed! Server is operational.');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ HTTP Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ Network Error:', error.message);
    } else {
      console.error('❌ Test Error:', error.message);
    }
    process.exit(1);
  }
}

// Set the API key in environment before testing
process.env.GOOGLE_GENERATIVE_AI_API_KEY = API_KEY;

quickTest();