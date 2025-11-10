import { readFileSync, writeFileSync } from 'fs';

/**
 * Convert time-based playbook coordinates to slide-based app format
 *
 * Coordinate System Mapping:
 * Time-based: x = yards downfield (negative = behind LOS), y = yards left/right of center
 * App format: x = pixels left/right (340 = center), y = pixels (300 = LOS, smaller = forward)
 */

const FIELD_WIDTH = 700;
const FIELD_HEIGHT = 400;
const CENTER_X = 340;
const LOS_Y = 300;
const YARDS_PER_PIXEL = 6.67; // ~400px = 60 yards

// Convert yards to pixels
function yardsToPixels(yards) {
  return yards * YARDS_PER_PIXEL;
}

// Convert time-based coordinates to app pixel coordinates
function convertCoordinates(timePoint) {
  const { t, x, y } = timePoint;

  // x (downfield yards) -> app y (pixels, inverted: forward is smaller y)
  const appY = LOS_Y - yardsToPixels(x);

  // y (lateral yards) -> app x (pixels from center)
  const appX = CENTER_X + yardsToPixels(y);

  return { x: appX, y: appY, t };
}

// Sample a path at specific time to get position
function samplePathAtTime(path, targetTime) {
  if (!path || path.length === 0) return null;

  // Find the two points that bracket this time
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];

    if (targetTime >= p1.t && targetTime <= p2.t) {
      // Interpolate between p1 and p2
      const ratio = (targetTime - p1.t) / (p2.t - p1.t);
      return {
        t: targetTime,
        x: p1.x + (p2.x - p1.x) * ratio,
        y: p1.y + (p2.y - p1.y) * ratio
      };
    }
  }

  // If time is beyond last point, return last point
  if (targetTime >= path[path.length - 1].t) {
    return path[path.length - 1];
  }

  // If time is before first point, return first point
  return path[0];
}

// Convert routes to app format (remove time, just keep x,y)
function convertRoutePoints(timePath) {
  if (!timePath || timePath.length === 0) return [];

  return timePath.map(p => {
    const converted = convertCoordinates(p);
    return { x: converted.x, y: converted.y };
  });
}

// Map formation names to standard positions
function getFormationPositions(formationName) {
  const formation = formationName.toLowerCase();

  // Base offensive line (always same)
  const oLine = [
    { id: 'LT', label: 'LT', x: 260, y: 300 },
    { id: 'LG', label: 'LG', x: 300, y: 300 },
    { id: 'C',  label: 'C',  x: 340, y: 300 },
    { id: 'RG', label: 'RG', x: 380, y: 300 },
    { id: 'RT', label: 'RT', x: 420, y: 300 }
  ];

  // Default QB in shotgun
  const qb = { id: 'QB', label: 'QB', x: 360, y: 340 };

  // Formation-specific skill positions
  if (formation.includes('shotgun') && formation.includes('2x2')) {
    return [
      ...oLine,
      qb,
      { id: 'RB', label: 'RB', x: 400, y: 360 },
      { id: 'X',  label: 'X',  x: 220, y: 200 },
      { id: 'SL_X', label: 'SL', x: 260, y: 180 },
      { id: 'Y',  label: 'Y',  x: 420, y: 200 },
      { id: 'SL_Z', label: 'SL', x: 460, y: 180 }
    ];
  }

  if (formation.includes('trips')) {
    return [
      ...oLine,
      qb,
      { id: 'RB', label: 'RB', x: 400, y: 340 },
      { id: 'TE', label: 'TE', x: 460, y: 300 },
      { id: 'WR_X', label: 'X', x: 200, y: 200 },
      { id: 'WR_Z', label: 'Z', x: 540, y: 200 },
      { id: 'SL_Z', label: 'SL', x: 500, y: 220 }
    ];
  }

  if (formation.includes('singleback') || formation.includes('i-pro')) {
    return [
      ...oLine,
      { id: 'QB', label: 'QB', x: 360, y: 320 },
      { id: 'RB', label: 'RB', x: 360, y: 360 },
      { id: 'TE', label: 'TE', x: 460, y: 300 },
      { id: 'WR_X', label: 'X', x: 220, y: 200 },
      { id: 'WR_Z', label: 'Z', x: 500, y: 200 }
    ];
  }

  // Default formation
  return [
    ...oLine,
    qb,
    { id: 'RB', label: 'RB', x: 400, y: 340 },
    { id: 'X',  label: 'X',  x: 220, y: 200 },
    { id: 'Y',  label: 'Y',  x: 460, y: 200 },
    { id: 'Z',  label: 'Z',  x: 500, y: 180 }
  ];
}

