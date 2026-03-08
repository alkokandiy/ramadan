module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    const path = req.url.split('?')[0];
    
    if (path === '/api/health') {
      return res.status(200).json({ 
        status: 'ok', 
        url: 'https://ramadan-alpha-coral.vercel.app',
        time: new Date().toISOString()
      });
    }
  
    if (path === '/api/bot') {
      return res.status(200).json({ 
        message: 'Bot endpoint working',
        method: req.method
      });
    }
  
    return res.status(404).json({ error: 'Not found' });
  };