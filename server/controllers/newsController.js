const News = require('../models/News');
const axios = require('axios');
const cheerio = require('cheerio');

// @desc    Get all tech news
// @route   GET /api/news
// @access  Public
exports.getNews = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    
    const query = category ? { category } : { category: 'Tech News' };
    
    const news = await News.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const totalNews = await News.countDocuments(query);
    
    res.json({
      news,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalNews / limit),
      totalItems: totalNews
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get job postings
// @route   GET /api/news/jobs
// @access  Public
exports.getJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const jobs = await News.find({ category: 'Job Posting' })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const totalJobs = await News.countDocuments({ category: 'Job Posting' });
    
    res.json({
      jobs,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalJobs / limit),
      totalItems: totalJobs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get promotions and coding challenges
// @route   GET /api/news/promotions
// @access  Public
exports.getPromotions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const query = { 
      category: { $in: ['Coding Challenge', 'Promotion'] },
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    };
    
    const promotions = await News.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const totalPromotions = await News.countDocuments(query);
    
    res.json({
      promotions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPromotions / limit),
      totalItems: totalPromotions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a news item (admin only)
// @route   POST /api/news
// @access  Admin
exports.createNews = async (req, res) => {
  try {
    const {
      title,
      content,
      imageUrl,
      source,
      sourceUrl,
      category,
      expiresAt,
      tags
    } = req.body;
    
    const news = await News.create({
      title,
      content,
      imageUrl,
      source,
      sourceUrl,
      category,
      expiresAt: expiresAt || null,
      tags: tags || []
    });
    
    res.status(201).json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Fetch and store news from external sources
// @route   POST /api/news/fetch
// @access  Admin
exports.fetchExternalNews = async (req, res) => {
  try {
    const { source } = req.body;
    let fetchedItems = [];
    
    // Fetch tech news (example)
    if (source === 'tech' || !source) {
      const techNews = await fetchTechNews();
      fetchedItems.push(...techNews);
    }
    
    // Fetch job postings (example) - would use LinkedIn API in real implementation
    if (source === 'jobs' || !source) {
      const jobs = await mockFetchJobs();
      fetchedItems.push(...jobs);
    }
    
    // Fetch coding challenges
    if (source === 'challenges' || !source) {
      const challenges = await mockFetchChallenges();
      fetchedItems.push(...challenges);
    }
    
    // Save to database
    const savedItems = [];
    for (const item of fetchedItems) {
      // Check if already exists
      const exists = await News.findOne({ 
        title: item.title,
        source: item.source 
      });
      
      if (!exists) {
        const savedItem = await News.create(item);
        savedItems.push(savedItem);
      }
    }
    
    res.json({
      message: `Successfully fetched ${fetchedItems.length} items and saved ${savedItems.length} new items.`,
      newItems: savedItems
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to fetch tech news
const fetchTechNews = async () => {
  try {
    // Example: Fetching from HackerNews
    const response = await axios.get('https://news.ycombinator.com/');
    const $ = cheerio.load(response.data);
    const news = [];
    
    $('.athing').each((index, element) => {
      if (index >= 10) return false; // Limit to 10 items
      
      const title = $(element).find('.title a').text();
      const sourceUrl = $(element).find('.title a').attr('href');
      const rank = $(element).find('.rank').text().replace('.', '');
      const nextRow = $(element).next();
      const source = nextRow.find('.sitestr').text() || 'Hacker News';
      
      if (title && sourceUrl) {
        news.push({
          title,
          content: `${title} - Ranked #${rank} on Hacker News.`,
          source,
          sourceUrl,
          category: 'Tech News',
          tags: ['technology', 'hacker news']
        });
      }
    });
    
    return news;
  } catch (error) {
    console.error('Error fetching tech news:', error);
    return [];
  }
};

// Mock function for LinkedIn job scraping
// In a real app, this would use LinkedIn API or web scraping
const mockFetchJobs = async () => {
  // This is a mock. In reality, you'd implement LinkedIn API calls or scraping
  return [
    {
      title: 'Senior Software Engineer',
      content: 'We are looking for a senior software engineer with 5+ years of experience in React and Node.js.',
      source: 'LinkedIn',
      sourceUrl: 'https://linkedin.com/jobs/view/senior-software-engineer',
      category: 'Job Posting',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      tags: ['software', 'engineering', 'react', 'node']
    },
    {
      title: 'Full Stack Developer',
      content: 'Looking for a full stack developer familiar with MERN stack.',
      source: 'LinkedIn',
      sourceUrl: 'https://linkedin.com/jobs/view/full-stack-developer',
      category: 'Job Posting',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      tags: ['full stack', 'mern', 'javascript']
    }
  ];
};

// Mock function for coding challenges
const mockFetchChallenges = async () => {
  // This is a mock. In reality, you'd scrape these from platforms
  return [
    {
      title: 'Google Kickstart 2023',
      content: 'Join the Google Kickstart coding competition and showcase your skills!',
      source: 'Google',
      sourceUrl: 'https://codingcompetitions.withgoogle.com/kickstart',
      category: 'Coding Challenge',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      tags: ['competition', 'google', 'kickstart']
    },
    {
      title: 'CodeChef Monthly Challenge',
      content: 'Participate in CodeChef\'s monthly coding challenge for prizes and recognition.',
      source: 'CodeChef',
      sourceUrl: 'https://www.codechef.com/contests',
      category: 'Coding Challenge',
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      tags: ['competition', 'codechef', 'monthly']
    }
  ];
};
