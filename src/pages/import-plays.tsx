import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Slide, PlayerPosition, Route } from '../types';

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

type PlayTemplate = {
  name: string;
  formation: 'trips' | 'doubles' | 'empty';
  notes: string;
  getSlides: () => Slide[];
};

const playTemplates: PlayTemplate[] = [
  {
    name: "Inside Zone Right",
    formation: "trips",
    notes: "RB follows double team between RG and RT, cuts inside or bounces outside based on flow.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        {
          id: 'rb-route',
          playerId: 'RB',
          points: [{ x: 400, y: 340 }, { x: 400, y: 280 }, { x: 420, y: 240 }, { x: 440, y: 200 }],
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
    formation: "trips",
    notes: "Lead blocker pulls from left guard, RB follows through right B-gap.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        { id: 'rb-route', playerId: 'RB', points: [{ x: 400, y: 340 }, { x: 420, y: 280 }, { x: 440, y: 220 }], color: '#10b981' }
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
    formation: "doubles",
    notes: "RB fakes right, pulls left behind pulling guards. Misdirection run play.",
    getSlides: () => {
      const positions = doublesPositions();
      const routes: Route[] = [
        { id: 'rb-route', playerId: 'RB', points: [{ x: 360, y: 360 }, { x: 340, y: 320 }, { x: 280, y: 280 }, { x: 240, y: 220 }], color: '#10b981' }
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
    formation: "trips",
    notes: "Outside zone run. RB stretches to the sideline, cuts upfield at first opportunity.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        { id: 'rb-route', playerId: 'RB', points: [{ x: 400, y: 340 }, { x: 480, y: 300 }, { x: 520, y: 260 }, { x: 540, y: 200 }], color: '#10b981' }
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
    name: "Slants",
    formation: "trips",
    notes: "All receivers run quick slants. Beat man coverage, quick release.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        { id: 'x-route', playerId: 'X', points: [{ x: 200, y: 200 }, { x: 220, y: 180 }, { x: 260, y: 160 }], color: '#3b82f6' },
        { id: 'y-route', playerId: 'Y', points: [{ x: 500, y: 220 }, { x: 480, y: 200 }, { x: 440, y: 180 }], color: '#3b82f6' },
        { id: 'z-route', playerId: 'Z', points: [{ x: 540, y: 200 }, { x: 520, y: 180 }, { x: 480, y: 160 }], color: '#3b82f6' }
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
    formation: "doubles",
    notes: "Receivers run 5-yard out routes. Good against soft coverage.",
    getSlides: () => {
      const positions = doublesPositions();
      const routes: Route[] = [
        { id: 'x-route', playerId: 'X', points: [{ x: 220, y: 200 }, { x: 220, y: 160 }, { x: 180, y: 160 }], color: '#3b82f6' },
        { id: 'y-route', playerId: 'Y', points: [{ x: 460, y: 200 }, { x: 460, y: 160 }, { x: 500, y: 160 }], color: '#3b82f6' }
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
    formation: "trips",
    notes: "Y runs stick route at 5 yards, Z runs corner, X clears deep. Good vs zone.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        { id: 'y-route', playerId: 'Y', points: [{ x: 500, y: 220 }, { x: 500, y: 180 }, { x: 460, y: 180 }], color: '#3b82f6' },
        { id: 'z-route', playerId: 'Z', points: [{ x: 540, y: 200 }, { x: 540, y: 140 }, { x: 580, y: 100 }], color: '#3b82f6' },
        { id: 'x-route', playerId: 'X', points: [{ x: 200, y: 200 }, { x: 200, y: 100 }], color: '#3b82f6' }
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
    formation: "doubles",
    notes: "Crossing routes at different levels create natural picks. Excellent vs man.",
    getSlides: () => {
      const positions = doublesPositions();
      const routes: Route[] = [
        { id: 'x-route', playerId: 'X', points: [{ x: 220, y: 200 }, { x: 240, y: 180 }, { x: 360, y: 170 }, { x: 480, y: 170 }], color: '#3b82f6' },
        { id: 'y-route', playerId: 'Y', points: [{ x: 460, y: 200 }, { x: 440, y: 180 }, { x: 360, y: 170 }, { x: 240, y: 170 }], color: '#3b82f6' }
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
    name: "Four Verticals",
    formation: "empty",
    notes: "Four receivers run vertical routes. Stretches defense vertically, find the open window.",
    getSlides: () => {
      const positions = emptyPositions();
      const routes: Route[] = [
        { id: 'x-route', playerId: 'X', points: [{ x: 200, y: 200 }, { x: 200, y: 80 }], color: '#3b82f6' },
        { id: 'h-route', playerId: 'H', points: [{ x: 240, y: 180 }, { x: 240, y: 60 }], color: '#3b82f6' },
        { id: 'z-route', playerId: 'Z', points: [{ x: 460, y: 200 }, { x: 460, y: 80 }], color: '#3b82f6' },
        { id: 'w-route', playerId: 'W', points: [{ x: 420, y: 180 }, { x: 420, y: 60 }], color: '#3b82f6' }
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
    formation: "trips",
    notes: "Three-level route combination. High-low read vs zone coverage.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        { id: 'y-route', playerId: 'Y', points: [{ x: 500, y: 220 }, { x: 500, y: 80 }], color: '#3b82f6' },
        { id: 'z-route', playerId: 'Z', points: [{ x: 540, y: 200 }, { x: 540, y: 140 }, { x: 580, y: 100 }], color: '#3b82f6' },
        { id: 'te-route', playerId: 'TE', points: [{ x: 460, y: 300 }, { x: 480, y: 260 }, { x: 500, y: 240 }], color: '#3b82f6' }
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
    formation: "doubles",
    notes: "Both outside receivers run post routes. Attacks Cover 2 safeties.",
    getSlides: () => {
      const positions = doublesPositions();
      const routes: Route[] = [
        { id: 'x-route', playerId: 'X', points: [{ x: 220, y: 200 }, { x: 220, y: 140 }, { x: 280, y: 80 }, { x: 340, y: 60 }], color: '#3b82f6' },
        { id: 'y-route', playerId: 'Y', points: [{ x: 460, y: 200 }, { x: 460, y: 140 }, { x: 400, y: 80 }, { x: 360, y: 60 }], color: '#3b82f6' }
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
    formation: "trips",
    notes: "Outside receiver runs corner, inside runs post. Stretches coverage horizontally and vertically.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        { id: 'z-route', playerId: 'Z', points: [{ x: 540, y: 200 }, { x: 540, y: 140 }, { x: 580, y: 100 }, { x: 620, y: 80 }], color: '#3b82f6' },
        { id: 'y-route', playerId: 'Y', points: [{ x: 500, y: 220 }, { x: 500, y: 140 }, { x: 460, y: 80 }, { x: 420, y: 60 }], color: '#3b82f6' }
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
    name: "PA Boot Right",
    formation: "trips",
    notes: "Play action fake, QB rolls right. TE drag, RB outlet.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        { id: 'te-route', playerId: 'TE', points: [{ x: 460, y: 300 }, { x: 420, y: 260 }, { x: 360, y: 240 }], color: '#3b82f6' },
        { id: 'rb-route', playerId: 'RB', points: [{ x: 400, y: 340 }, { x: 440, y: 280 }, { x: 480, y: 240 }], color: '#3b82f6' },
        { id: 'z-route', playerId: 'Z', points: [{ x: 540, y: 200 }, { x: 540, y: 100 }], color: '#3b82f6' }
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
    formation: "doubles",
    notes: "Play action with QB rollout. Crossing route and flat route create high-low read.",
    getSlides: () => {
      const positions = doublesPositions();
      const routes: Route[] = [
        { id: 'h-route', playerId: 'H', points: [{ x: 220, y: 180 }, { x: 280, y: 200 }, { x: 340, y: 200 }, { x: 400, y: 200 }], color: '#3b82f6' },
        { id: 'rb-route', playerId: 'RB', points: [{ x: 360, y: 360 }, { x: 280, y: 280 }, { x: 240, y: 240 }], color: '#3b82f6' }
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
    name: "RB Screen Right",
    formation: "trips",
    notes: "Linemen release to second level, RB catches behind line and follows blockers.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        { id: 'rb-route', playerId: 'RB', points: [{ x: 400, y: 340 }, { x: 420, y: 320 }, { x: 460, y: 280 }, { x: 500, y: 240 }], color: '#10b981' }
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
    formation: "doubles",
    notes: "Quick throw to X receiver with blockers in front. Bubble concept.",
    getSlides: () => {
      const positions = doublesPositions();
      const routes: Route[] = [
        { id: 'x-route', playerId: 'X', points: [{ x: 220, y: 200 }, { x: 200, y: 220 }, { x: 180, y: 240 }], color: '#10b981' },
        { id: 'h-route', playerId: 'H', points: [{ x: 220, y: 180 }, { x: 200, y: 200 }, { x: 160, y: 220 }], color: '#3b82f6' }
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
    name: "Slant-Flat RPO",
    formation: "trips",
    notes: "Run-Pass Option. Read the flat defender - if crashes, throw slant. If sits, hand off.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        { id: 'rb-route', playerId: 'RB', points: [{ x: 400, y: 340 }, { x: 400, y: 280 }, { x: 420, y: 240 }], color: '#10b981' },
        { id: 'y-route', playerId: 'Y', points: [{ x: 500, y: 220 }, { x: 480, y: 200 }, { x: 440, y: 180 }], color: '#3b82f6' }
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
    formation: "empty",
    notes: "QB drops back as if passing, then runs up the middle. Catches defense in pass coverage.",
    getSlides: () => {
      const positions = emptyPositions();
      const routes: Route[] = [
        { id: 'qb-route', playerId: 'QB', points: [{ x: 360, y: 340 }, { x: 360, y: 300 }, { x: 360, y: 240 }, { x: 360, y: 180 }], color: '#10b981' }
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
    formation: "trips",
    notes: "Motion receiver takes handoff running full speed. Fast-hitting outside run.",
    getSlides: () => {
      const positions = tripsRightPositions();
      const routes: Route[] = [
        { id: 'z-route', playerId: 'Z', points: [{ x: 540, y: 200 }, { x: 400, y: 280 }, { x: 340, y: 300 }, { x: 280, y: 280 }, { x: 220, y: 240 }], color: '#10b981' }
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

export default function ImportPlays() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleImport = async () => {
    const user = auth.currentUser;
    if (!user) {
      addLog('❌ Error: You must be logged in to import plays');
      return;
    }

    setLoading(true);
    setProgress(0);
    setLogs([]);
    setComplete(false);

    addLog(`Starting import of ${playTemplates.length} official plays...`);
    addLog(`These plays will be shared with all team members.`);
    addLog('');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < playTemplates.length; i++) {
      const play = playTemplates[i];

      try {
        const slides = play.getSlides();

        const docRef = await addDoc(collection(db, 'plays'), {
          name: `[Official] ${play.name}`,
          teamId: 'team-1',
          createdBy: user.uid, // Created by you so you can manage them
          slides,
          formation: play.formation,
          notes: `${play.notes}\n\n📚 Official playbook template - shared with all team members.`,
          createdAt: serverTimestamp(),
        });

        addLog(`✓ Imported: ${play.name}`);
        successCount++;
      } catch (error: any) {
        addLog(`✗ Failed to import: ${play.name} - ${error.message}`);
        errorCount++;
      }

      setProgress(((i + 1) / playTemplates.length) * 100);
    }

    addLog('');
    addLog(`✅ Import complete!`);
    addLog(`Successfully imported: ${successCount} official plays`);
    if (errorCount > 0) {
      addLog(`Failed: ${errorCount} plays`);
    }
    addLog('');
    addLog('📚 All plays are now available to your entire team!');

    setLoading(false);
    setComplete(true);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">Import Official Plays</h1>
              <p className="text-iron-300">Import 20 common offensive plays to share with your entire team</p>
            </div>
            {!complete && (
              <button
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>

          {!loading && !complete && (
            <>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📚</span>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Official Team Playbook</h3>
                    <p className="text-sm text-iron-300">
                      These plays will be marked as "[Official]" and visible to all team members.
                      As the creator, you'll be able to edit or delete them.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-3">Plays to be imported:</h2>
                <div className="grid grid-cols-2 gap-2 text-sm text-iron-200">
                  {playTemplates.map((play, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{play.name}</span>
                      <span className="text-iron-400 text-xs">({play.formation})</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!complete ? (
            <button
              onClick={handleImport}
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed font-semibold mb-4"
            >
              {loading ? 'Importing...' : 'Import 20 Plays'}
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="w-full btn-primary py-3 font-semibold mb-4"
            >
              View Playbook
            </button>
          )}

          {loading && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-iron-300">Progress</span>
                <span className="text-sm text-purple-400">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-iron-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="bg-iron-900 rounded-lg p-4 font-mono text-xs max-h-96 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="text-iron-200 mb-1">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
