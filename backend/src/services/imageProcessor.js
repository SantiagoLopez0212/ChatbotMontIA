const Tesseract = require('tesseract.js');

async function processImage(imagePath) {
  const result = await Tesseract.recognize(imagePath, 'eng');
  return result.data.text.trim();
}

module.exports = { processImage };
