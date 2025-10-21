import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userEmail, userName, bugDescription, stepsToReproduce, pageLocation, userAgent } = req.body;

    if (!userEmail || !bugDescription) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await resend.emails.send({
      from: 'GridAIron Bug Reports <noreply@crucibleanalytics.dev>',
      to: ['joseph@crucibleanalytics.dev'], // Admin email
      replyTo: userEmail,
      subject: `🐛 Bug Report from ${userName || userEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
              }
              .container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
                margin: -30px -30px 20px -30px;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .section {
                margin: 20px 0;
                padding: 15px;
                background-color: #f9f9f9;
                border-left: 4px solid #667eea;
                border-radius: 4px;
              }
              .section h2 {
                margin: 0 0 10px 0;
                font-size: 16px;
                color: #667eea;
                text-transform: uppercase;
              }
              .section p {
                margin: 0;
                white-space: pre-wrap;
              }
              .meta {
                font-size: 12px;
                color: #666;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
              }
              .bug-icon {
                font-size: 48px;
                text-align: center;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🐛 Bug Report</h1>
              </div>

              <div class="bug-icon">🔴</div>

              <div class="section">
                <h2>Reporter Information</h2>
                <p><strong>Name:</strong> ${userName || 'Not provided'}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
              </div>

              <div class="section">
                <h2>Bug Description</h2>
                <p>${bugDescription}</p>
              </div>

              ${stepsToReproduce ? `
              <div class="section">
                <h2>Steps to Reproduce</h2>
                <p>${stepsToReproduce}</p>
              </div>
              ` : ''}

              <div class="section">
                <h2>Location</h2>
                <p><strong>Page:</strong> ${pageLocation || 'Not specified'}</p>
              </div>

              <div class="meta">
                <p><strong>User Agent:</strong> ${userAgent || 'Not provided'}</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send bug report', details: error });
    }

    return res.status(200).json({ success: true, messageId: data?.id });
  } catch (error) {
    console.error('Error sending bug report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
