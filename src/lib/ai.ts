import {
  PlayerPosition,
  Play,
  Slide,
  PlayType,
  GeneratedPlay,
  DefensiveScheme,
  Route
} from '../types';

// AI Provider Types
type AIProvider = 'anthropic' | 'gemini';

interface AIConfig {
  provider: AIProvider;
  anthropicApiKey?: string;
  geminiApiKey?: string;
}

// Anthropic configuration
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-3-haiku-20240307';

// Gemini configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface AIResponse {
  content: string;
  error?: string;
}

interface FormationSuggestion {
  formation: string;
  reasoning: string;
  playerPositions: PlayerPosition[];
}

interface RouteSuggestion {
  playerId: string;
  routeType: string;
  points: { x: number; y: number }[];
}

interface PlayAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  overallRating: number;
}

// Get current AI configuration
function getAIConfig(): AIConfig {
  return {
    provider: (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'anthropic',
    anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY
  };
}

// Call Anthropic Claude API via serverless function
async function callAnthropicAI(prompt: string): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      provider: 'anthropic'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.text;
}

// Call Google Gemini API via serverless function
async function callGeminiAI(prompt: string): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      provider: 'gemini'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.text;
}

// Main AI call function with provider selection and fallback
async function callAI(prompt: string): Promise<string> {
  const config = getAIConfig();
  const provider = config.provider;

  console.log(`Using AI provider: ${provider}`);

  try {
    if (provider === 'gemini') {
      return await callGeminiAI(prompt);
    } else {
      return await callAnthropicAI(prompt);
    }
  } catch (error) {
    console.error(`Primary provider (${provider}) failed:`, error);

    // Try fallback provider
    try {
      if (provider === 'gemini') {
        console.warn('Gemini failed, falling back to Anthropic');
        return await callAnthropicAI(prompt);
      } else {
        console.warn('Anthropic failed, falling back to Gemini');
        return await callGeminiAI(prompt);
      }
    } catch (fallbackError) {
      console.error('Both AI providers failed:', fallbackError);
      throw new Error(`All AI providers failed. Original error: ${error}`);
    }
  }
}

