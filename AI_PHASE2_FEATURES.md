# AI Phase 2+ Features Documentation

## Overview
This document describes the advanced AI features added in Phase 2+, including perspective warp, yard snapping, yardage auto-calculation, and Vertex AI integration.

## New Features

### 1. Perspective Tool
**Component:** `src/components/ai/PerspectiveTool.tsx`

Allows users to define the 4 corners of the visible football field to establish perspective correction.

**Usage:**
- Click 4 points on the image in order: Top-Left → Top-Right → Bottom-Right → Bottom-Left
- The tool draws a purple outline showing the selected field boundaries
- Save the perspective to enable perspective-aware route drawing

**Benefits:**
- Corrects for camera angle and distortion
- Enables accurate coordinate mapping
- Improves AI recognition accuracy

### 2. Field Calibration
**Component:** `src/components/ai/CalibrationOverlay.tsx`

Calibrates the field dimensions for accurate yardage calculations.

**Parameters:**
- **LOS Y Position**: Line of scrimmage Y coordinate in pixels
- **Pixels per Yard**: Scale factor for yard measurements
- **Rotation**: Field rotation angle in degrees (-45° to 45°)

**Features:**
- Visual overlay showing LOS line with rotation
- Real-time preview of calibration settings
- Persistent calibration saved to Firestore

### 3. Yard Snapping Grid
**Component:** `src/components/ai/YardSnapGrid.tsx`

Displays current calibration settings and enables intelligent yard snapping.

**Display:**
- Yard scale (px/yd)
- Line of scrimmage position
- Rotation angle

**Integration:**
- Used by RouteTool for automatic yard snapping
- Ensures routes align to field yard markers

### 4. Enhanced Route Tool with Yard Snapping
**Component:** `src/components/ai/RouteTool.tsx`

Advanced route drawing with automatic yard snapping and yardage calculation.

**Features:**
- **Route Types**: Route, Block, Motion
- **Yard Snapping**: Automatically snaps route points to nearest yard line
- **Yardage Calculation**: Computes route depth in yards
- **Rotation Aware**: Accounts for field rotation in calculations

**Algorithm:**
1. Click points are captured in screen coordinates
2. Points are un-rotated to field coordinate system
3. Y-coordinates are snapped to nearest yard
4. Points are rotated back to match field orientation
5. Route yardage is calculated along the field Y-axis

### 5. Token Palette
**Component:** `src/components/ai/TokenPalette.tsx`

Quick token creation interface for adding players to the draft.

**Roles:**
- Offense: QB, RB, WR, TE, OL
- Defense: CB, S, LB, DL

**Usage:**
1. Select role from dropdown
2. Enter custom label (e.g., "WR1", "CB2")
3. Click Add to create token at default position
4. Drag tokens on canvas to correct positions

### 6. Overlay Canvas with Perspective Rendering
**Component:** `src/components/ai/OverlayCanvas.tsx`

Advanced canvas rendering with multiple overlay layers.

**Layers:**
1. **Base Image**: Original uploaded photo/screenshot
2. **Perspective Outline**: Purple quadrilateral showing field boundaries
3. **Heatmap**: Optional confidence visualization for AI-detected tokens
4. **Routes**: Line drawings with type-specific styling
   - Routes: Blue solid lines
   - Blocks: Gray dashed lines
   - Motion: Orange solid lines
5. **Tokens**: Draggable player position markers

**Heatmap Colors:**
- Green: High confidence (>70%)
- Orange: Medium confidence (40-70%)
- Red: Low confidence (<40%)

### 7. Draft Editor Page
**Page:** `src/pages/ai/draft/[id].tsx`

Main editing interface for AI-assisted play drafts.

**Workflow:**
1. Upload image via `/ai/new`
2. Set perspective corners (optional)
3. Calibrate field dimensions
4. Run AI Assist to auto-detect positions and routes
5. Manually add/edit tokens and routes
6. Convert to full play when complete

**Features:**
- Real-time Firestore sync for tokens, routes, and draft metadata
- AI analysis status and confidence display
- Coverage detection display
- History tracking for all actions

### 8. Bulk Import
**Page:** `src/pages/ai/bulk-import.tsx`

Batch upload multiple play diagrams for analysis.

**Features:**
- Multi-file upload
- Progress indicator
- Firebase Storage integration
- Batch Firestore document creation

**Use Cases:**
- Import entire playbook at once
- Process game film screenshots
- Migrate from image-based playbooks

## New Types

### Perspective
```typescript
export type Perspective = {
  p: { x: number; y: number }[] // 4 points TL, TR, BR, BL
}
```

