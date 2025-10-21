import { useState, useEffect } from 'react';
import {
  testAnthropicConnection,
  testGeminiConnection,
  getCurrentAIProvider,
  suggestFormation,
  generateRoutes,
  suggestPlayName
} from '../lib/ai';
import { PlayerPosition, Slide } from '../types';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface TestResult {
  status: TestStatus;
  responseTime?: number;
  error?: string;
  sampleResponse?: any;
}

export default function AITest() {
  const [anthropicResult, setAnthropicResult] = useState<TestResult>({ status: 'idle' });
  const [geminiResult, setGeminiResult] = useState<TestResult>({ status: 'idle' });
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'status' | 'functions'>('status');
  const [testingFunction, setTestingFunction] = useState<string | null>(null);

  useEffect(() => {
    setCurrentProvider(getCurrentAIProvider());
  }, []);

  const testAnthropicAPI = async () => {
    setAnthropicResult({ status: 'testing' });
    try {
      const result = await testAnthropicConnection();
      setAnthropicResult({
        status: result.success ? 'success' : 'error',
        responseTime: Math.round(result.responseTime),
        error: result.error
      });
    } catch (error) {
      setAnthropicResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testGeminiAPI = async () => {
    setGeminiResult({ status: 'testing' });
    try {
      const result = await testGeminiConnection();
      setGeminiResult({
        status: result.success ? 'success' : 'error',
        responseTime: Math.round(result.responseTime),
        error: result.error
      });
    } catch (error) {
      setGeminiResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testBothAPIs = async () => {
    await Promise.all([testAnthropicAPI(), testGeminiAPI()]);
  };

  const testFormationSuggestion = async () => {
    setTestingFunction('formation');
    try {
      const startTime = performance.now();
      const result = await suggestFormation(3, 8, 65, '14-7');
      const responseTime = performance.now() - startTime;

      setActiveTab('functions');
      if (currentProvider === 'gemini') {
        setGeminiResult({
          status: 'success',
          responseTime: Math.round(responseTime),
          sampleResponse: result
        });
      } else {
        setAnthropicResult({
          status: 'success',
          responseTime: Math.round(responseTime),
          sampleResponse: result
        });
      }
    } catch (error) {
      const errorResult = {
        status: 'error' as TestStatus,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      if (currentProvider === 'gemini') {
        setGeminiResult(errorResult);
      } else {
        setAnthropicResult(errorResult);
      }
    }
    setTestingFunction(null);
  };

  const testRouteSuggestion = async () => {
    setTestingFunction('routes');
    try {
      const startTime = performance.now();
      const samplePlayers: PlayerPosition[] = [
        { id: 'WR1', label: 'WR1', x: 150, y: 200 },
        { id: 'WR2', label: 'WR2', x: 550, y: 200 },
        { id: 'RB', label: 'RB', x: 350, y: 340 }
      ];
      const result = await generateRoutes(samplePlayers, 'pass', '4-3 Cover 2');
      const responseTime = performance.now() - startTime;

      setActiveTab('functions');
      if (currentProvider === 'gemini') {
        setGeminiResult({
          status: 'success',
          responseTime: Math.round(responseTime),
          sampleResponse: result
        });
      } else {
        setAnthropicResult({
          status: 'success',
          responseTime: Math.round(responseTime),
          sampleResponse: result
        });
      }
    } catch (error) {
      const errorResult = {
        status: 'error' as TestStatus,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      if (currentProvider === 'gemini') {
        setGeminiResult(errorResult);
      } else {
        setAnthropicResult(errorResult);
      }
    }
    setTestingFunction(null);
  };

  const testPlayNames = async () => {
    setTestingFunction('names');
    try {
      const startTime = performance.now();
      const sampleSlide: Slide = {
        index: 0,
        positions: [
          { id: 'QB', label: 'QB', x: 350, y: 320 },
          { id: 'RB', label: 'RB', x: 350, y: 340 },
          { id: 'WR1', label: 'WR1', x: 150, y: 200 },
          { id: 'WR2', label: 'WR2', x: 550, y: 200 }
        ],
        routes: []
      };
      const result = await suggestPlayName(sampleSlide);
      const responseTime = performance.now() - startTime;

      setActiveTab('functions');
      if (currentProvider === 'gemini') {
        setGeminiResult({
          status: 'success',
          responseTime: Math.round(responseTime),
          sampleResponse: result
        });
      } else {
        setAnthropicResult({
          status: 'success',
          responseTime: Math.round(responseTime),
          sampleResponse: result
        });
      }
    } catch (error) {
      const errorResult = {
        status: 'error' as TestStatus,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      if (currentProvider === 'gemini') {
        setGeminiResult(errorResult);
      } else {
        setAnthropicResult(errorResult);
      }
    }
    setTestingFunction(null);
  };

  const renderStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'testing':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⚪';
    }
  };

  const renderProviderCard = (
    provider: 'Anthropic' | 'Gemini',
    result: TestResult,
    testFunction: () => Promise<void>
  ) => {
    const isActive = currentProvider === provider.toLowerCase();

    return (
      <div className={`border rounded-lg p-6 ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">{provider}</h3>
            {isActive && (
              <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm">Active</span>
            )}
          </div>
          <p className="text-gray-600 text-sm">
            {provider === 'Anthropic' ? 'Claude API (claude-3-haiku)' : 'Gemini 1.5 Flash API'}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status</span>
            <div className="flex items-center gap-2">
              <span>{renderStatusIcon(result.status)}</span>
              <span className="capitalize">{result.status}</span>
            </div>
          </div>

          {result.responseTime && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Response Time</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">{result.responseTime}ms</span>
            </div>
          )}

          {result.error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-600 mt-3">
              {result.error}
            </div>
          )}

          {result.sampleResponse && (
            <div className="mt-4">
              <p className="font-medium mb-2">Sample Response:</p>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40 border">
                {JSON.stringify(result.sampleResponse, null, 2)}
              </pre>
            </div>
          )}

          <button
            onClick={testFunction}
            disabled={result.status === 'testing'}
            className={`w-full py-2 px-4 rounded font-medium transition-colors ${
              result.status === 'testing'
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {result.status === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">AI API Endpoint Testing</h1>
          <p className="text-gray-600">
            Test and compare AI provider connections, response times, and functionality
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm">
            <strong>Current Provider:</strong> {currentProvider || 'Not configured'}.
            Set <code className="bg-white px-1 rounded">VITE_AI_PROVIDER</code> in your .env.local
            file to switch providers (anthropic or gemini).
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              activeTab === 'status'
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Connection Status
          </button>
          <button
            onClick={() => setActiveTab('functions')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              activeTab === 'functions'
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Test Functions
          </button>
        </div>

        {activeTab === 'status' ? (
          <div className="space-y-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={testBothAPIs}
                className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50"
              >
                Test All Connections
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {renderProviderCard('Anthropic', anthropicResult, testAnthropicAPI)}
              {renderProviderCard('Gemini', geminiResult, testGeminiAPI)}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-2">Test AI Functions</h2>
              <p className="text-gray-600 mb-4">
                Test specific AI functions to ensure they work correctly with the current provider
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={testFormationSuggestion}
                  disabled={testingFunction === 'formation'}
                  className={`py-2 px-4 border rounded font-medium transition-colors ${
                    testingFunction === 'formation'
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {testingFunction === 'formation' ? 'Testing...' : 'Test Formation Suggestion'}
                </button>

                <button
                  onClick={testRouteSuggestion}
                  disabled={testingFunction === 'routes'}
                  className={`py-2 px-4 border rounded font-medium transition-colors ${
                    testingFunction === 'routes'
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {testingFunction === 'routes' ? 'Testing...' : 'Test Route Generation'}
                </button>

                <button
                  onClick={testPlayNames}
                  disabled={testingFunction === 'names'}
                  className={`py-2 px-4 border rounded font-medium transition-colors ${
                    testingFunction === 'names'
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {testingFunction === 'names' ? 'Testing...' : 'Test Play Names'}
                </button>
              </div>

              {(anthropicResult.sampleResponse || geminiResult.sampleResponse) && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Latest Function Test Result:</h3>
                  <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-60 border">
                    {JSON.stringify(
                      anthropicResult.sampleResponse || geminiResult.sampleResponse,
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Performance Comparison</h2>
              {anthropicResult.responseTime && geminiResult.responseTime ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Anthropic Claude</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {anthropicResult.responseTime}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Google Gemini</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {geminiResult.responseTime}ms
                    </span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Faster Provider</span>
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                        {anthropicResult.responseTime < geminiResult.responseTime
                          ? 'Anthropic'
                          : 'Gemini'}{' '}
                        ({Math.abs(anthropicResult.responseTime - geminiResult.responseTime)}ms
                        faster)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Test both providers to see performance comparison</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white border rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Setup Instructions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Getting API Keys:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>
                  <strong>Anthropic (Claude):</strong> Get your API key from{' '}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    console.anthropic.com
                  </a>
                </li>
                <li>
                  <strong>Google Gemini:</strong> Get your API key from{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Configuration:</h3>
              <p className="text-sm text-gray-600 mb-2">
                Add these to your <code className="bg-gray-100 px-1 rounded">.env.local</code> file:
              </p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
{`# AI Provider Configuration
VITE_AI_PROVIDER=anthropic  # Options: anthropic, gemini
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Provider Comparison:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Anthropic Claude (Haiku):</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Excellent at structured JSON responses</li>
                    <li>More consistent formatting</li>
                    <li>Better context understanding</li>
                    <li>Slightly higher cost per token</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">Google Gemini (1.5 Flash):</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Very fast response times</li>
                    <li>Lower cost per token</li>
                    <li>Good for simple completions</li>
                    <li>May need response cleanup for JSON</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Recommendations for Football Play Design:</h3>
              <div className="bg-gray-50 p-4 rounded text-sm">
                <p className="mb-2">
                  <strong>Best for this use case: Anthropic Claude</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Better at understanding complex play concepts and football terminology</li>
                  <li>More consistent JSON formatting for play positions and routes</li>
                  <li>Superior at maintaining spatial relationships on the field</li>
                  <li>More reliable for generating valid coordinates within field bounds</li>
                </ul>
                <p className="mt-3">
                  <strong>Gemini is recommended as a fallback</strong> for cost savings and faster
                  response times in simpler operations like play name suggestions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}