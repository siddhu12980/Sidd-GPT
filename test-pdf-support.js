import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import fetch from 'node-fetch';

async function testPDFSupport() {
  try {
    console.log('🧪 Testing PDF support with AI SDK...');
    
    // Test with a simple PDF URL (you can replace this with any PDF URL)
    const pdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    
    console.log('📥 Fetching PDF from:', pdfUrl);
    const response = await fetch(pdfUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }
    
    const pdfBuffer = await response.arrayBuffer();
    console.log('✅ PDF fetched successfully, size:', pdfBuffer.byteLength, 'bytes');
    
    console.log('🤖 Sending to OpenAI...');
    const result = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this PDF and tell me what it contains.',
            },
            {
              type: 'file',
              data: Buffer.from(pdfBuffer),
              mimeType: 'application/pdf',
              filename: 'test.pdf',
            },
          ],
        },
      ],
    });
    
    console.log('🎉 Success! AI Response:');
    console.log(result.text);
    
    return {
      success: true,
      response: result.text,
      fileSize: pdfBuffer.byteLength
    };
    
  } catch (error) {
    console.error('❌ Error testing PDF support:', error);
    
    // Check for specific error types
    if (error.message.includes('file')) {
      console.log('📋 This might indicate that the AI SDK doesn\'t support the "file" type in this way');
    }
    
    if (error.message.includes('content')) {
      console.log('📋 This might indicate that the content structure is different');
    }
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// Alternative test with different content structure
async function testAlternativePDFStructure() {
  try {
    console.log('\n🧪 Testing alternative PDF structure...');
    
    const pdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    const response = await fetch(pdfUrl);
    const pdfBuffer = await response.arrayBuffer();
    
    // Try with different structure - similar to how images work
    const result = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this document:' },
            { 
              type: 'file', 
              file: new URL(`data:application/pdf;base64,${Buffer.from(pdfBuffer).toString('base64')}`)
            },
          ],
        },
      ],
    });
    
    console.log('🎉 Alternative structure worked! Response:');
    console.log(result.text);
    
    return { success: true, method: 'alternative', response: result.text };
    
  } catch (error) {
    console.error('❌ Alternative structure failed:', error.message);
    return { success: false, method: 'alternative', error: error.message };
  }
}

// Test with data URL approach (like your current image handling)
async function testDataURLApproach() {
  try {
    console.log('\n🧪 Testing data URL approach...');
    
    const pdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    const response = await fetch(pdfUrl);
    const pdfBuffer = await response.arrayBuffer();
    
    const dataURL = `data:application/pdf;base64,${Buffer.from(pdfBuffer).toString('base64')}`;
    
    const result = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What does this document contain?' },
            { type: 'file', file: new URL(dataURL) },
          ],
        },
      ],
    });
    
    console.log('🎉 Data URL approach worked! Response:');
    console.log(result.text);
    
    return { success: true, method: 'dataURL', response: result.text };
    
  } catch (error) {
    console.error('❌ Data URL approach failed:', error.message);
    return { success: false, method: 'dataURL', error: error.message };
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting PDF support tests...\n');
  
  const results = {
    direct: await testPDFSupport(),
    alternative: await testAlternativePDFStructure(),
    dataURL: await testDataURLApproach(),
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([method, result]) => {
    console.log(`${method}: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    if (!result.success) {
      console.log(`  Error: ${result.error}`);
    }
  });
  
  const successfulMethods = Object.entries(results)
    .filter(([_, result]) => result.success)
    .map(([method, _]) => method);
  
  if (successfulMethods.length > 0) {
    console.log(`\n🎉 Working methods: ${successfulMethods.join(', ')}`);
    console.log('✅ PDF support is available! You can proceed with implementation.');
  } else {
    console.log('\n❌ No methods worked. PDF support might not be available yet.');
    console.log('💡 Consider alternative approaches like converting PDF to text first.');
  }
  
  return results;
}

// Run the tests
runAllTests().catch(console.error); 