import React, { useState } from 'react';
import { DefensiveScheme } from '../types';

type RedTeamPanelProps = {
  isActive: boolean;
  defensiveScheme: DefensiveScheme | null;
  isLoading: boolean;
  onToggle: () => void;
  onChallenge: () => void;
  onClearDefense: () => void;
}

const RedTeamPanel: React.FC<RedTeamPanelProps> = ({
  isActive,
  defensiveScheme,
  isLoading,
  onToggle,
  onChallenge,
  onClearDefense
}) => {
  const [showDetails, setShowDetails] = useState(true);

  const getSuccessColor = (probability: number) => {
    if (probability >= 0.7) return 'text-green-600 bg-green-50';
    if (probability >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatProbability = (probability: number) => {
    return `${Math.round(probability * 100)}%`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all
                ${isActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Red Team {isActive ? 'ON' : 'OFF'}</span>
            </button>

            {isActive && (
              <span className="text-xs text-red-600 font-medium px-2 py-1 bg-red-50 rounded">
                DEFENSIVE AI ACTIVE
              </span>
            )}
          </div>

          {isActive && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isActive && showDetails && (
        <div className="p-4 space-y-4">
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onChallenge}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Analyzing...
                </span>
              ) : (
                'Challenge Play'
              )}
            </button>
            {defensiveScheme && (
              <button
                onClick={onClearDefense}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Defense
              </button>
            )}
          </div>

          {/* Defensive Scheme Details */}
          {defensiveScheme && (
            <div className="space-y-4">
              {/* Formation */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Defensive Formation</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{defensiveScheme.formation}</p>
                </div>
              </div>

              {/* Success Probability */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Defense Success Rate</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        defensiveScheme.analysis.successProbability >= 0.7
                          ? 'bg-green-500'
                          : defensiveScheme.analysis.successProbability >= 0.4
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${defensiveScheme.analysis.successProbability * 100}%` }}
                    />
                  </div>
                  <span className={`font-bold px-2 py-1 rounded text-sm ${getSuccessColor(defensiveScheme.analysis.successProbability)}`}>
                    {formatProbability(defensiveScheme.analysis.successProbability)}
                  </span>
                </div>
              </div>

              {/* Play Recognition */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">AI Analysis</h3>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">{defensiveScheme.analysis.playRecognition}</p>
                </div>
              </div>

              {/* Weaknesses */}
              {defensiveScheme.analysis.weaknesses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Identified Weaknesses</h3>
                  <div className="space-y-2">
                    {defensiveScheme.analysis.weaknesses.map((weakness, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                        <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-red-700 flex-1">{weakness}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Offensive Adjustments */}
              {defensiveScheme.analysis.recommendedOffensiveAdjustments &&
               defensiveScheme.analysis.recommendedOffensiveAdjustments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Recommended Counters</h3>
                  <div className="space-y-2">
                    {defensiveScheme.analysis.recommendedOffensiveAdjustments.map((adjustment, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                        <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-green-700 flex-1">{adjustment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Player Assignments */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Defensive Assignments</h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {defensiveScheme.players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">{player.label}</span>
                      <span className="text-xs text-gray-500">{player.assignment}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Instructions when no scheme */}
          {!defensiveScheme && !isLoading && (
            <div className="text-center py-6">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-gray-500 text-sm">
                Click "Challenge Play" to generate a defensive scheme
              </p>
              <p className="text-gray-400 text-xs mt-1">
                AI will analyze your offensive play and create a counter-defense
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RedTeamPanel;