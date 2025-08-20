// services/contentExtractor.js

import axios from 'axios';
import EPub from 'node-epub';
import path from 'path';

// Helper to get file extension from a URL
const getFileExtension = (url) => {
  try {
    return path.extname(new URL(url).pathname).toLowerCase();
  } catch (error) {
    console.error("Invalid URL for getFileExtension:", url);
    return '';
  }
};

export const extractContentFromUrl = async (fileUrl) => {
  try {
    const extension = getFileExtension(fileUrl);
    console.log(`[EXTRACTOR] Starting extraction for URL: ${fileUrl}`);

    // --- .TXT Handler ---
    if (extension === '.txt') {
      console.log('[EXTRACTOR] Parsing as .txt file.');
      const response = await axios.get(fileUrl, { responseType: 'text' });
      return response.data;
    }

    // --- .EPUB Handler (with Timeout) ---
    if (extension === '.epub') {
      console.log('[EXTRACTOR] Parsing as .epub file using node-epub.');

      // Promise that does the actual parsing
      const parsingPromise = new Promise((resolve, reject) => {
        const epub = new EPub(fileUrl);
        
        epub.on('end', () => {
          console.log('[EXTRACTOR] EPUB "end" event fired. Processing chapters.');
          const chapterPromises = epub.flow.map(chapter =>
            new Promise((resolveChapter) => {
              epub.getChapter(chapter.id, (err, text) => {
                if (err) {
                  console.error(`Error getting chapter ${chapter.id}:`, err);
                  return resolveChapter(''); // Return empty string on chapter error
                }
                // Strip HTML tags and normalize newlines
                const cleanText = text.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n\n');
                resolveChapter(cleanText);
              });
            })
          );
          Promise.all(chapterPromises).then(chapters => {
            console.log('[EXTRACTOR] All chapters processed. Resolving promise.');
            resolve(chapters.join('\n\n---\n\n'));
          });
        });

        epub.on('error', (err) => {
            console.error('[EXTRACTOR] EPUB "error" event fired.', err);
            reject(err);
        });
        
        epub.parse();
      });

      // Promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('EPUB parsing timed out after 20 seconds. The file may be corrupted.'));
        }, 20000); // 20-second timeout
      });

      // Race the two promises. The first to finish wins.
      return Promise.race([parsingPromise, timeoutPromise]);
    }

    // --- Fallback for unsupported types ---
    console.warn(`[EXTRACTOR] Unsupported file type for content extraction: ${extension}`);
    return null;

  } catch (error) {
    console.error('[EXTRACTOR] CRITICAL ERROR in extractContentFromUrl:', error.message);
    // Return null so the controller doesn't hang on an unexpected error
    return null;
  }
};