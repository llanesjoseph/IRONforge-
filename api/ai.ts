import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, provider = 'gemini' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (provider === 'gemini') {
      // Try both VITE_ and non-VITE_ prefixed env vars
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        console.error('Gemini API key not found. Checked: GEMINI_API_KEY, VITE_GEMINI_API_KEY');
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Gemini API error:', data);
        return res.status(response.status).json({ error: data.error?.message || 'API error' });
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        return res.status(500).json({ error: 'No response from AI' });
      }

      return res.status(200).json({ text });
    } 
    else if (provider === 'anthropic') {
      // Try both VITE_ and non-VITE_ prefixed env vars
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;

      if (!apiKey) {
        console.error('Anthropic API key not found. Checked: ANTHROPIC_API_KEY, VITE_ANTHROPIC_API_KEY');
        return res.status(500).json({ error: 'Anthropic API key not configured' });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Anthropic API error:', data);
        return res.status(response.status).json({ error: data.error?.message || 'API error' });
      }

      const text = data.content?.[0]?.text;
      
      if (!text) {
        return res.status(500).json({ error: 'No response from AI' });
      }

      return res.status(200).json({ text });
    }

    return res.status(400).json({ error: 'Invalid provider' });
  } catch (error: any) {
    console.error('AI API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
