import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { tripsRightTemplate, doublesTemplate, emptyTemplate } from '../lib/formations';
import * as ai from '../lib/ai';
import { Slide } from '../types';

type FormationType = 'trips' | 'doubles' | 'empty';
type CreationMode = 'template' | 'description';

export default function NewPlay() {
  const navigate = useNavigate();
  const [creationMode, setCreationMode] = useState<CreationMode>('template');
  const [formation, setFormation] = useState<FormationType>('trips');
  const [playName, setPlayName] = useState('');
  const [playDescription, setPlayDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateFromTemplate = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const slides = formation === 'trips'
        ? tripsRightTemplate()
        : formation === 'doubles'
        ? doublesTemplate()
        : emptyTemplate();

      const formationLabels = {
        trips: 'Trips Right',
        doubles: 'Doubles',
        empty: 'Empty'
      };

      const docRef = await addDoc(collection(db, 'plays'), {
        name: playName || `New Play (${formationLabels[formation]})`,
        teamId: 'team-1',
        createdBy: user.uid,
        slides,
        formation, // Store the formation type
        createdAt: serverTimestamp(),
      });

      navigate(`/play/${docRef.id}`);
    } catch (error) {
      console.error('Error creating play:', error);
      setError('Failed to create play. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromDescription = async () => {
    if (!playDescription.trim()) {
      setError('Please enter a play description');
      return;
    }

    // Check authentication
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to create plays. Please sign in and try again.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Generate play from AI description
      const generatedPlay = await ai.generatePlayFromDescription(playDescription);

      // Create first slide with AI-generated play
      const firstSlide: Slide = {
        index: 1,
        positions: generatedPlay.playerPositions,
        routes: generatedPlay.routes
      };

      // Create additional empty slides (2-5) with same positions but no routes
      const slides: Slide[] = [firstSlide];
      for (let i = 2; i <= 5; i++) {
        slides.push({
          index: i,
          positions: generatedPlay.playerPositions.map(p => ({ ...p })),
          routes: []
        });
      }

      const docRef = await addDoc(collection(db, 'plays'), {
        name: playName || generatedPlay.formation,
        teamId: 'team-1',
        createdBy: user.uid,
        slides,
        formation: undefined, // AI-generated, no specific template
        notes: `AI Generated: ${playDescription}\n\n${generatedPlay.explanation}`,
        createdAt: serverTimestamp(),
      });

      navigate(`/play/${docRef.id}`);
    } catch (error: any) {
      console.error('Error creating AI play:', error);

      // Better error messages
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        setError('You don\'t have permission to create plays. Please contact your coach to get access.');
      } else if (error.message?.includes('API')) {
        setError('AI service error. Please check your AI API key configuration.');
      } else {
        setError(error.message || 'Failed to generate play. Please try again with a more detailed description.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (creationMode === 'description') {
      handleCreateFromDescription();
    } else {
      handleCreateFromTemplate();
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-display font-bold text-white">Create New Play</h1>
            <Link
              to="/"
              className="btn-secondary"
            >
              Cancel
            </Link>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Creation Mode Toggle */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                How would you like to create your play?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCreationMode('template')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    creationMode === 'template'
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-iron-800 border-iron-700 text-iron-300 hover:border-purple-500/50'
                  }`}
                >
                  <div className="font-semibold mb-1">Formation Template</div>
                  <div className="text-xs opacity-75">Choose from preset formations</div>
                </button>
                <button
                  onClick={() => setCreationMode('description')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    creationMode === 'description'
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-iron-800 border-iron-700 text-iron-300 hover:border-purple-500/50'
                  }`}
                >
                  <div className="font-semibold mb-1">AI Description</div>
                  <div className="text-xs opacity-75">Describe your play in words</div>
                </button>
              </div>
            </div>

            {/* Play Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Play Name (Optional)
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="Enter play name..."
                value={playName}
                onChange={(e) => setPlayName(e.target.value)}
              />
            </div>

            {/* Template Mode */}
            {creationMode === 'template' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Formation Template
                  </label>
                  <select
                    className="input-field w-full"
                    value={formation}
                    onChange={(e) => setFormation(e.target.value as FormationType)}
                  >
                    <option value="trips">Trips Right</option>
                    <option value="doubles">Doubles</option>
                    <option value="empty">Empty</option>
                  </select>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Formation Details:</h3>
                  <div className="text-sm text-iron-200">
                    {formation === 'trips' && (
                      <p>Trips Right formation with 3 receivers to the right side, single back in the backfield. Includes 5 slides.</p>
                    )}
                    {formation === 'doubles' && (
                      <p>Doubles formation with 2 receivers on each side, single back in the backfield. Includes 5 slides.</p>
                    )}
                    {formation === 'empty' && (
                      <p>Empty backfield with 5 receivers spread across the field, no running backs. Includes 5 slides.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Description Mode */}
            {creationMode === 'description' && (
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-lg p-5">
                <label className="block text-sm font-medium text-white mb-3">
                  Describe Your Play
                </label>
                <textarea
                  value={playDescription}
                  onChange={(e) => setPlayDescription(e.target.value)}
                  placeholder="e.g., 'Create a play-action pass with a deep post route to WR1 and a corner route to WR2, RB runs a wheel route out of the backfield'"
                  className="input-field w-full resize-none"
                  rows={6}
                  disabled={loading}
                />
                <div className="mt-3 text-xs text-iron-300 space-y-1">
                  <p>💡 <strong>Tips:</strong></p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Describe the play type (pass, run, screen, play-action)</li>
                    <li>Mention specific routes or player movements</li>
                    <li>Include formation preferences if you have any</li>
                    <li>The AI will create your play with 5 slides automatically</li>
                  </ul>
                </div>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={loading || (creationMode === 'description' && !playDescription.trim())}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {creationMode === 'description' ? 'Generating Play...' : 'Creating...'}
                </span>
              ) : (
                creationMode === 'description' ? 'Generate Play with AI' : 'Create Play'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}