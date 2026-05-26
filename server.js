const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const KEY  = process.env.ANTHROPIC_API_KEY;

app.use(express.json({ limit: '10mb' }));

// Serve index.html from the ROOT folder (no public subfolder needed)
app.use(express.static(__dirname));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Proxy to Anthropic API
app.post('/api/analyse', async (req, res) => {
  if (!KEY) {
    return res.status(500).json({ error: 'API key not configured. Add ANTHROPIC_API_KEY in Render environment variables.' });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BillGuard running on port ${PORT}`);
});