### DraftCalibration
```typescript
export type DraftCalibration = {
  losY: number;        // Line of scrimmage Y position
  yardScale: number;   // Pixels per yard
  rotationDeg: number; // Field rotation
}
```

### DraftToken
```typescript
export type DraftToken = {
  id: string;
  role: 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'CB' | 'S' | 'LB' | 'DL';
  label: string;
  x: number;
  y: number;
  confidence?: number;
}
```

### DraftRoute
```typescript
export type DraftRoute = {
  id: string;
  tokenId: string;
  type: 'route' | 'block' | 'motion';
  points: { x: number; y: number }[];
  yardage?: number;     // Calculated route depth
  confidence?: number;
}
```

## Vertex AI Integration

### Server Setup

**Location:** `server/`

**Files:**
- `main.py`: FastAPI server with Vertex AI stub
- `requirements.txt`: Python dependencies
- `Dockerfile`: Container configuration for Cloud Run
- `README.md`: Deployment instructions

**Endpoint:** `POST /api/analyze-image`

**Request:**
```json
{
  "gcsPath": "gs://bucket/image.png",
  "calibrated": {
    "losY": 300,
    "yardScale": 15.5,
    "rotationDeg": 2.3
  },
  "perspective": {
    "p": [
      {"x": 10, "y": 10},
      {"x": 790, "y": 10},
      {"x": 790, "y": 440},
      {"x": 10, "y": 440}
    ]
  }
}
```

**Response:**
```json
{
  "formationGuess": "Trips Right",
  "coverageGuess": "Cover 3",
  "confidence": 0.77,
  "tokens": [...],
  "routes": [...]
}
```

### Enabling Real AI

Currently the server returns stub data. To enable real Vertex AI:

1. Uncomment the Vertex AI code in `server/main.py`
2. Set `GOOGLE_CLOUD_PROJECT` environment variable
3. Configure service account with Vertex AI permissions
4. Deploy to Cloud Run
5. Update frontend to call Cloud Run URL

## Routes

New routes added to `App.tsx`:

- `/ai/new` - Upload new draft
- `/ai/draft/:id` - Edit draft
- `/ai/bulk` - Bulk import

## Firestore Collections

### play_drafts
```
play_drafts/{draftId}
  - sourceImagePath: string (GCS path)
  - imageUrl: string (public URL)
  - calibrated: DraftCalibration
  - perspective: Perspective
  - ai: {
      formationGuess: string
      coverageGuess: string
      confidence: number
    }
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Subcollections

**tokens:**
```
play_drafts/{draftId}/tokens/{tokenId}
  - role: string
  - label: string
  - x: number
  - y: number
  - confidence: number
```

**routes:**
```
play_drafts/{draftId}/routes/{routeId}
  - tokenId: string
  - type: 'route' | 'block' | 'motion'
  - points: Point[]
  - yardage: number
  - confidence: number
```

**history:**
```
play_drafts/{draftId}/history/{entryId}
  - ts: timestamp
  - action: string
  - value: any
```

## Security Rules

Add to `firestore.rules`:

```javascript
match /play_drafts/{draftId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() &&
    request.resource.data.createdBy == request.auth.uid;
  allow update: if isAuthenticated() &&
    resource.data.createdBy == request.auth.uid;
  allow delete: if isAuthenticated() &&
    resource.data.createdBy == request.auth.uid;

  match /tokens/{tokenId} {
    allow read, write: if isAuthenticated();
  }

  match /routes/{routeId} {
    allow read, write: if isAuthenticated();
  }

  match /history/{entryId} {
    allow read: if isAuthenticated();
    allow write: if isAuthenticated();
  }
}
```

## Dependencies Added

- `use-image`: For loading images in Konva canvas

## Future Enhancements

1. **Multi-frame Analysis**: Detect motion across video frames
2. **Formation Recognition**: Train custom ML model for formation detection
3. **Player Tracking**: Track player movement across frames
4. **Automatic Play Naming**: AI-generated play names based on concepts
5. **3D Visualization**: Perspective-corrected 3D field view
6. **Export to Video**: Animate plays with proper timing

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy
firebase deploy
```

## Testing Checklist

- [ ] Upload image to create new draft
- [ ] Set perspective corners
- [ ] Calibrate field dimensions
- [ ] Add tokens manually
- [ ] Draw routes with yard snapping
- [ ] Toggle heatmap visualization
- [ ] Run AI Assist (stub data)
- [ ] Convert draft to play
- [ ] Bulk import multiple images
- [ ] Verify Firestore security rules
