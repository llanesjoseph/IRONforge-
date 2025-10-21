export type PlayerPosition = {
  id: string;
  label: string;
  x: number;
  y: number;
}

export type RoutePoint = {
  x: number;
  y: number;
}

export type Route = {
  id: string;
  playerId: string;
  points: RoutePoint[];
  color?: string;
  yardage?: number; // Distance of the route in yards
}

export type Slide = {
  index: number; // Changed to support dynamic number of slides
  positions: PlayerPosition[];
  routes?: Route[]; // Routes for passing plays, etc.
  movementRoutes?: Route[]; // Routes showing movement from previous slide
}

export type Play = {
  id: string;
  teamId: string;
  name: string;
  createdBy: string;
  slides: Slide[];
  createdAt: any;
  formation?: 'trips' | 'doubles' | 'empty'; // Formation template used
  notes?: string; // Play notes/description
}

export type UserProfile = {
  uid: string;
  displayName?: string;
  email?: string;
  role: 'admin' | 'coach' | 'player';
  teamId?: string;
}

export type ScheduleEvent = {
  id?: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  teamId?: string;
  notes?: string;
  createdAt?: any;
}

// Ball and Endpoint markers for AI Play Generator
export type BallMarker = {
  x: number;
  y: number;
}

export type EndpointMarker = {
  x: number;
  y: number;
}

// Defensive players for Red Team Challenge
export type DefensivePlayer = {
  id: string;
  label: string;
  x: number;
  y: number;
  assignment: string;
  color?: string;
}

// Defensive scheme analysis
export type DefensiveScheme = {
  formation: string;
  players: DefensivePlayer[];
  routes: Route[];
  analysis: {
    playRecognition: string;
    weaknesses: string[];
    successProbability: number;
    recommendedOffensiveAdjustments?: string[];
  }
}

// AI Play Generation result
export type GeneratedPlay = {
  formation: string;
  playerPositions: PlayerPosition[];
  routes: Route[];
  ballPath: RoutePoint[];
  explanation: string;
}

// Play types for AI generation
export type PlayType = 'run' | 'short-pass' | 'deep-pass' | 'screen' | 'play-action';

// Team and Invite types
export type TeamMember = {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'coach' | 'player';
  joinedAt: any;
}

export type Team = {
  id: string;
  name: string;
  createdBy: string; // Admin UID
  members: { [uid: string]: TeamMember };
  createdAt: any;
}

export type Invite = {
  id: string;
  teamId: string;
  email: string;
  role: 'coach' | 'player';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitedBy: string;
  invitedByEmail: string;
  createdAt: any;
  expiresAt: any;
}