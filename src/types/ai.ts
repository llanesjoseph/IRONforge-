// AI-specific types for image analysis and draft editing

export type Perspective = {
  p: { x: number; y: number }[] // 4 points TL, TR, BR, BL in image space
}

export type DraftCalibration = {
  losY: number; // Line of scrimmage Y position in pixels
  yardScale: number; // Pixels per yard
  rotationDeg: number; // Field rotation in degrees
}

export type DraftToken = {
  id: string;
  role: 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'CB' | 'S' | 'LB' | 'DL';
  label: string;
  x: number;
  y: number;
  confidence?: number;
}

export type DraftRoute = {
  id: string;
  tokenId: string;
  type: 'route' | 'block' | 'motion';
  points: { x: number; y: number }[];
  yardage?: number;
  confidence?: number;
}

export type DraftDoc = {
  id: string;
  sourceImagePath?: string; // GCS path
  imageUrl?: string; // Public URL
  calibrated?: DraftCalibration;
  perspective?: Perspective;
  ai?: {
    formationGuess?: string;
    coverageGuess?: string;
    confidence?: number;
  };
  createdAt?: any;
  updatedAt?: any;
}