// Convert a single play to app format
function convertPlay(timePlay, category) {
  const basePositions = getFormationPositions(timePlay.formation);

  // Create 5 slides
  const slides = [];
  const numSlides = 5;
  const maxTime = 2.5; // Sample over 2.5 seconds

  for (let i = 1; i <= numSlides; i++) {
    const slideTime = ((i - 1) / (numSlides - 1)) * maxTime;

    // Start with base positions
    let positions = JSON.parse(JSON.stringify(basePositions));

    // Update positions based on routes/paths at this time
    const routes = [];

    // Process QB path
    if (timePlay.qb && timePlay.qb.path) {
      const qbPos = samplePathAtTime(timePlay.qb.path, slideTime);
      if (qbPos) {
        const converted = convertCoordinates(qbPos);
        const qbIdx = positions.findIndex(p => p.id === 'QB');
        if (qbIdx >= 0) {
          positions[qbIdx].x = converted.x;
          positions[qbIdx].y = converted.y;
        }
      }
    }

    // Process run paths (RB, etc.)
    if (timePlay.run_paths) {
      Object.entries(timePlay.run_paths).forEach(([playerId, path]) => {
        const pos = samplePathAtTime(path, slideTime);
        if (pos) {
          const converted = convertCoordinates(pos);
          const playerIdx = positions.findIndex(p => p.id === playerId);
          if (playerIdx >= 0) {
            positions[playerIdx].x = converted.x;
            positions[playerIdx].y = converted.y;
          }

          // On first slide, add the full route
          if (i === 1) {
            routes.push({
              id: `${playerId.toLowerCase()}-route`,
              playerId: playerId,
              points: convertRoutePoints(path),
              color: '#10b981' // Green for run routes
            });
          }
        }
      });
    }

    // Process pass routes
    if (timePlay.routes) {
      Object.entries(timePlay.routes).forEach(([playerId, routePath]) => {
        const pos = samplePathAtTime(routePath, slideTime);
        if (pos) {
          const converted = convertCoordinates(pos);
          const playerIdx = positions.findIndex(p => p.id === playerId);
          if (playerIdx >= 0) {
            positions[playerIdx].x = converted.x;
            positions[playerIdx].y = converted.y;
          }

          // On first slide, add the full route
          if (i === 1) {
            routes.push({
              id: `${playerId.toLowerCase()}-route`,
              playerId: playerId,
              points: convertRoutePoints(routePath),
              color: '#3b82f6' // Blue for pass routes
            });
          }
        }
      });
    }

    slides.push({
      index: i,
      positions,
      routes: i === 1 ? routes : []
    });
  }

  // Determine formation type
  let formation = 'trips';
  if (timePlay.formation.toLowerCase().includes('2x2')) {
    formation = 'doubles';
  } else if (timePlay.formation.toLowerCase().includes('empty')) {
    formation = 'empty';
  }

  return {
    name: timePlay.name,
    formation: formation,
    notes: `${timePlay.learning_notes}\n\nConcept: ${timePlay.concept}\nFormation: ${timePlay.formation}\nCategory: ${category}`,
    slides
  };
}

// Main conversion function
function convertPlaybook(inputPath, outputPath) {
  console.log('📖 Reading playbook...');
  const data = JSON.parse(readFileSync(inputPath, 'utf-8'));

  const convertedPlays = [];

  // Process each category
  Object.entries(data.plays).forEach(([category, plays]) => {
    console.log(`\n📁 Converting ${category} plays...`);

    plays.forEach(play => {
      try {
        const converted = convertPlay(play, category);
        convertedPlays.push(converted);
        console.log(`  ✓ ${play.name}`);
      } catch (error) {
        console.error(`  ✗ Failed to convert ${play.name}:`, error.message);
      }
    });
  });

  // Write output
  const output = {
    metadata: {
      version: '2.0',
      format: 'slide-based',
      converted: new Date().toISOString(),
      original: data.metadata
    },
    plays: convertedPlays
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n✅ Converted ${convertedPlays.length} plays`);
  console.log(`📄 Output written to: ${outputPath}`);
}

// Run conversion
const inputFile = process.argv[2] || 'playbook.json';
const outputFile = process.argv[3] || 'playbook-converted.json';

try {
  convertPlaybook(inputFile, outputFile);
} catch (error) {
  console.error('❌ Conversion failed:', error.message);
  process.exit(1);
}
