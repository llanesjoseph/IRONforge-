import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Slide, PlayerPosition, Route } from '../src/types';

// Initialize Firebase (use your config)
const firebaseConfig = {
  // Add your Firebase config here or import from src/lib/firebase
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to create base formations
function tripsRightPositions(): PlayerPosition[] {
  return [
    { id: 'QB', label: 'QB', x: 360, y: 320 },
    { id: 'RB', label: 'RB', x: 400, y: 340 },
    { id: 'LT', label: 'LT', x: 260, y: 300 },
    { id: 'LG', label: 'LG', x: 300, y: 300 },
    { id: 'C',  label: 'C',  x: 340, y: 300 },
    { id: 'RG', label: 'RG', x: 380, y: 300 },
    { id: 'RT', label: 'RT', x: 420, y: 300 },
    { id: 'TE', label: 'TE', x: 460, y: 300 },
    { id: 'X',  label: 'X',  x: 200, y: 200 },
    { id: 'Y',  label: 'Y',  x: 500, y: 220 },
    { id: 'Z',  label: 'Z',  x: 540, y: 200 }
  ];
}

function doublesPositions(): PlayerPosition[] {
  return [
    { id: 'QB', label: 'QB', x: 360, y: 320 },
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
}

function emptyPositions(): PlayerPosition[] {
  return [
    { id: 'QB', label: 'QB', x: 360, y: 340 },
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
}

// Sample plays data
const plays = [
  // Run Plays
  {
    name: "Inside Zone Right",
    formation: "trips" as const,
    notes: "RB follows double team between RG and RT, cuts inside or bounces outside based on flow.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        {
          id: 'rb-route',
          playerId: 'RB',
          points: [
            { x: 400, y: 340 },
            { x: 400, y: 280 },
            { x: 420, y: 240 },
            { x: 440, y: 200 }
          ],
          color: '#10b981'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "Power Right",
    formation: "trips" as const,
    notes: "Lead blocker pulls from left guard, RB follows through right B-gap.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        {
          id: 'rb-route',
          playerId: 'RB',
          points: [
            { x: 400, y: 340 },
            { x: 420, y: 280 },
            { x: 440, y: 220 }
          ],
          color: '#10b981'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "Counter Left",
    formation: "doubles" as const,
    notes: "RB fakes right, pulls left behind pulling guards. Misdirection run play.",
    getSlides: () => {
      const positions = doublesPositions();
      const routes: Route[] = [
        {
          id: 'rb-route',
          playerId: 'RB',
          points: [
            { x: 360, y: 360 },
            { x: 340, y: 320 },
            { x: 280, y: 280 },
            { x: 240, y: 220 }
          ],
          color: '#10b981'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "Stretch Right",
    formation: "trips" as const,
    notes: "Outside zone run. RB stretches to the sideline, cuts upfield at first opportunity.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        {
          id: 'rb-route',
          playerId: 'RB',
          points: [
            { x: 400, y: 340 },
            { x: 480, y: 300 },
            { x: 520, y: 260 },
            { x: 540, y: 200 }
          ],
          color: '#10b981'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },

  // Pass Plays - Short
  {
    name: "Slants",
    formation: "trips" as const,
    notes: "All receivers run quick slants. Beat man coverage, quick release.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        {
          id: 'x-route',
          playerId: 'X',
          points: [
            { x: 200, y: 200 },
            { x: 220, y: 180 },
            { x: 260, y: 160 }
          ],
          color: '#3b82f6'
        },
        {
          id: 'y-route',
          playerId: 'Y',
          points: [
            { x: 500, y: 220 },
            { x: 480, y: 200 },
            { x: 440, y: 180 }
          ],
          color: '#3b82f6'
        },
        {
          id: 'z-route',
          playerId: 'Z',
          points: [
            { x: 540, y: 200 },
            { x: 520, y: 180 },
            { x: 480, y: 160 }
          ],
          color: '#3b82f6'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "Quick Outs",
    formation: "doubles" as const,
    notes: "Receivers run 5-yard out routes. Good against soft coverage.",
    getSlides: () => {
      const positions = doublesPositions();
      const routes: Route[] = [
        {
          id: 'x-route',
          playerId: 'X',
          points: [
            { x: 220, y: 200 },
            { x: 220, y: 160 },
            { x: 180, y: 160 }
          ],
          color: '#3b82f6'
        },
        {
          id: 'y-route',
          playerId: 'Y',
          points: [
            { x: 460, y: 200 },
            { x: 460, y: 160 },
            { x: 500, y: 160 }
          ],
          color: '#3b82f6'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "Stick Concept",
    formation: "trips" as const,
    notes: "Y runs stick route at 5 yards, Z runs corner, X clears deep. Good vs zone.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        {
          id: 'y-route',
          playerId: 'Y',
          points: [
            { x: 500, y: 220 },
            { x: 500, y: 180 },
            { x: 460, y: 180 }
          ],
          color: '#3b82f6'
        },
        {
          id: 'z-route',
          playerId: 'Z',
          points: [
            { x: 540, y: 200 },
            { x: 540, y: 140 },
            { x: 580, y: 100 }
          ],
          color: '#3b82f6'
        },
        {
          id: 'x-route',
          playerId: 'X',
          points: [
            { x: 200, y: 200 },
            { x: 200, y: 100 }
          ],
          color: '#3b82f6'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "Mesh Concept",
    formation: "doubles" as const,
    notes: "Crossing routes at different levels create natural picks. Excellent vs man.",
    getSlides: () => {
      const positions = doublesPositions();
      const routes: Route[] = [
        {
          id: 'x-route',
          playerId: 'X',
          points: [
            { x: 220, y: 200 },
            { x: 240, y: 180 },
            { x: 360, y: 170 },
            { x: 480, y: 170 }
          ],
          color: '#3b82f6'
        },
        {
          id: 'y-route',
          playerId: 'Y',
          points: [
            { x: 460, y: 200 },
            { x: 440, y: 180 },
            { x: 360, y: 170 },
            { x: 240, y: 170 }
          ],
          color: '#3b82f6'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },

  // Pass Plays - Deep
  {
    name: "Four Verticals",
    formation: "empty" as const,
    notes: "Four receivers run vertical routes. Stretches defense vertically, find the open window.",
    getSlides: () => {
      const positions = emptyPositions();
      const routes: Route[] = [
        {
          id: 'x-route',
          playerId: 'X',
          points: [{ x: 200, y: 200 }, { x: 200, y: 80 }],
          color: '#3b82f6'
        },
        {
          id: 'h-route',
          playerId: 'H',
          points: [{ x: 240, y: 180 }, { x: 240, y: 60 }],
          color: '#3b82f6'
        },
        {
          id: 'z-route',
          playerId: 'Z',
          points: [{ x: 460, y: 200 }, { x: 460, y: 80 }],
          color: '#3b82f6'
        },
        {
          id: 'w-route',
          playerId: 'W',
          points: [{ x: 420, y: 180 }, { x: 420, y: 60 }],
          color: '#3b82f6'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "Sail Concept",
    formation: "trips" as const,
    notes: "Three-level route combination. High-low read vs zone coverage.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        {
          id: 'y-route',
          playerId: 'Y',
          points: [{ x: 500, y: 220 }, { x: 500, y: 80 }],
          color: '#3b82f6'
        },
        {
          id: 'z-route',
          playerId: 'Z',
          points: [
            { x: 540, y: 200 },
            { x: 540, y: 140 },
            { x: 580, y: 100 }
          ],
          color: '#3b82f6'
        },
        {
          id: 'te-route',
          playerId: 'TE',
          points: [
            { x: 460, y: 300 },
            { x: 480, y: 260 },
            { x: 500, y: 240 }
          ],
          color: '#3b82f6'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "Double Posts",
    formation: "doubles" as const,
    notes: "Both outside receivers run post routes. Attacks Cover 2 safeties.",
    getSlides: () => {
      const positions = doublesPositions();
      const routes: Route[] = [
        {
          id: 'x-route',
          playerId: 'X',
          points: [
            { x: 220, y: 200 },
            { x: 220, y: 140 },
            { x: 280, y: 80 },
            { x: 340, y: 60 }
          ],
          color: '#3b82f6'
        },
        {
          id: 'y-route',
          playerId: 'Y',
          points: [
            { x: 460, y: 200 },
            { x: 460, y: 140 },
            { x: 400, y: 80 },
            { x: 360, y: 60 }
          ],
          color: '#3b82f6'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "Corner-Post",
    formation: "trips" as const,
    notes: "Outside receiver runs corner, inside runs post. Stretches coverage horizontally and vertically.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        {
          id: 'z-route',
          playerId: 'Z',
          points: [
            { x: 540, y: 200 },
            { x: 540, y: 140 },
            { x: 580, y: 100 },
            { x: 620, y: 80 }
          ],
          color: '#3b82f6'
        },
        {
          id: 'y-route',
          playerId: 'Y',
          points: [
            { x: 500, y: 220 },
            { x: 500, y: 140 },
            { x: 460, y: 80 },
            { x: 420, y: 60 }
          ],
          color: '#3b82f6'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },

  // Play Action
  {
    name: "PA Boot Right",
    formation: "trips" as const,
    notes: "Play action fake, QB rolls right. TE drag, RB outlet.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        {
          id: 'te-route',
          playerId: 'TE',
          points: [
            { x: 460, y: 300 },
            { x: 420, y: 260 },
            { x: 360, y: 240 }
          ],
          color: '#3b82f6'
        },
        {
          id: 'rb-route',
          playerId: 'RB',
          points: [
            { x: 400, y: 340 },
            { x: 440, y: 280 },
            { x: 480, y: 240 }
          ],
          color: '#3b82f6'
        },
        {
          id: 'z-route',
          playerId: 'Z',
          points: [
            { x: 540, y: 200 },
            { x: 540, y: 100 }
          ],
          color: '#3b82f6'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "PA Waggle",
    formation: "doubles" as const,
    notes: "Play action with QB rollout. Crossing route and flat route create high-low read.",
    getSlides: () => {
      const positions = doublesPositions();
      const routes: Route[] = [
        {
          id: 'h-route',
          playerId: 'H',
          points: [
            { x: 220, y: 180 },
            { x: 280, y: 200 },
            { x: 340, y: 200 },
            { x: 400, y: 200 }
          ],
          color: '#3b82f6'
        },
        {
          id: 'rb-route',
          playerId: 'RB',
          points: [
            { x: 360, y: 360 },
            { x: 280, y: 280 },
            { x: 240, y: 240 }
          ],
          color: '#3b82f6'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },

  // Screen Plays
  {
    name: "RB Screen Right",
    formation: "trips" as const,
    notes: "Linemen release to second level, RB catches behind line and follows blockers.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        {
          id: 'rb-route',
          playerId: 'RB',
          points: [
            { x: 400, y: 340 },
            { x: 420, y: 320 },
            { x: 460, y: 280 },
            { x: 500, y: 240 }
          ],
          color: '#10b981'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "WR Screen Left",
    formation: "doubles" as const,
    notes: "Quick throw to X receiver with blockers in front. Bubble concept.",
    getSlides: () => {
      const positions = doublesPositions();
      const routes: Route[] = [
        {
          id: 'x-route',
          playerId: 'X',
          points: [
            { x: 220, y: 200 },
            { x: 200, y: 220 },
            { x: 180, y: 240 }
          ],
          color: '#10b981'
        },
        {
          id: 'h-route',
          playerId: 'H',
          points: [
            { x: 220, y: 180 },
            { x: 200, y: 200 },
            { x: 160, y: 220 }
          ],
          color: '#3b82f6'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },

  // RPO / Trick Plays
  {
    name: "Slant-Flat RPO",
    formation: "trips" as const,
    notes: "Run-Pass Option. Read the flat defender - if crashes, throw slant. If sits, hand off.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        {
          id: 'rb-route',
          playerId: 'RB',
          points: [
            { x: 400, y: 340 },
            { x: 400, y: 280 },
            { x: 420, y: 240 }
          ],
          color: '#10b981'
        },
        {
          id: 'y-route',
          playerId: 'Y',
          points: [
            { x: 500, y: 220 },
            { x: 480, y: 200 },
            { x: 440, y: 180 }
          ],
          color: '#3b82f6'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "QB Draw",
    formation: "empty" as const,
    notes: "QB drops back as if passing, then runs up the middle. Catches defense in pass coverage.",
    getSlides: () => {
      const positions = emptyPositions();
      const routes: Route[] = [
        {
          id: 'qb-route',
          playerId: 'QB',
          points: [
            { x: 360, y: 340 },
            { x: 360, y: 300 },
            { x: 360, y: 240 },
            { x: 360, y: 180 }
          ],
          color: '#10b981'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  },
  {
    name: "Jet Sweep",
    formation: "trips" as const,
    notes: "Motion receiver takes handoff running full speed. Fast-hitting outside run.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        {
          id: 'z-route',
          playerId: 'Z',
          points: [
            { x: 540, y: 200 },
            { x: 400, y: 280 },
            { x: 340, y: 300 },
            { x: 280, y: 280 },
            { x: 220, y: 240 }
          ],
          color: '#10b981'
        }
      ];
      return [
        { index: 1, positions, routes },
        { index: 2, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 3, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 4, positions: JSON.parse(JSON.stringify(positions)), routes: [] },
        { index: 5, positions: JSON.parse(JSON.stringify(positions)), routes: [] }
      ];
    }
  }
];

async function importPlays() {
  console.log('Starting import of 20 plays...\n');

  for (const play of plays) {
    try {
      const slides = play.getSlides();

      const docRef = await addDoc(collection(db, 'plays'), {
        name: play.name,
        teamId: 'team-1',
        createdBy: 'system',
        slides,
        formation: play.formation,
        notes: play.notes,
        createdAt: serverTimestamp(),
      });

      console.log(`✓ Imported: ${play.name} (${docRef.id})`);
    } catch (error) {
      console.error(`✗ Failed to import: ${play.name}`, error);
    }
  }

  console.log('\n✅ Import complete!');
  process.exit(0);
}

importPlays();
