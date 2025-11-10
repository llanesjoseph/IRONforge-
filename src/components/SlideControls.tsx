import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Arrow } from 'react-konva';
import { Slide } from '../types';
import { FIELD } from '../lib/formations';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SlideControlsProps {
  current: number;
  setSlide: (slide: number) => void;
  totalSlides: number;
  slides: Slide[];
  onAddSlide?: () => void;
  onDeleteSlide?: (index: number) => void;
  onReorderSlides?: (oldIndex: number, newIndex: number) => void;
  canEdit?: boolean;
}

export default function SlideControls({
  current,
  setSlide,
  totalSlides,
  slides,
  onAddSlide,
  onDeleteSlide,
  onReorderSlides,
  canEdit = false
}: SlideControlsProps) {
  const labels = ['Setup', 'Mid', 'Final', 'Extra 1', 'Extra 2', 'Extra 3', 'Extra 4', 'Extra 5', 'Extra 6', 'Extra 7'];
  const MAX_SLIDES = 10;

  const [isPlaying, setIsPlaying] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { width: fieldWidth, height: fieldHeight } = FIELD;
  const scale = 0.2; // Smaller scale for thumbnails
  const thumbWidth = fieldWidth * scale;
  const thumbHeight = fieldHeight * scale;

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorderSlides) {
      const oldIndex = parseInt(active.id as string);
      const newIndex = parseInt(over.id as string);
      onReorderSlides(oldIndex, newIndex);
    }
  };

  // Animation effect
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimationFrame((prev) => {
          const next = (prev + 1) % totalSlides;
          setSlide(next + 1); // Update the current slide
          return next;
        });
      }, 1000); // 1 second per slide
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
  }, [isPlaying, totalSlides, setSlide]);

  const handlePlayPause = () => {
    if (!isPlaying) {
      setAnimationFrame(current - 1);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setAnimationFrame(0);
    setSlide(1);
  };

  // Sortable thumbnail component
  const SortableThumbnail = ({ slide, index }: { slide: Slide; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: String(index), disabled: !canEdit });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const isActive = current === index + 1;

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`relative ${canEdit ? 'cursor-move' : 'cursor-pointer'} transition-all ${
          isActive ? 'ring-4 ring-blue-500 scale-105' : 'ring-2 ring-gray-300 hover:ring-blue-300'
        } rounded-lg overflow-hidden bg-gray-100`}
        onClick={(e) => {
          // Only change slide if not dragging
          if (!isDragging) {
            setIsPlaying(false);
            setSlide(index + 1);
          }
        }}
      >
        {/* Drag handle indicator */}
        {canEdit && (
          <div className="absolute top-1 right-1 z-10 bg-gray-700 bg-opacity-70 rounded px-1.5 py-0.5 text-white text-xs font-bold">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
            </svg>
          </div>
        )}

        <div className="relative">
          <Stage width={thumbWidth} height={thumbHeight}>
            <Layer>
              {/* Field background */}
              <Rect width={thumbWidth} height={thumbHeight} fill="#0f7d43" cornerRadius={4} />

              {/* Field border */}
              <Line
                points={[2, 2, thumbWidth - 2, 2, thumbWidth - 2, thumbHeight - 2, 2, thumbHeight - 2, 2, 2]}
                stroke="#ffffff"
                strokeWidth={1}
                listening={false}
              />

              {/* Line of scrimmage */}
              <Line
                points={[0, 300 * scale, thumbWidth, 300 * scale]}
                stroke="#ff0000"
                strokeWidth={1}
                opacity={0.6}
                listening={false}
              />

              {/* Players */}
              {slide.positions.map((player) => (
                <React.Fragment key={player.id}>
                  <Circle
                    x={player.x * scale}
                    y={player.y * scale}
                    radius={4}
                    fill="#3b82f6"
                    stroke="#1e40af"
                    strokeWidth={0.5}
                  />
                  <Text
                    x={(player.x * scale) - 6}
                    y={(player.y * scale) - 3}
                    text={player.label}
                    fontSize={5}
                    fontStyle="bold"
                    fill="#ffffff"
                    width={12}
                    align="center"
                  />
                </React.Fragment>
              ))}

              {/* Routes */}
              {slide.routes && slide.routes.map((route) => {
                if (route.points.length < 2) return null;

                // Draw route path
                const points = route.points.flatMap(p => [p.x * scale, p.y * scale]);
                return (
                  <React.Fragment key={route.id}>
                    <Line
                      points={points}
                      stroke={route.color || '#FF6B6B'}
                      strokeWidth={1.5}
                      tension={0.3}
                      listening={false}
                    />
                    {/* Arrow at the end */}
                    {route.points.length >= 2 && (
                      <Arrow
                        points={[
                          route.points[route.points.length - 2].x * scale,
                          route.points[route.points.length - 2].y * scale,
                          route.points[route.points.length - 1].x * scale,
                          route.points[route.points.length - 1].y * scale
                        ]}
                        stroke={route.color || '#FF6B6B'}
                        fill={route.color || '#FF6B6B'}
                        strokeWidth={1.5}
                        pointerLength={4}
                        pointerWidth={4}
                        listening={false}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </Layer>
          </Stage>

          {/* Slide label overlay */}
          <div className={`absolute bottom-0 left-0 right-0 px-2 py-1 text-center text-xs font-bold shadow-lg ${
            isActive ? 'bg-blue-600 text-white' : 'bg-gray-900 text-white'
          }`}>
            {index + 1}. {labels[index] || `Slide ${index + 1}`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      {/* Animation Controls */}
      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-2 items-center">
          <button
            onClick={handlePlayPause}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all flex items-center gap-2 font-bold shadow-lg"
          >
            {isPlaying ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play Animation
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            Reset
          </button>
          {isPlaying && (
            <span className="text-sm text-gray-600 font-medium">
              Playing slide {current}/{totalSlides}
            </span>
          )}
        </div>

        {/* Add/Delete Slide Controls */}
        {canEdit && (
          <div className="flex gap-2">
            {totalSlides < MAX_SLIDES && onAddSlide && (
              <button
                onClick={onAddSlide}
                className="px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                title="Add new slide"
              >
                + Add Slide
              </button>
            )}
            {totalSlides > 1 && onDeleteSlide && (
              <button
                onClick={() => onDeleteSlide(current)}
                className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                title="Delete current slide"
              >
                Delete Slide
              </button>
            )}
          </div>
        )}
      </div>

      {/* Slide Thumbnails */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={slides.map((_, index) => String(index))}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {slides.map((slide, index) => (
              <SortableThumbnail key={index} slide={slide} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