// Provider-specific test functions
export async function testAnthropicConnection(): Promise<{ success: boolean; responseTime: number; error?: string }> {
  const startTime = performance.now();
  try {
    const response = await callAnthropicAI('Return only the word "OK" without any additional text or formatting.');
    const responseTime = performance.now() - startTime;
    const success = response.toLowerCase().includes('ok');
    return { success, responseTime };
  } catch (error) {
    const responseTime = performance.now() - startTime;
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function testGeminiConnection(): Promise<{ success: boolean; responseTime: number; error?: string }> {
  const startTime = performance.now();
  try {
    const response = await callGeminiAI('Return only the word "OK" without any additional text or formatting.');
    const responseTime = performance.now() - startTime;
    const success = response.toLowerCase().includes('ok');
    return { success, responseTime };
  } catch (error) {
    const responseTime = performance.now() - startTime;
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Suggest the best formation based on game context
 */
export async function suggestFormation(
  down?: number,
  distance?: number,
  fieldPosition?: number,
  score?: string
): Promise<FormationSuggestion> {
  const prompt = `You are an expert football offensive coordinator. Given this game situation:
- Down: ${down || 'Not specified'}
- Distance: ${distance || 'Not specified'} yards
- Field Position: ${fieldPosition || 'Not specified'} yard line
- Score: ${score || 'Not specified'}

Suggest the best offensive formation and explain why. Consider spacing, personnel groupings, and strategic advantages.

Return your response in this exact JSON format:
{
  "formation": "Formation Name",
  "reasoning": "Detailed explanation of why this formation is optimal",
  "playerPositions": [
    {"id": "QB", "label": "QB", "x": 360, "y": 320},
    {"id": "RB", "label": "RB", "x": 360, "y": 360},
    {"id": "LT", "label": "LT", "x": 260, "y": 300},
    {"id": "LG", "label": "LG", "x": 300, "y": 300},
    {"id": "C", "label": "C", "x": 340, "y": 300},
    {"id": "RG", "label": "RG", "x": 380, "y": 300},
    {"id": "RT", "label": "RT", "x": 420, "y": 300},
    {"id": "X", "label": "X", "x": 200, "y": 200},
    {"id": "Y", "label": "Y", "x": 440, "y": 220},
    {"id": "Z", "label": "Z", "x": 480, "y": 200}
  ]
}

Ensure all positions are within field bounds (0-700 width, 0-400 height) and align to 20-pixel grid.`;

  try {
    const response = await callAI(prompt);
    // Clean JSON response (Gemini sometimes adds markdown formatting)
    let cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON if there's text before or after it
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanedResponse);
    return parsed as FormationSuggestion;
  } catch (error) {
    console.error('Failed to parse AI formation suggestion:', error);
    throw new Error('Failed to generate formation suggestion');
  }
}

/**
 * Generate route combinations for selected players
 */
export async function generateRoutes(
  players: PlayerPosition[],
  playType: 'pass' | 'run' = 'pass',
  defense?: string
): Promise<RouteSuggestion[]> {
  const playerList = players.map(p => `${p.id} (${p.label})`).join(', ');

  const prompt = `You are an expert football offensive coordinator designing ${playType} routes.
Players: ${playerList}
Defense: ${defense || 'Standard 4-3'}

Design effective route combinations that:
1. Create spacing and leverage
2. Attack different levels of the defense
3. Include at least one checkdown option
4. Consider timing and player positioning

Return routes as JSON array:
[
  {
    "playerId": "X",
    "routeType": "Post",
    "points": [
      {"x": 200, "y": 200},
      {"x": 200, "y": 100},
      {"x": 350, "y": 50}
    ]
  },
  {
    "playerId": "Y",
    "routeType": "Dig",
    "points": [
      {"x": 440, "y": 220},
      {"x": 440, "y": 150},
      {"x": 350, "y": 150}
    ]
  }
]

Ensure all points are within field bounds (0-700 width, 0-400 height).`;

  try {
    const response = await callAI(prompt);
    let cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON if there's text before or after it
    const jsonMatch = cleanedResponse.match(/[\[\{][\s\S]*[\]\}]/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanedResponse);
    return parsed as RouteSuggestion[];
  } catch (error) {
    console.error('Failed to parse AI route suggestion:', error);
    throw new Error('Failed to generate routes');
  }
}

/**
 * Analyze play design and provide feedback
 */
export async function analyzePlay(playData: Play): Promise<PlayAnalysis> {
  const slide = playData.slides[0]; // Analyze first slide as primary formation
  const playerCount = slide.positions.length;
  const hasRoutes = slide.routes && slide.routes.length > 0;

  const prompt = `You are an expert football coach analyzing this play design:
- Play Name: ${playData.name}
- Number of Players: ${playerCount}
- Has Routes Defined: ${hasRoutes}
- Player Positions: ${JSON.stringify(slide.positions.map(p => ({id: p.id, x: p.x, y: p.y})))}
${hasRoutes ? `- Routes: ${JSON.stringify(slide.routes)}` : ''}

Analyze this play design for:
1. Formation balance and spacing
2. Route combinations and timing (if applicable)
3. Potential weaknesses or vulnerabilities
4. Strategic effectiveness

Return analysis as JSON:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "overallRating": 7.5
}

Rating should be 1-10 scale where 10 is perfect.`;

  try {
    const response = await callAI(prompt);
    let cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON if there's text before or after it
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanedResponse);
    return parsed as PlayAnalysis;
  } catch (error) {
    console.error('Failed to parse AI play analysis:', error);
    throw new Error('Failed to analyze play');
  }
}

/**
 * Suggest creative play names based on the design
 */
export async function suggestPlayName(playData: Slide): Promise<string[]> {
  const hasRoutes = playData.routes && playData.routes.length > 0;
  const routeCount = playData.routes?.length || 0;

  const prompt = `You are a creative football coach naming plays. Based on this play design:
- Player Positions: ${JSON.stringify(playData.positions.map(p => ({id: p.id, label: p.label})))}
${hasRoutes ? `- Has ${routeCount} routes defined` : '- No routes defined yet'}

Suggest 5 creative, memorable play names that:
1. Are easy to call in the huddle
2. Optionally reference the formation or key concept
3. Could include colors, animals, cities, or action words
4. Should be 1-3 words maximum

Return as JSON array of strings:
["Name 1", "Name 2", "Name 3", "Name 4", "Name 5"]`;

  try {
    const response = await callAI(prompt);
    let cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON if there's text before or after it
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanedResponse);
    return parsed as string[];
  } catch (error) {
    console.error('Failed to parse AI play names:', error);
    throw new Error('Failed to generate play names');
  }
}

/**
 * Create play variations based on current design
 */
export async function createVariation(
  originalSlide: Slide,
  variationType: 'motion' | 'formation' | 'personnel' = 'formation'
): Promise<Slide> {
  const prompt = `You are a football offensive coordinator creating a ${variationType} variation of this play:
- Original Positions: ${JSON.stringify(originalSlide.positions)}
${originalSlide.routes ? `- Original Routes: ${JSON.stringify(originalSlide.routes)}` : ''}

Create a variation that:
${variationType === 'motion' ? '- Adds pre-snap motion to create advantages' :
  variationType === 'formation' ? '- Adjusts the formation while keeping core concepts' :
  '- Changes personnel grouping (e.g., add TE, remove RB)'}

Return the complete new slide as JSON:
{
  "index": 1,
  "positions": [
    {"id": "QB", "label": "QB", "x": 360, "y": 320},
    // ... all other positions
  ],
  "routes": []
}

Ensure all positions are within bounds (0-700 width, 0-400 height) and aligned to 20-pixel grid.`;

  try {
    const response = await callAI(prompt);
    let cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON if there's text before or after it
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanedResponse);
    return parsed as Slide;
  } catch (error) {
    console.error('Failed to parse AI variation:', error);
    throw new Error('Failed to create variation');
  }
}

