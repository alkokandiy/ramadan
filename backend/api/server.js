const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || 'https://ramadan-alpha-coral.vercel.app';

// Initialize Telegram bot with POLLING (not webhooks!)
const bot = new TelegramBot(token, { polling: true });

// Store data (temporary - we'll add database later)
const users = new Map();
const scores = {
  quran: new Map(),
  dhikr: new Map(),
  sadaqa: new Map()
};

// ===== TELEGRAM BOT COMMANDS =====
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log('Start command from:', chatId);
  
  bot.sendMessage(chatId, 
    `🌙 Assalomu alaykum! Ramazon muborak bo'lsin!\n\nMini appni ochish uchun tugmani bosing:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Mini Appni ochish', web_app: { url: webAppUrl } }]
        ]
      }
    }
  );
});

// ===== API ENDPOINTS FOR FRONTEND =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    message: 'Railway backend is running!'
  });
});

// Register user
app.post('/api/register', (req, res) => {
  const { telegramId, name } = req.body;
  users.set(telegramId.toString(), { 
    name, 
    registeredAt: new Date(),
    telegramId 
  });
  console.log('User registered:', telegramId, name);
  res.json({ success: true });
});

// Save score
app.post('/api/save', (req, res) => {
  const { telegramId, name, type, value } = req.body;
  const id = telegramId.toString();
  
  users.set(id, { name, telegramId: id });
  
  if (scores[type]) {
    scores[type].set(id, value);
    console.log('Score saved:', type, id, value);
  }
  
  res.json({ success: true });
});

// Get leaderboard
app.get('/api/leaderboard/:type', (req, res) => {
  const { type } = req.params;
  
  if (!scores[type]) {
    return res.status(400).json({ error: 'Invalid type' });
  }
  
  const entries = Array.from(scores[type].entries());
  const sorted = entries.sort((a, b) => b[1] - a[1]).slice(0, 20);
  
  const result = sorted.map(([id, score]) => ({
    name: users.get(id)?.name || 'Foydalanuvchi',
    score: score
  }));
  
  res.json(result);
});

// Get user data
app.get('/api/user/:telegramId', (req, res) => {
  const { telegramId } = req.params;
  const user = users.get(telegramId.toString());
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const userScores = {
    quran: scores.quran.get(telegramId.toString()) || 0,
    dhikr: scores.dhikr.get(telegramId.toString()) || 0,
    sadaqa: scores.sadaqa.get(telegramId.toString()) || 0
  };
  
  res.json({ ...user, scores: userScores });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebApp URL: ${webAppUrl}`);
});// Force redeploy Fri Mar 13 12:28:57 AM +05 2026
