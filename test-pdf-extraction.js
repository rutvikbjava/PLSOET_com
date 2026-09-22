/**
 * Test PDF extraction with unpdf
 * Run: node test-pdf-extraction.js
 */

const fs = require('fs');
const path = require('path');

async function testPDFExtraction() {
  try {
    console.log('Loading unpdf...');
    const { extractText, getDocumentProxy } = await import('unpdf');
    
    console.log('unpdf loaded successfully');
    console.log('extractText:', typeof extractText);
    console.log('getDocumentProxy:', typeof getDocumentProxy);
    
    // Create a minimal test PDF buffer (PDF header)
    const testPDF = Buffer.from('%PDF-1.4\n%EOF');
    console.log('\nTest buffer created:', testPDF.length, 'bytes');
    
    console.log('\nAttempting to load PDF...');
    const pdf = await getDocumentProxy(new Uint8Array(testPDF));
    console.log('PDF loaded! Pages:', pdf.numPages);
    
    console.log('\nAttempting text extraction...');
    const result = await extractText(pdf, { mergePages: true });
    console.log('Extraction result:', result);
    
    console.log('\n✅ unpdf is working correctly!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPDFExtraction();