/**
 * Test if AI service is configured and working
 */
export async function testAIConnection(): Promise<boolean> {
  try {
    await callAI('Return the word "success" only');
    return true;
  } catch (error) {
    console.error('AI connection test failed:', error);
    return false;
  }
}

/**
 * Generate a complete offensive play from ball position to endpoint
 */
export async function generatePlayFromEndpoint(
  ballPosition: { x: number; y: number },
  targetEndpoint: { x: number; y: number },
  playType: PlayType
): Promise<GeneratedPlay> {
  const prompt = `You are a professional football offensive coordinator AI designing plays.

Ball starting position: (${ballPosition.x}, ${ballPosition.y})
Target endpoint: (${targetEndpoint.x}, ${targetEndpoint.y})
Play type: ${playType}
Field dimensions: 700x400 (width x height)
Line of Scrimmage: y=300

Design a complete ${playType} offensive play that gets the ball from the starting position to the target endpoint.

Requirements:
1. Position all 11 offensive players optimally for this play type
2. Create realistic routes that lead to the target endpoint
3. Design blocking assignments for linemen
4. The ball carrier's path should reach or pass through the target endpoint
5. Consider field spacing, timing, and defensive vulnerabilities

Return your response in this exact JSON format:
{
  "formation": "Formation name (e.g., I-Formation, Shotgun Spread)",
  "playerPositions": [
    {"id": "QB", "label": "QB", "x": 350, "y": 320},
    {"id": "RB", "label": "RB", "x": 350, "y": 340},
    {"id": "LT", "label": "LT", "x": 250, "y": 300},
    {"id": "LG", "label": "LG", "x": 290, "y": 300},
    {"id": "C", "label": "C", "x": 330, "y": 300},
    {"id": "RG", "label": "RG", "x": 370, "y": 300},
    {"id": "RT", "label": "RT", "x": 410, "y": 300},
    {"id": "TE", "label": "TE", "x": 450, "y": 280},
    {"id": "WR1", "label": "WR1", "x": 150, "y": 250},
    {"id": "WR2", "label": "WR2", "x": 550, "y": 250},
    {"id": "WR3", "label": "WR3", "x": 200, "y": 270}
  ],
  "routes": [
    {
      "id": "route-wr1",
      "playerId": "WR1",
      "points": [{"x": 150, "y": 250}, {"x": 150, "y": 100}, {"x": ${targetEndpoint.x}, "y": ${targetEndpoint.y}}],
      "color": "#FFD700"
    },
    {
      "id": "route-rb",
      "playerId": "RB",
      "points": [{"x": 350, "y": 340}, {"x": ${targetEndpoint.x}, "y": ${targetEndpoint.y}}],
      "color": "#FF6B6B"
    }
  ],
  "ballPath": [
    {"x": ${ballPosition.x}, "y": ${ballPosition.y}},
    {"x": ${targetEndpoint.x}, "y": ${targetEndpoint.y}}
  ],
  "explanation": "Detailed explanation of why this play design effectively reaches the target endpoint"
}

Ensure all positions are within field bounds (0-700 width, 0-400 height) and aligned to 20-pixel grid.
For ${playType === 'run' ? 'run plays, focus on blocking schemes and running lanes' : 'pass plays, ensure proper route combinations and timing'}.
The primary ball carrier or target receiver should have a route that reaches the endpoint.`;

  try {
    const response = await callAI(prompt);
    let cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON if there's text before or after it
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanedResponse);

    // Ensure all required fields are present
    if (!parsed.formation || !parsed.playerPositions || !parsed.routes || !parsed.ballPath || !parsed.explanation) {
      throw new Error('Invalid response structure from AI');
    }

    return parsed as GeneratedPlay;
  } catch (error) {
    console.error('Failed to generate play from endpoint:', error);
    throw new Error('Failed to generate play. Please try again.');
  }
}

