import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line } from 'react-konva';
import { Slide } from '../types';
import { FIELD } from '../lib/formations';

interface PlayPreviewProps {
  slides: Slide[];
}

export default function PlayPreview({ slides }: PlayPreviewProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { width: fieldWidth, height: fieldHeight } = FIELD;
  const scale = 0.4; // Scale down for preview
  const width = fieldWidth * scale;
  const height = fieldHeight * scale;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % slides.length);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, slides.length]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentFrame(0);
  };

  const handleNextFrame = () => {
    setIsPlaying(false);
    setCurrentFrame((prev) => (prev + 1) % slides.length);
  };

  const handlePrevFrame = () => {
    setIsPlaying(false);
    setCurrentFrame((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlide = slides[currentFrame];
  const yardLines = Array.from({ length: 9 }).map((_, i) => (50 + i * 70) * scale);

  return (
    <div className="space-y-3">
      <div className="bg-gray-100 rounded-lg p-2 inline-block">
        <Stage width={width} height={height}>
          <Layer>
            <Rect width={width} height={height} fill="#2e7d32" cornerRadius={8} />
            {yardLines.map(x => (
              <Line
                key={x}
                points={[x, 10, x, height - 10]}
                stroke="#e5e7eb"
                dash={[3, 3]}
                strokeWidth={0.5}
                opacity={0.5}
              />
            ))}
            {currentSlide && currentSlide.positions.map((player) => (
              <React.Fragment key={player.id}>
                <Circle
                  x={player.x * scale}
                  y={player.y * scale}
                  radius={8}
                  fill="#ffffff"
                  stroke="#111827"
                  strokeWidth={1}
                />
                <Text
                  x={(player.x * scale) - 6}
                  y={(player.y * scale) - 4}
                  text={player.label}
                  fontSize={8}
                  fontStyle="bold"
                  fill="#111827"
                  width={12}
                  align="center"
                />
              </React.Fragment>
            ))}
          </Layer>
        </Stage>
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={handlePlayPause}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handlePrevFrame}
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
        >
          ← Prev
        </button>
        <button
          onClick={handleNextFrame}
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
        >
          Next →
        </button>
        <span className="text-sm text-gray-600 ml-2">
          Frame: {currentFrame + 1}/{slides.length}
        </span>
      </div>
    </div>
  );
}