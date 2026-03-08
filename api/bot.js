// api/bot.js - Test version
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    const path = req.url.split('?')[0];
    console.log(`API Hit: ${req.method} ${path}`);
  
    // Simple health check
    if (path === '/api/health' || path === '/api/bot') {
      return res.status(200).json({ 
        status: 'ok', 
        message: 'API is working!',
        path: path,
        method: req.method
      });
    }
  
    return res.status(404).json({ error: 'Not found' });
  };