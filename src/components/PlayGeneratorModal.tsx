import React, { useState } from 'react';
import { PlayType, BallMarker, EndpointMarker } from '../types';
import { generatePlayFromEndpoint } from '../lib/ai';

type PlayGeneratorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (play: any) => void;
  ballPosition: BallMarker | null;
  endpointPosition: EndpointMarker | null;
}

const PlayGeneratorModal: React.FC<PlayGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  ballPosition,
  endpointPosition
}) => {
  const [playType, setPlayType] = useState<PlayType>('short-pass');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select-play-type' | 'generating'>('select-play-type');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!ballPosition || !endpointPosition) {
      setError('Please place both the ball and target markers on the field');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setStep('generating');

    try {
      const generatedPlay = await generatePlayFromEndpoint(
        ballPosition,
        endpointPosition,
        playType
      );

      onGenerate(generatedPlay);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate play');
      setStep('select-play-type');
    } finally {
      setIsGenerating(false);
    }
  };

  const playTypeOptions: { value: PlayType; label: string; description: string; icon: string }[] = [
    {
      value: 'run',
      label: 'Run Play',
      description: 'Ground attack with blocking schemes',
      icon: '🏃'
    },
    {
      value: 'short-pass',
      label: 'Short Pass',
      description: 'Quick throws, slants, and checkdowns',
      icon: '⚡'
    },
    {
      value: 'deep-pass',
      label: 'Deep Pass',
      description: 'Vertical routes and deep shots',
      icon: '🚀'
    },
    {
      value: 'screen',
      label: 'Screen Pass',
      description: 'Deceptive play with delayed handoff/pass',
      icon: '🎭'
    },
    {
      value: 'play-action',
      label: 'Play Action',
      description: 'Fake run to set up the pass',
      icon: '🎯'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Play Generator</h2>
              <p className="text-sm text-gray-500 mt-1">
                Generate a complete play from ball to endpoint
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {step === 'select-play-type' && (
            <>
              {/* Status */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {ballPosition && endpointPosition ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {ballPosition && endpointPosition
                        ? 'Ball and target positions set'
                        : !ballPosition
                        ? 'Place the ball marker on the field'
                        : 'Place the target endpoint on the field'}
                    </p>
                    {ballPosition && endpointPosition && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ball: ({Math.round(ballPosition.x)}, {Math.round(ballPosition.y)}) →
                        Target: ({Math.round(endpointPosition.x)}, {Math.round(endpointPosition.y)})
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Play Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Play Type
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {playTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPlayType(option.value)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left
                        ${playType === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                      {playType === option.value && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 'generating' && (
            <div className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              </div>
              <p className="text-gray-700 font-medium">Generating your play...</p>
              <p className="text-sm text-gray-500 mt-2">
                AI is designing formations, routes, and strategies
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Powered by AI Play Generation
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!ballPosition || !endpointPosition || isGenerating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate Play'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayGeneratorModal;