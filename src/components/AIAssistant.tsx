import React, { useState } from 'react';
import { Play, Slide, PlayerPosition } from '../types';
import * as ai from '../lib/ai';

interface AIAssistantProps {
  play: Play;
  currentSlide: Slide;
  onApplyFormation: (positions: PlayerPosition[]) => void;
  onApplyRoutes: (routes: any[]) => void;
  onApplyVariation: (slide: Slide) => void;
  onUpdatePlayName: (name: string) => void;
}

export default function AIAssistant({
  play,
  currentSlide,
  onApplyFormation,
  onApplyRoutes,
  onApplyVariation,
  onUpdatePlayName
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [playDescription, setPlayDescription] = useState('');

  // Game context for formation suggestions
  const [gameContext, setGameContext] = useState({
    down: 1,
    distance: 10,
    fieldPosition: 50,
    score: 'Tied 0-0'
  });

  const handleSuggestFormation = async () => {
    setLoading(true);
    setError(null);
    setActiveFeature('formation');

    try {
      const suggestion = await ai.suggestFormation(
        gameContext.down,
        gameContext.distance,
        gameContext.fieldPosition,
        gameContext.score
      );
      setSuggestions(suggestion);
    } catch (err: any) {
      setError(err.message || 'Failed to get formation suggestion');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoutes = async () => {
    setLoading(true);
    setError(null);
    setActiveFeature('routes');

    try {
      // Get eligible receivers (exclude OL)
      const receivers = currentSlide.positions.filter(p =>
        !['LT', 'LG', 'C', 'RG', 'RT'].includes(p.id)
      );

      const routeSuggestions = await ai.generateRoutes(receivers, 'pass');
      setSuggestions(routeSuggestions);
    } catch (err: any) {
      setError(err.message || 'Failed to generate routes');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzePlay = async () => {
    setLoading(true);
    setError(null);
    setActiveFeature('analysis');

    try {
      const analysis = await ai.analyzePlay(play);
      setSuggestions(analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze play');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestNames = async () => {
    setLoading(true);
    setError(null);
    setActiveFeature('names');

    try {
      const names = await ai.suggestPlayName(currentSlide);
      setSuggestions(names);
    } catch (err: any) {
      setError(err.message || 'Failed to suggest names');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariation = async (type: 'motion' | 'formation' | 'personnel') => {
    setLoading(true);
    setError(null);
    setActiveFeature('variation');

    try {
      const variation = await ai.createVariation(currentSlide, type);
      setSuggestions(variation);
    } catch (err: any) {
      setError(err.message || 'Failed to create variation');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromDescription = async () => {
    if (!playDescription.trim()) {
      setError('Please enter a play description');
      return;
    }

    setLoading(true);
    setError(null);
    setActiveFeature('description');

    try {
      const generatedPlay = await ai.generatePlayFromDescription(playDescription, currentSlide);
      setSuggestions(generatedPlay);
    } catch (err: any) {
      setError(err.message || 'Failed to generate play from description');
    } finally {
      setLoading(false);
    }
  };

  const renderSuggestions = () => {
    if (!suggestions) return null;

    switch (activeFeature) {
      case 'formation':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">{suggestions.formation}</h4>
            <p className="text-sm text-gray-600">{suggestions.reasoning}</p>
            <button
              onClick={() => onApplyFormation(suggestions.playerPositions)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Apply Formation
            </button>
          </div>
        );

      case 'routes':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Route Suggestions</h4>
            {suggestions.map((route: any, idx: number) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">{route.playerId}:</span> {route.routeType}
              </div>
            ))}
            <button
              onClick={() => onApplyRoutes(suggestions)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Apply Routes
            </button>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900">Play Analysis</h4>
              <div className="text-lg font-bold text-blue-600">
                Rating: {suggestions.overallRating}/10
              </div>
            </div>

            <div>
              <h5 className="font-medium text-green-700">Strengths:</h5>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {suggestions.strengths.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-red-700">Weaknesses:</h5>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {suggestions.weaknesses.map((w: string, idx: number) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-blue-700">Suggestions:</h5>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {suggestions.suggestions.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'names':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Play Name Suggestions</h4>
            {suggestions.map((name: string, idx: number) => (
              <button
                key={idx}
                onClick={() => onUpdatePlayName(name)}
                className="block w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                {name}
              </button>
            ))}
          </div>
        );

      case 'variation':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Play Variation</h4>
            <p className="text-sm text-gray-600">
              New variation with {suggestions.positions.length} players
            </p>
            <button
              onClick={() => onApplyVariation(suggestions)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Apply Variation
            </button>
          </div>
        );

      case 'description':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">{suggestions.formation}</h4>
            <p className="text-sm text-gray-600 italic">{suggestions.explanation}</p>
            <div className="text-xs text-gray-500">
              {suggestions.playerPositions.length} players, {suggestions.routes.length} routes
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onApplyFormation(suggestions.playerPositions);
                  onApplyRoutes(suggestions.routes);
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Apply Play
              </button>
              <button
                onClick={() => onUpdatePlayName(suggestions.formation)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Use Name
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* AI Assistant Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 px-4 py-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all z-50"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-medium">AI Assistant</span>
        </div>
      </button>

      {/* AI Assistant Panel */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">AI Play Assistant</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Game Context for Formation Suggestions */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-3">Game Situation</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Down</label>
                  <select
                    value={gameContext.down}
                    onChange={(e) => setGameContext({...gameContext, down: Number(e.target.value)})}
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value={1}>1st</option>
                    <option value={2}>2nd</option>
                    <option value={3}>3rd</option>
                    <option value={4}>4th</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Distance</label>
                  <input
                    type="number"
                    value={gameContext.distance}
                    onChange={(e) => setGameContext({...gameContext, distance: Number(e.target.value)})}
                    className="w-full px-2 py-1 border rounded"
                    min="1"
                    max="30"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Field Position</label>
                  <input
                    type="number"
                    value={gameContext.fieldPosition}
                    onChange={(e) => setGameContext({...gameContext, fieldPosition: Number(e.target.value)})}
                    className="w-full px-2 py-1 border rounded"
                    min="1"
                    max="99"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Score</label>
                  <input
                    type="text"
                    value={gameContext.score}
                    onChange={(e) => setGameContext({...gameContext, score: e.target.value})}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Natural Language Play Generation */}
            <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
              <h3 className="font-semibold mb-2 text-purple-900">Generate Play from Description</h3>
              <p className="text-xs text-gray-600 mb-3">Describe your play in natural language and let AI create it!</p>
              <textarea
                value={playDescription}
                onChange={(e) => setPlayDescription(e.target.value)}
                placeholder="e.g., 'Create a play-action pass with a deep post route to WR1 and a corner route to WR2, RB runs a wheel route out of the backfield'"
                className="w-full px-3 py-2 border rounded resize-none text-sm"
                rows={4}
                disabled={loading}
              />
              <button
                onClick={handleGenerateFromDescription}
                disabled={loading || !playDescription.trim()}
                className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-medium"
              >
                Generate Play
              </button>
            </div>

            {/* AI Features */}
            <div className="space-y-3">
              <button
                onClick={handleSuggestFormation}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-left"
              >
                <div className="font-semibold">Suggest Formation</div>
                <div className="text-xs opacity-90">Get AI-recommended formation for game situation</div>
              </button>

              <button
                onClick={handleGenerateRoutes}
                disabled={loading}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-left"
              >
                <div className="font-semibold">Generate Routes</div>
                <div className="text-xs opacity-90">Create route combinations for receivers</div>
              </button>

              <button
                onClick={handleAnalyzePlay}
                disabled={loading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-left"
              >
                <div className="font-semibold">Analyze Play</div>
                <div className="text-xs opacity-90">Get feedback on current play design</div>
              </button>

              <button
                onClick={handleSuggestNames}
                disabled={loading}
                className="w-full px-4 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-left"
              >
                <div className="font-semibold">Name This Play</div>
                <div className="text-xs opacity-90">Get creative name suggestions</div>
              </button>

              <div className="pt-3 border-t">
                <div className="text-sm font-semibold text-gray-700 mb-2">Create Variation</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleCreateVariation('motion')}
                    disabled={loading}
                    className="px-3 py-2 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                  >
                    Motion
                  </button>
                  <button
                    onClick={() => handleCreateVariation('formation')}
                    disabled={loading}
                    className="px-3 py-2 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                  >
                    Formation
                  </button>
                  <button
                    onClick={() => handleCreateVariation('personnel')}
                    disabled={loading}
                    className="px-3 py-2 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                  >
                    Personnel
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="mt-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            )}

            {/* Suggestions Display */}
            {!loading && suggestions && (
              <div className="mt-6 p-4 bg-blue-50 rounded">
                {renderSuggestions()}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}