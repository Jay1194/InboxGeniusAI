const natural = require('natural');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const he = require('he');

class EmailAnalysisModel {
  constructor() {
    this.classifier = new natural.LogisticRegressionClassifier();
    this.trainClassifier();
  }

  trainClassifier() {
    const trainingData = this.loadTrainingData();
    trainingData.forEach(({ text, category }) => {
      this.classifier.addDocument(text, category);
    });
    this.classifier.train();
  }

  loadTrainingData() {
    // Load training data from a JSON file
    const dataPath = path.join(__dirname, 'training_data.json');
    const rawData = fs.readFileSync(dataPath);
    return JSON.parse(rawData);
  }

  cleanEmailContent(content) {
    // Remove hidden characters
    content = content.replace(/\u200C/g, '');
  
    // Parse the HTML
    const $ = cheerio.load(content);
  
    // Remove script and style elements
    $('script, style').remove();
  
    // Replace links with their text content and href
    $('a').each((i, elem) => {
      const $elem = $(elem);
      const href = $elem.attr('href');
      const text = $elem.text().trim();
      if (href && text) {
        $elem.replaceWith(`[${text}](${href})`);
      }
    });
  
    // Get the text content
    let cleanedContent = $('body').html();
  
    // Decode HTML entities
    cleanedContent = he.decode(cleanedContent);
  
    // Remove extra whitespace
    cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim();
  
    // Truncate long content
    const maxLength = 1000;
    if (cleanedContent.length > maxLength) {
      cleanedContent = cleanedContent.substring(0, maxLength) + '...';
    }
  
    return cleanedContent;
  }

  categorizeEmail(text) {
    return this.classifier.classify(text);
  }

  summarizeEmail(text) {
    // Simple summarization: return first 100 characters
    return text.slice(0, 100) + '...';
  }

  analyzeSentiment(text) {
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text.toLowerCase());
    
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'pleased', 'thanks', 'appreciate'];
    const negativeWords = ['bad', 'poor', 'unhappy', 'disappointed', 'frustrated', 'sorry', 'issue'];
    
    let score = 0;
    tokens.forEach(token => {
      if (positiveWords.includes(token)) score++;
      if (negativeWords.includes(token)) score--;
    });
    
    if (score > 0) return 'Positive';
    if (score < 0) return 'Negative';
    return 'Neutral';
  }

  analyzeEmail(body) {
    const cleanedBody = this.cleanEmailContent(body);
    return {
      category: this.categorizeEmail(cleanedBody),
      summary: this.summarizeEmail(cleanedBody),
      sentiment: this.analyzeSentiment(cleanedBody),
      cleanedBody: cleanedBody  // Include the cleaned body in the output
    };
  }
}

module.exports = new EmailAnalysisModel();