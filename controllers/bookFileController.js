import axios from 'axios';
import mammoth from 'mammoth';

const CLOUDINARY_FOLDER = 'book-files';

// --- Read DOCX inline ---
export const readBook = async (req, res) => {
  const { filename } = req.params;
  const url = `https://res.cloudinary.com/dfe7ue90j/raw/upload/${CLOUDINARY_FOLDER}/${filename}`;

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    // Convert DOCX to HTML/text
    const { value: htmlContent } = await mammoth.convertToHtml({ buffer });

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (error) {
    console.error('🔥 readBook error:', error.message);
    res.status(500).json({ error: 'Failed to read book.' });
  }
};

// --- Download DOCX ---
export const downloadBook = async (req, res) => {
  const { filename } = req.params;
  const url = `https://res.cloudinary.com/dfe7ue90j/raw/upload/${CLOUDINARY_FOLDER}/${filename}`;

  try {
    const response = await axios.get(url, { responseType: 'stream' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.data.pipe(res);
  } catch (error) {
    console.error('🔥 downloadBook error:', error.message);
    res.status(500).json({ error: 'Failed to download book.' });
  }
};
