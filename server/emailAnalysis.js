const cheerio = require('cheerio');
const he = require('he');
const natural = require('natural');
const sw = require('stopword');

const CATEGORIES = [
  'Work', 'Personal', 'Spam', 'Social', 'Promotions', 
  'Updates', 'Finance', 'Support', 'Travel', 'Education'
];

class EmailAnalysisModel {
  constructor() {
    this.classifier = new natural.BayesClassifier();
    this.summarizer = null;
    this.isInitialized = false;
    this.cache = new Map();
    this.initializeClassifier();
  }

  initializeClassifier() {
    const trainingData = require('./training_data.json');
    trainingData.forEach(item => {
      this.classifier.addDocument(this.preprocessText(item.text), item.category);
    });
    this.classifier.train();
  }

  preprocessText(text) {
    return sw.removeStopwords(text.toLowerCase().split(' ')).join(' ');
  }

  async lazyInitialize() {
    if (this.isInitialized) return;

    console.log('Initializing AI models...');
    try {
      const { pipeline } = await import('@xenova/transformers');
      this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
      this.isInitialized = true;
      console.log('AI models initialized successfully');
    } catch (error) {
      console.error('Error initializing models:', error);
    }
  }

  async cleanEmailContent(content) {
    content = content.replace(/\u200C/g, '');
    const $ = cheerio.load(content);
    $('script, style').remove();
    $('a').each((i, elem) => {
      const $elem = $(elem);
      const href = $elem.attr('href');
      const text = $elem.text().trim();
      if (href && text) {
        $elem.replaceWith(`<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`);
      }
    });
    $('img').remove(); // Remove images to clean up the content
    $('table').removeAttr('width').removeAttr('height').addClass('responsive-table');
    let cleanedContent = $('body').html();
    cleanedContent = he.decode(cleanedContent);
    cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim();
    return cleanedContent || '';
  }

  categorizeEmail(text) {
    const preprocessedText = this.preprocessText(text);
    return this.classifier.classify(preprocessedText);
  }

  async summarizeEmail(text) {
    if (!this.isInitialized) {
      const sentences = text.split(/[.!?]+/);
      return sentences.slice(0, 2).join('. ') + '.';
    }
    await this.lazyInitialize();
    const result = await this.summarizer(text, {
      max_length: 50,
      min_length: 20,
      do_sample: false
    });
    return result[0].summary_text;
  }

  isPriority(text) {
    const priorityKeywords = ['urgent', 'important', 'asap', 'deadline', 'critical'];
    return priorityKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  async analyzeEmail(body) {
    if (this.cache.has(body)) {
      return this.cache.get(body);
    }

    const cleanedBody = await this.cleanEmailContent(body);
    const category = this.categorizeEmail(cleanedBody);
    const isPriority = this.isPriority(cleanedBody);
    const summary = await this.summarizeEmail(cleanedBody);

    const result = { category, isPriority, summary, cleanedBody, fullContent: body };

    this.cache.set(body, result);

    console.log('Analysis details:', { category, isPriority, summary: summary.slice(0, 50) + '...' });

    return result;
  }
}

const emailAnalysisModel = new EmailAnalysisModel();

module.exports = emailAnalysisModel;