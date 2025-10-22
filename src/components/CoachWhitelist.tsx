import React, { useState } from 'react';
import { getCoachEmails } from '../lib/admin';

export default function CoachWhitelist() {
  const [newEmail, setNewEmail] = useState('');
  const [coaches, setCoaches] = useState<string[]>(getCoachEmails());
  const [copied, setCopied] = useState(false);

  const loginUrl = window.location.origin + '/login';

  const handleAddCoach = () => {
    if (!newEmail.trim()) {
      alert('Please enter an email');
      return;
    }

    if (!newEmail.includes('@')) {
      alert('Please enter a valid email');
      return;
    }

    alert(`To add this coach, please:\n\n1. Open src/lib/admin.ts\n2. Add '${newEmail.toLowerCase()}' to the COACH_EMAILS array\n3. Save the file\n4. Share this login link: ${loginUrl}`);
    setNewEmail('');
  };

  const copyLoginLink = () => {
    navigator.clipboard.writeText(loginUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-display font-bold text-white mb-4">
        Coach Login Setup
      </h2>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
        <h3 className="text-white font-semibold mb-2">How to Add a Coach:</h3>
        <ol className="text-iron-200 text-sm space-y-2 list-decimal list-inside">
          <li>Open <code className="bg-iron-700 px-2 py-1 rounded text-xs">src/lib/admin.ts</code></li>
          <li>Add their email (lowercase) to the <code className="bg-iron-700 px-2 py-1 rounded text-xs">COACH_EMAILS</code> array</li>
          <li>Save the file (auto-refreshes)</li>
          <li>Share the login link below with them</li>
        </ol>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Coach Email (for reference)
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="coach@school.edu"
              className="input-field flex-1"
            />
            <button
              onClick={handleAddCoach}
              className="btn-primary whitespace-nowrap"
            >
              Get Instructions
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Login Link to Share
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={loginUrl}
              readOnly
              className="input-field flex-1 opacity-60"
            />
            <button
              onClick={copyLoginLink}
              className="btn-secondary whitespace-nowrap"
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="text-xs text-iron-400 mt-1">
            Share this link with coaches. They'll sign in with Google and automatically get coach access.
          </p>
        </div>
      </div>

      {coaches.length > 0 && (
        <div className="mt-4 pt-4 border-t border-iron-700">
          <h3 className="text-sm font-semibold text-white mb-2">Current Coach Emails:</h3>
          <ul className="space-y-1">
            {coaches.map((email) => (
              <li key={email} className="text-sm text-iron-300">
                • {email}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
