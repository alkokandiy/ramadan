const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || 'https://your-app.vercel.app';

const bot = new TelegramBot(token, { webHook: true });

// Store data (in memory - will reset on restart)
const users = new Map();
const scores = {
  quran: new Map(),
  dhikr: new Map(),
  sadaqa: new Map()
};

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    `🌙 Ramazon muborak!\n\nQuyidagi tugma orqali mini appni oching:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Mini Appni ochish', web_app: { url: webAppUrl } }]
        ]
      }
    }
  );
});

// Export the handler function
module.exports = async (req, res) => {
  // Handle different API endpoints
  const { method, url, body } = req;
  
  // Parse URL to get path
  const path = url.split('?')[0];
  
  if (method === 'POST') {
    // Register user
    if (path === '/api/register') {
      const { telegramId, name } = body;
      users.set(telegramId, { name, registeredAt: new Date() });
      return res.json({ success: true });
    }
    
    // Save score
    if (path === '/api/save') {
      const { telegramId, name, type, value } = body;
      users.set(telegramId, { name });
      if (scores[type]) {
        scores[type].set(telegramId, value);
      }
      return res.json({ success: true });
    }
    
    // Handle bot webhook
    if (path === '/api/bot') {
      bot.processUpdate(body);
      return res.status(200).send('OK');
    }
  }
  
  // GET requests
  if (method === 'GET') {
    // Get leaderboard
    if (path === '/api/leaderboard') {
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
  }
  
  // If no route matches
  res.status(404).json({ error: 'Not found' });
};