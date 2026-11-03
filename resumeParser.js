// server/services/resumeParser.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Fallback DOCX text extractor by reading raw ZIP and extracting word/document.xml
 */
function extractDocxFallback(buffer) {
  try {
    // Look for PK\x03\x04 zip header
    const zipString = buffer.toString('binary');
    const docXmlHeader = 'word/document.xml';
    const headerIndex = zipString.indexOf(docXmlHeader);
    
    if (headerIndex !== -1) {
      // Find compressed data start or try regex on printable xml strings
      const xmlMatch = buffer.toString('utf8').match(/<w:t[^>]*>(.*?)<\/w:t>/g);
      if (xmlMatch && xmlMatch.length > 0) {
        return xmlMatch.map(t => t.replace(/<[^>]+>/g, '')).join(' ');
      }
    }
    
    // Fallback: extract ASCII/UTF8 words
    const asciiText = buffer.toString('latin1').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    const words = asciiText.split(/\s+/).filter(w => w.length > 2 && w.length < 30);
    return words.join(' ');
  } catch (err) {
    console.error('Fallback DOCX parse error:', err);
    return buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  }
}

/**
 * Fallback PDF text extractor
 */
function extractPdfFallback(buffer) {
  try {
    const raw = buffer.toString('latin1');
    const textPieces = [];
    
    // Match text blocks inside BT ... ET (PDF standard Text blocks)
    const btRegex = /BT[\s\S]*?ET/g;
    let match;
    while ((match = btRegex.exec(raw)) !== null) {
      const block = match[0];
      // Match Tj or TJ operators
      const tjRegex = /\((.*?)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        textPieces.push(tjMatch[1]);
      }
      const arrayRegex = /\[(.*?)\]\s*TJ/g;
      let arrMatch;
      while ((arrMatch = arrayRegex.exec(block)) !== null) {
        const inner = arrMatch[1];
        const innerMatches = inner.match(/\((.*?)\)/g);
        if (innerMatches) {
          textPieces.push(innerMatches.map(s => s.slice(1, -1)).join(' '));
        }
      }
    }
    
    if (textPieces.length > 0) {
      return textPieces.join('\n');
    }
    
    // Generic stream text recovery
    const clean = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    const tokens = clean.split(/\s+/).filter(t => t.length > 2 && t.length < 35);
    return tokens.join(' ');
  } catch (err) {
    console.error('Fallback PDF parse error:', err);
    return '';
  }
}

/**
 * Parse resume file (PDF, DOCX, TXT) and extract plain text
 */
async function parseResumeFile(filePath, mimeType = '', originalName = '') {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const ext = (path.extname(originalName || filePath) || '').toLowerCase();
  const fileBuffer = fs.readFileSync(filePath);

  let extractedText = '';

  if (ext === '.pdf' || mimeType.includes('pdf')) {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(fileBuffer);
      extractedText = data.text || '';
    } catch (libErr) {
      console.warn('pdf-parse library failed or not present, attempting fallback extractor:', libErr.message);
      extractedText = extractPdfFallback(fileBuffer);
    }
  } else if (ext === '.docx' || ext === '.doc' || mimeType.includes('word') || mimeType.includes('officedocument')) {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = result.value || '';
    } catch (libErr) {
      console.warn('mammoth library failed or not present, attempting fallback extractor:', libErr.message);
      extractedText = extractDocxFallback(fileBuffer);
    }
  } else {
    // Treat as UTF-8 text file
    extractedText = fileBuffer.toString('utf8');
  }

  // Clean and normalize text
  const cleanedText = extractedText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    rawText: cleanedText,
    charCount: cleanedText.length,
    wordCount: cleanedText.split(/\s+/).filter(Boolean).length
  };
}

module.exports = {
  parseResumeFile
};