/**
 * Challenge an offensive play with AI-generated defensive scheme (Red Team)
 */
export async function challengePlayWithRedTeam(
  offensivePlay: {
    playerPositions: PlayerPosition[];
    routes?: Route[];
  }
): Promise<DefensiveScheme> {
  const hasRoutes = offensivePlay.routes && offensivePlay.routes.length > 0;

  const prompt = `You are an elite defensive coordinator AI (Red Team) analyzing and countering offensive plays.

Offensive Formation:
${JSON.stringify(offensivePlay.playerPositions.map(p => ({
  id: p.id,
  label: p.label,
  x: p.x,
  y: p.y
})), null, 2)}

${hasRoutes ? `Offensive Routes:
${JSON.stringify(offensivePlay.routes?.map(r => ({
  playerId: r.playerId,
  points: r.points
})), null, 2)}` : 'No routes defined (likely a formation-only setup)'}

Your mission:
1. Identify the offensive play's primary intention and concepts
2. Design an optimal 11-player defensive scheme to counter it
3. Position each defender strategically with specific assignments
4. Create defensive movements/zones to disrupt the play
5. Identify exploitable weaknesses in the offensive design
6. Calculate success probability (0.0-1.0)

Return your defensive scheme as JSON:
{
  "formation": "Defensive formation (e.g., 4-3 Cover 2, Nickel Blitz, Dime Package)",
  "players": [
    {"id": "CB1", "label": "CB1", "x": 150, "y": 200, "assignment": "Cover WR1 man-to-man"},
    {"id": "CB2", "label": "CB2", "x": 550, "y": 200, "assignment": "Cover WR2 man-to-man"},
    {"id": "SS", "label": "SS", "x": 450, "y": 150, "assignment": "Deep half coverage"},
    {"id": "FS", "label": "FS", "x": 250, "y": 150, "assignment": "Deep half coverage"},
    {"id": "MLB", "label": "MLB", "x": 350, "y": 250, "assignment": "Spy QB, fill gaps"},
    {"id": "OLB1", "label": "OLB", "x": 200, "y": 270, "assignment": "Cover TE/RB"},
    {"id": "OLB2", "label": "OLB", "x": 500, "y": 270, "assignment": "Edge rush"},
    {"id": "DE1", "label": "DE", "x": 250, "y": 290, "assignment": "Contain edge"},
    {"id": "DE2", "label": "DE", "x": 450, "y": 290, "assignment": "Pass rush"},
    {"id": "DT1", "label": "DT", "x": 320, "y": 290, "assignment": "A-gap pressure"},
    {"id": "DT2", "label": "DT", "x": 380, "y": 290, "assignment": "B-gap control"}
  ],
  "routes": [
    {
      "id": "cb1-route",
      "playerId": "CB1",
      "points": [{"x": 150, "y": 200}, {"x": 150, "y": 100}],
      "color": "#DC2626"
    }
  ],
  "analysis": {
    "playRecognition": "This appears to be a [play type] targeting [area of field]",
    "weaknesses": [
      "Unbalanced formation leaves weak side vulnerable",
      "No check-down option for QB under pressure",
      "Predictable route combinations"
    ],
    "successProbability": 0.65,
    "recommendedOffensiveAdjustments": [
      "Add motion to identify coverage",
      "Include hot route for blitz pickup",
      "Adjust protection scheme"
    ]
  }
}

Position all defenders realistically (y < 300 for pre-snap alignment).
Ensure assignments are specific and tactically sound.`;

  try {
    const response = await callAI(prompt);

    // Clean JSON response - handle various AI formatting patterns
    let cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Extract JSON if there's text before or after it
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanedResponse);

    // Validate response structure
    if (!parsed.formation || !parsed.players || !parsed.analysis) {
      throw new Error('Invalid defensive scheme structure from AI');
    }

    // Ensure all defensive players have the required fields
    parsed.players = parsed.players.map((p: any) => ({
      ...p,
      color: p.color || '#DC2626' // Default red color for defensive players
    }));

    return parsed as DefensiveScheme;
  } catch (error) {
    console.error('Failed to generate defensive challenge:', error);
    throw new Error('Failed to generate defensive scheme. Please try again.');
  }
}

// Export current provider for display
export function getCurrentAIProvider(): AIProvider {
  return getAIConfig().provider;
}

// Export provider switch function
export function setAIProvider(provider: AIProvider): void {
  // This would typically update a global state or localStorage
  // For now, it's handled via environment variables
  console.log(`AI Provider would be set to: ${provider}`);
  console.log('Note: To actually change providers, update VITE_AI_PROVIDER in your .env.local file');
}