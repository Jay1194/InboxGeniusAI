const cheerio = require('cheerio');
const he = require('he');

const CATEGORIES = [
  'Work', 'Personal', 'Spam', 'Social', 'Promotions', 
  'Updates', 'Finance', 'Support', 'Travel', 'Education'
];

class EmailAnalysisModel {
  constructor() {
    this.classifier = null;
    this.summarizer = null;
    this.isInitialized = false;
    this.initializationPromise = this.initialize();
  }

  async initialize() {
    console.log('Initializing AI models in the background...');
    try {
      const { pipeline } = await import('@xenova/transformers');
      const model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.classifier = async (text) => {
        const embeddings = await model(text);
        return this.classifyWithEmbeddings(embeddings.data);
      };
      this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
      this.isInitialized = true;
      console.log('AI models initialized successfully');
    } catch (error) {
      console.error('Error initializing models:', error);
    }
  }

  classifyWithEmbeddings(embeddings) {
    const categoryKeywords = {
      'Work': ['project', 'meeting', 'deadline', 'report', 'client'],
      'Personal': ['family', 'friend', 'holiday', 'birthday', 'personal'],
      'Spam': ['offer', 'winner', 'claim', 'prize', 'limited time'],
      'Social': ['party', 'event', 'invitation', 'social', 'network'],
      'Promotions': ['sale', 'discount', 'offer', 'promotion', 'deal'],
      'Updates': ['newsletter', 'update', 'announcement', 'notification', 'changes'],
      'Finance': ['invoice', 'payment', 'bill', 'transaction', 'financial'],
      'Support': ['help', 'issue', 'problem', 'support', 'assistance'],
      'Travel': ['flight', 'hotel', 'booking', 'reservation', 'travel'],
      'Education': ['course', 'class', 'lecture', 'assignment', 'school']
    };

    let maxScore = -Infinity;
    let bestCategory = 'Personal';  // default category

    for (const category of CATEGORIES) {
      const keywords = categoryKeywords[category];
      let score = 0;
      for (const keyword of keywords) {
        const keywordEmbedding = this.getAverageEmbedding(keyword.split(' '), embeddings);
        score += this.cosineSimilarity(embeddings, keywordEmbedding);
      }
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  getAverageEmbedding(words, embeddings) {
    // This is a simplified version. In a real scenario, you'd use a pre-trained word embedding model.
    return embeddings;
  }

  cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
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
        $elem.replaceWith(`[${text}](${href})`);
      }
    });
    let cleanedContent = $('body').html();
    cleanedContent = he.decode(cleanedContent);
    cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim();
    const maxLength = 1000;
    if (cleanedContent && cleanedContent.length > maxLength) {
      cleanedContent = cleanedContent.substring(0, maxLength) + '...';
    }
    return cleanedContent || '';
  }

  quickCategorize(text) {
    const categoryKeywords = {
      'Work': ['project', 'meeting', 'deadline', 'report', 'client'],
      'Personal': ['family', 'friend', 'holiday', 'birthday', 'personal'],
      'Spam': ['offer', 'winner', 'claim', 'prize', 'limited time'],
      'Social': ['party', 'event', 'invitation', 'social', 'network'],
      'Promotions': ['sale', 'discount', 'offer', 'promotion', 'deal'],
      'Updates': ['newsletter', 'update', 'announcement', 'notification', 'changes'],
      'Finance': ['invoice', 'payment', 'bill', 'transaction', 'financial'],
      'Support': ['help', 'issue', 'problem', 'support', 'assistance'],
      'Travel': ['flight', 'hotel', 'booking', 'reservation', 'travel'],
      'Education': ['course', 'class', 'lecture', 'assignment', 'school']
    };

    const lowercaseText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowercaseText.includes(keyword))) {
        return category;
      }
    }
    return 'Personal';  // default category
  }

  async categorizeEmail(text) {
    if (!this.isInitialized) {
      return this.quickCategorize(text);
    }
    return await this.classifier(text);
  }

  async summarizeEmail(text) {
    if (!this.isInitialized) {
      return text.slice(0, 100) + '...';  // Simple summary if not initialized
    }
    const result = await this.summarizer(text, {
      max_length: 100,
      min_length: 30,
      do_sample: false
    });
    return result[0].summary_text;
  }

  isPriority(text) {
    const priorityKeywords = ['urgent', 'important', 'asap', 'deadline', 'critical'];
    return priorityKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  async analyzeEmail(body) {
    const cleanedBody = await this.cleanEmailContent(body);
    const category = await this.categorizeEmail(cleanedBody);
    const isPriority = this.isPriority(cleanedBody);
    const summary = await this.summarizeEmail(cleanedBody);

    console.log('Analysis details:', { category, isPriority, summary: summary.slice(0, 50) + '...' });

    return {
      category,
      isPriority,
      summary,
      cleanedBody
    };
  }
}

const emailAnalysisModel = new EmailAnalysisModel();

module.exports = emailAnalysisModel;