import { Slide, PlayerPosition } from '../types';

export const FIELD = { width: 700, height: 400 };
export const GRID_SIZE = 20; // Grid size in pixels for snap-to-grid feature

function clonePositions(arr: PlayerPosition[]): PlayerPosition[] {
  return JSON.parse(JSON.stringify(arr));
}

/**
 * Snap coordinates to the nearest grid point
 * @param x - X coordinate to snap
 * @param y - Y coordinate to snap
 * @param gridSize - Size of the grid in pixels (default: 20)
 * @returns Object with snapped x and y coordinates
 */
export function snapToGrid(x: number, y: number, gridSize: number = GRID_SIZE): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize
  };
}

/**
 * Snap players to the Line of Scrimmage (LOS)
 * Aligns offensive line to y=300 and QB behind them
 * @param positions - Array of player positions
 * @returns Array of player positions with adjusted y coordinates
 */
export function snapToLOS(positions: PlayerPosition[]): PlayerPosition[] {
  const LOS_Y = 300; // Line of scrimmage Y position
  const QB_OFFSET = 40; // QB distance behind LOS

  // Define offensive line positions
  const oLineIds = ['LT', 'LG', 'C', 'RG', 'RT', 'TE', 'TE2'];

  return positions.map(player => {
    // Check if player is offensive line
    if (oLineIds.includes(player.id)) {
      // Snap to grid after setting LOS position
      const snapped = snapToGrid(player.x, LOS_Y);
      return { ...player, y: snapped.y };
    }

    // Check if player is QB
    if (player.id === 'QB') {
      // Position QB behind the line
      const qbY = LOS_Y + QB_OFFSET;
      const snapped = snapToGrid(player.x, qbY);
      return { ...player, y: snapped.y };
    }

    // For all other players, maintain their current position but snap to grid
    const snapped = snapToGrid(player.x, player.y);
    return { ...player, x: snapped.x, y: snapped.y };
  });
}

export function tripsRightTemplate(): Slide[] {
  const base: PlayerPosition[] = [
    { id: 'QB', label: 'QB', x: 360, y: 320 }, // Aligned to grid (20px intervals)
    { id: 'RB', label: 'RB', x: 400, y: 340 },
    { id: 'LT', label: 'LT', x: 260, y: 300 },
    { id: 'LG', label: 'LG', x: 300, y: 300 },
    { id: 'C',  label: 'C',  x: 340, y: 300 },
    { id: 'RG', label: 'RG', x: 380, y: 300 },
    { id: 'RT', label: 'RT', x: 420, y: 300 },
    { id: 'X',  label: 'X',  x: 200, y: 200 },
    { id: 'Y',  label: 'Y',  x: 440, y: 220 },
    { id: 'Z',  label: 'Z',  x: 480, y: 200 }
  ];
  return [1, 2, 3].map(i => ({
    index: i,
    positions: clonePositions(base)
  }));
}

export function doublesTemplate(): Slide[] {
  const base: PlayerPosition[] = [
    { id: 'QB', label: 'QB', x: 360, y: 320 }, // Aligned to grid
    { id: 'RB', label: 'RB', x: 360, y: 360 },
    { id: 'LT', label: 'LT', x: 260, y: 300 },
    { id: 'LG', label: 'LG', x: 300, y: 300 },
    { id: 'C',  label: 'C',  x: 340, y: 300 },
    { id: 'RG', label: 'RG', x: 380, y: 300 },
    { id: 'RT', label: 'RT', x: 420, y: 300 },
    { id: 'X',  label: 'X',  x: 220, y: 200 },
    { id: 'H',  label: 'H',  x: 220, y: 180 },
    { id: 'Y',  label: 'Y',  x: 460, y: 200 },
    { id: 'Z',  label: 'Z',  x: 460, y: 180 }
  ];
  return [1, 2, 3].map(i => ({
    index: i,
    positions: clonePositions(base)
  }));
}

export function emptyTemplate(): Slide[] {
  const base: PlayerPosition[] = [
    { id: 'QB', label: 'QB', x: 360, y: 340 }, // Aligned to grid
    { id: 'LT', label: 'LT', x: 260, y: 300 },
    { id: 'LG', label: 'LG', x: 300, y: 300 },
    { id: 'C',  label: 'C',  x: 340, y: 300 },
    { id: 'RG', label: 'RG', x: 380, y: 300 },
    { id: 'RT', label: 'RT', x: 420, y: 300 },
    { id: 'X',  label: 'X',  x: 200, y: 200 },
    { id: 'H',  label: 'H',  x: 240, y: 180 },
    { id: 'Y',  label: 'Y',  x: 360, y: 180 },
    { id: 'Z',  label: 'Z',  x: 460, y: 200 },
    { id: 'W',  label: 'W',  x: 420, y: 180 }
  ];
  return [1, 2, 3].map(i => ({
    index: i,
    positions: clonePositions(base)
  }));
}