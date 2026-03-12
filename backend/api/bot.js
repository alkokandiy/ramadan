const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

// Store data (in memory)
const users = new Map();
const scores = {
  quran: new Map(),
  dhikr: new Map(),
  sadaqa: new Map()
};

// Create bot instance
const bot = new TelegramBot(token);

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log('Start command received from:', chatId);
  
  bot.sendMessage(chatId, 
    `🌙 Assalomu alaykum! Ramazon muborak bo'lsin!\n\nQuyidagi tugma orqali mini appni oching:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Mini Appni ochish', web_app: { url: webAppUrl } }]
        ]
      }
    }
  ).catch(err => console.error('Send message error:', err));
});

// Vercel serverless function handler
module.exports = async (req, res) => {
  console.log('Request received:', req.method, req.url);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url.split('?')[0];
  console.log('Path:', path);

  try {
    // Health check endpoint
    if (path === '/api/health' && req.method === 'GET') {
      return res.status(200).json({ 
        status: 'ok', 
        message: 'API is working!',
        url: webAppUrl,
        time: new Date().toISOString()
      });
    }
    
    // Root API endpoint
    if (path === '/api' || path === '/api/') {
      return res.status(200).json({ 
        message: 'Ramadan API',
        endpoints: ['/api/health', '/api/bot', '/api/register', '/api/save', '/api/leaderboard']
      });
    }
    
    // Handle Telegram webhook
    if (path === '/api/bot' && req.method === 'POST') {
      console.log('Processing webhook update');
      await bot.processUpdate(req.body);
      return res.status(200).json({ ok: true });
    }
    
    // Register user
    if (path === '/api/register' && req.method === 'POST') {
      const { telegramId, name } = req.body;
      users.set(telegramId.toString(), { 
        name, 
        registeredAt: new Date(),
        telegramId 
      });
      console.log('User registered:', telegramId, name);
      return res.json({ success: true });
    }
    
    // Save score
    if (path === '/api/save' && req.method === 'POST') {
      const { telegramId, name, type, value } = req.body;
      const id = telegramId.toString();
      
      users.set(id, { name, telegramId: id });
      
      if (scores[type]) {
        scores[type].set(id, value);
        console.log('Score saved:', type, id, value);
      }
      
      return res.json({ success: true });
    }
    
    // Get leaderboard
    if (path === '/api/leaderboard' && req.method === 'GET') {
      const result = {};
      
      for (const type of ['quran', 'dhikr', 'sadaqa']) {
        const entries = Array.from(scores[type].entries());
        const sorted = entries.sort((a, b) => b[1] - a[1]).slice(0, 20);
        
        result[type] = sorted.map(([id, score]) => ({
          name: users.get(id)?.name || 'Foydalanuvchi',
          [type === 'quran' ? 'pages' : type === 'dhikr' ? 'count' : 'amount']: score
        }));
      }
      
      return res.json(result);
    }
    
    // If no route matches
    return res.status(404).json({ 
      error: 'Not found',
      path: path,
      availableEndpoints: ['/api', '/api/health', '/api/bot']
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};