import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { useLocation } from 'react-router-dom';

export default function BugReport() {
  const [showModal, setShowModal] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [sending, setSending] = useState(false);
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bugDescription.trim()) {
      alert('Please describe the bug');
      return;
    }

    setSending(true);

    try {
      const user = auth.currentUser;
      const response = await fetch('/api/send-bug-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user?.email || 'anonymous@gridairon.com',
          userName: user?.displayName || 'Anonymous User',
          bugDescription,
          stepsToReproduce,
          pageLocation: location.pathname,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send bug report');
      }

      alert('Bug report sent successfully! Thank you for your feedback.');
      setBugDescription('');
      setStepsToReproduce('');
      setShowModal(false);
    } catch (error) {
      console.error('Error sending bug report:', error);
      alert('Failed to send bug report. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating Bug Report Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        title="Report a Bug"
      >
        <span className="text-2xl">🐛</span>
        <span className="absolute right-full mr-3 bg-iron-900 text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Report Bug
        </span>
      </button>

      {/* Bug Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                  <span>🐛</span>
                  Report a Bug
                </h2>
                <p className="text-iron-300 text-sm mt-1">
                  Help us improve GridAIron by reporting issues
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-iron-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="bugDescription" className="block text-sm font-medium text-white mb-2">
                  What's the bug? <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="bugDescription"
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  placeholder="Describe what went wrong..."
                  required
                  rows={4}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label htmlFor="stepsToReproduce" className="block text-sm font-medium text-white mb-2">
                  How can we reproduce it? (Optional)
                </label>
                <textarea
                  id="stepsToReproduce"
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                  rows={4}
                  className="input-field w-full"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-iron-200">
                  <strong className="text-blue-300">Auto-included info:</strong>
                  <br />
                  📍 Page: {location.pathname}
                  <br />
                  👤 User: {auth.currentUser?.email || 'Anonymous'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 btn-primary py-3 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Submit Bug Report'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={sending}
                  className="btn-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
