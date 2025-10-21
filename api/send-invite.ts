import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, inviteId, role, invitedByEmail, teamName } = req.body;

    // Validate required fields
    if (!email || !inviteId || !role || !invitedByEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Construct the invite URL
    const inviteUrl = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/invite/${inviteId}`;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Football Play Designer <noreply@crucibleanalytics.dev>',
      to: [email],
      subject: `You've been invited to join ${teamName || 'a football team'}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 20px;
                text-align: center;
                color: white;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
              }
              .content {
                padding: 40px 30px;
              }
              .content p {
                margin: 0 0 20px;
                font-size: 16px;
              }
              .role-badge {
                display: inline-block;
                background-color: #f0f0f0;
                color: #667eea;
                padding: 4px 12px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                text-transform: capitalize;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
              }
              .footer {
                padding: 30px;
                text-align: center;
                font-size: 14px;
                color: #666;
                background-color: #f9f9f9;
              }
              .footer p {
                margin: 5px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏈 Team Invitation</h1>
              </div>
              <div class="content">
                <p>Hello!</p>
                <p><strong>${invitedByEmail}</strong> has invited you to join their football team as a <span class="role-badge">${role}</span>.</p>
                <p>With this invitation, you'll be able to:</p>
                <ul>
                  <li>${role === 'coach' ? 'Create and edit plays' : 'View and practice team plays'}</li>
                  <li>Access the interactive play designer</li>
                  <li>Collaborate with your team</li>
                  ${role === 'coach' ? '<li>Invite and manage players</li>' : '<li>View play animations and routes</li>'}
                </ul>
                <center>
                  <a href="${inviteUrl}" class="button">Accept Invitation</a>
                </center>
                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                  This invitation will expire in 7 days. If you don't want to join, you can simply ignore this email.
                </p>
              </div>
              <div class="footer">
                <p>Football Play Designer</p>
                <p>If the button doesn't work, copy and paste this link:</p>
                <p style="word-break: break-all; color: #667eea;">${inviteUrl}</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error });
    }

    return res.status(200).json({ success: true, messageId: data?.id });
  } catch (error) {
    console.error('Error sending invite:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
