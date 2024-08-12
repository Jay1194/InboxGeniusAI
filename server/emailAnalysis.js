const cheerio = require('cheerio');
const he = require('he');
const natural = require('natural');
const sw = require('stopword');
const { TfIdf, PorterStemmer, WordTokenizer } = natural;

class EmailAnalysisModel {
  constructor() {
    this.classifier = new natural.BayesClassifier();
    this.tokenizer = new WordTokenizer();
    this.cache = new Map();
    this.initializeClassifier();
  }

  initializeClassifier() {
    const trainingData = [
      { text: "meeting schedule project deadline tasks assignment report presentation client", category: "Work" },
      { text: "family dinner weekend plans vacation photos birthday party holiday gifts", category: "Personal" },
      { text: "win lottery claim prize now limited offer discount sale best deal", category: "Spam" },
      { text: "friend request social media update likes shares post comment follow", category: "Social" },
      { text: "exclusive offer limited time discount sale products coupon code shop now", category: "Promotions" },
      { text: "account security important update password change login activity alert", category: "Updates" },
      { text: "bank statement transaction alert balance transfer credit card payment due", category: "Finance" },
      { text: "customer support ticket resolution issue fix problem solved inquiry assistance", category: "Support" },
      { text: "flight booking confirmation itinerary travel details hotel reservation car rental", category: "Travel" },
      { text: "course registration deadline reminder class schedule assignment due exam date", category: "Education" }
    ];

    trainingData.forEach(item => {
      this.classifier.addDocument(this.preprocessText(item.text), item.category);
    });
    this.classifier.train();
  }

  preprocessText(text) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const stemmed = tokens.map(token => PorterStemmer.stem(token));
    return sw.removeStopwords(stemmed).join(' ');
  }

  async cleanEmailContent(content) {
    const $ = cheerio.load(content);
    $('script, style').remove();
    let cleanedContent = $('body').text();
    cleanedContent = he.decode(cleanedContent);
    cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim();
    return cleanedContent || '';
  }

  categorizeEmail(text, subject = '') {
    const preprocessedText = this.preprocessText(text + ' ' + subject);
    return this.classifier.classify(preprocessedText);
  }

  summarizeEmail(text, subject, maxLength = 100) {
    if (!text || text.trim().length === 0) {
      return subject ? `Subject: ${subject}` : "No summary available";
    }

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return subject ? `Subject: ${subject}` : "No summary available";

    const tfidf = new TfIdf();
    sentences.forEach(sentence => tfidf.addDocument(sentence));

    // Add subject as a separate document with higher weight
    if (subject) {
      tfidf.addDocument(subject.repeat(3)); // Repeat to increase weight
    }

    const sentenceScores = sentences.map((sentence, index) => {
      const score = tfidf.tfidf(sentence.split(' '), index);
      return { sentence, score };
    });

    sentenceScores.sort((a, b) => b.score - a.score);

    let summary = subject ? `Subject: ${subject}. ` : '';
    let currentLength = summary.length;

    for (let i = 0; i < sentenceScores.length && currentLength < maxLength; i++) {
      const sentenceToAdd = sentenceScores[i].sentence.trim() + '. ';
      if (currentLength + sentenceToAdd.length <= maxLength) {
        summary += sentenceToAdd;
        currentLength += sentenceToAdd.length;
      } else {
        break;
      }
    }

    return summary.trim() || "No summary available";
  }

  isPriority(text, subject = '') {
    const priorityKeywords = ['urgent', 'important', 'asap', 'deadline', 'critical', 'immediate attention', 'time-sensitive', 'priority'];
    const textLower = text.toLowerCase();
    const subjectLower = subject.toLowerCase();
    
    return priorityKeywords.some(keyword => textLower.includes(keyword) || subjectLower.includes(keyword));
  }

  async analyzeEmail(body, subject = '') {
    const cacheKey = `${subject}:${body.substring(0, 100)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const cleanedBody = await this.cleanEmailContent(body);
    const category = this.categorizeEmail(cleanedBody, subject);
    const isPriority = this.isPriority(cleanedBody, subject);
    const summary = this.summarizeEmail(cleanedBody, subject);

    const result = { category, isPriority, summary, cleanedBody };

    this.cache.set(cacheKey, result);

    return result;
  }
}

const emailAnalysisModel = new EmailAnalysisModel();

module.exports = emailAnalysisModel;