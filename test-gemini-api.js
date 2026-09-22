/**
 * Test Gemini API for PDF text extraction
 * Run: node test-gemini-api.js
 */

const fs = require('fs');

async function testGeminiAPI() {
  try {
    const apiKey = 'AIzaSyAb8RN6L7HrhkeoX9SCuaH-rpJ6giHnAHGe73frqkn45Rrqzqdw';
    
    console.log('[TEST] Testing Gemini API...');
    console.log('[TEST] API Key:', apiKey.substring(0, 20) + '...');

    // Test 1: Simple text generation (no PDF)
    console.log('\n[TEST 1] Testing basic text generation...');
    const response1 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Say hello',
                },
              ],
            },
          ],
        }),
      }
    );

    console.log('[TEST 1] Response status:', response1.status);
    if (!response1.ok) {
      const errorText = await response1.text();
      console.error('[TEST 1] Error:', errorText);
    } else {
      const result1 = await response1.json();
      console.log('[TEST 1] Success! Response:', JSON.stringify(result1, null, 2));
    }

    // Test 2: List available models
    console.log('\n[TEST 2] Listing available models...');
    const response2 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
      }
    );

    if (response2.ok) {
      const models = await response2.json();
      console.log('[TEST 2] Available models:');
      models.models.forEach(model => {
        if (model.name.includes('gemini')) {
          console.log('  -', model.name);
        }
      });
    } else {
      console.error('[TEST 2] Failed to list models');
    }

  } catch (error) {
    console.error('[TEST] Error:', error.message);
    console.error('[TEST] Stack:', error.stack);
  }
}

testGeminiAPI();
