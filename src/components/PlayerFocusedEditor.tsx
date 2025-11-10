import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Arrow, Group } from 'react-konva';
import { Play, PlayerPosition, Slide, Route } from '../types';
import { FIELD, snapToGrid, snapToLOS } from '../lib/formations';
import Konva from 'konva';

interface PlayerFocusedEditorProps {
  play: Play;
  onUpdate: (updatedSlides: Slide[]) => void;
  canEdit: boolean;
  showGrid?: boolean;
  enableSnapping?: boolean;
}

export default function PlayerFocusedEditor({
  play,
  onUpdate,
  canEdit,
  showGrid = true,
  enableSnapping = true
}: PlayerFocusedEditorProps) {
  // Get all unique player IDs from the first slide
  const allPlayers = play.slides[0]?.positions || [];
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(allPlayers[0]?.id || '');
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [routeColor, setRouteColor] = useState('#FF6B6B');
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [linkedPlayerIds, setLinkedPlayerIds] = useState<Set<string>>(new Set());
  const stageRef = useRef<Konva.Stage>(null);

  // Get all positions for the selected player across all slides
  const selectedPlayerPositions = play.slides.map((slide, slideIndex) => {
    const pos = slide.positions.find(p => p.id === selectedPlayerId);
    return pos ? { ...pos, slideIndex: slideIndex + 1 } : null;
  }).filter(Boolean) as (PlayerPosition & { slideIndex: number })[];

  // Get the selected player info
  const selectedPlayer = allPlayers.find(p => p.id === selectedPlayerId);

  // Handle position update
  const handlePositionDragEnd = (slideIndex: number, newX: number, newY: number, draggedPlayerId?: string) => {
    if (!canEdit) return;

    const snapped = enableSnapping ? snapToGrid(newX, newY) : { x: newX, y: newY };
    const finalX = snapped.x;
    const finalY = snapped.y;

    // If we have linked players and the dragged player is linked, move all linked players
    if (linkedPlayerIds.size > 0 && draggedPlayerId && linkedPlayerIds.has(draggedPlayerId)) {
      const targetSlide = play.slides.find((s, idx) => idx + 1 === slideIndex);
      if (!targetSlide) return;

      const draggedPos = targetSlide.positions.find(p => p.id === draggedPlayerId);
      if (!draggedPos) return;

      // Calculate delta
      const deltaX = finalX - draggedPos.x;
      const deltaY = finalY - draggedPos.y;

      // Move all linked players by the same delta
      const updatedSlides = play.slides.map((slide, idx) => {
        if (idx + 1 === slideIndex) {
          return {
            ...slide,
            positions: slide.positions.map(pos => {
              if (linkedPlayerIds.has(pos.id)) {
                const newPosSnapped = enableSnapping
                  ? snapToGrid(pos.x + deltaX, pos.y + deltaY)
                  : { x: pos.x + deltaX, y: pos.y + deltaY };
                return { ...pos, x: newPosSnapped.x, y: newPosSnapped.y };
              }
              return pos;
            })
          };
        }
        return slide;
      });

      onUpdate(updatedSlides);
    } else {
      // Normal single player movement
      const updatedSlides = play.slides.map((slide, idx) => {
        if (idx + 1 === slideIndex) {
          return {
            ...slide,
            positions: slide.positions.map(pos =>
              pos.id === (draggedPlayerId || selectedPlayerId)
                ? { ...pos, x: finalX, y: finalY }
                : pos
            )
          };
        }
        return slide;
      });

      onUpdate(updatedSlides);
    }
  };

  // Handle canvas click to place player in next empty slide
  const handleCanvasClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!canEdit || isDrawingRoute) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Check if we clicked on an existing position
    const clickedOnPlayer = selectedPlayerPositions.some(pos => {
      const dx = pos.x - pointerPos.x;
      const dy = pos.y - pointerPos.y;
      return Math.sqrt(dx * dx + dy * dy) < 20; // 20px radius
    });

    if (clickedOnPlayer) return; // Don't place new position if clicking existing one

    const snapped = enableSnapping ? snapToGrid(pointerPos.x, pointerPos.y) : { x: pointerPos.x, y: pointerPos.y };
    const finalX = snapped.x;
    const finalY = snapped.y;

    // Find first slide where player doesn't have a position yet
    // Or update the last slide if all are filled
    const targetSlideIndex = selectedPlayerPositions.length < play.slides.length
      ? selectedPlayerPositions.length
      : play.slides.length - 1;

    const updatedSlides = play.slides.map((slide, idx) => {
      if (idx === targetSlideIndex) {
        return {
          ...slide,
          positions: slide.positions.map(pos =>
            pos.id === selectedPlayerId
              ? { ...pos, x: finalX, y: finalY }
              : pos
          )
        };
      }
      return slide;
    });

    onUpdate(updatedSlides);
  };

  // Route drawing handlers
  const handleCanvasMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!canEdit || !isDrawingRoute) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const snapped = enableSnapping ? snapToGrid(pos.x, pos.y) : { x: pos.x, y: pos.y };
    const finalX = snapped.x;
    const finalY = snapped.y;

    const newRoute: Route = {
      id: Date.now().toString(),
      playerId: selectedPlayerId,
      points: [{ x: finalX, y: finalY }],
      color: routeColor
    };

    setCurrentRoute(newRoute);
  };

  const handleCanvasMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!canEdit || !isDrawingRoute || !currentRoute) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const snapped = enableSnapping ? snapToGrid(pos.x, pos.y) : { x: pos.x, y: pos.y };
    const finalX = snapped.x;
    const finalY = snapped.y;

    setCurrentRoute({
      ...currentRoute,
      points: [...currentRoute.points, { x: finalX, y: finalY }]
    });
  };

  const handleCanvasMouseUp = () => {
    if (!canEdit || !currentRoute) return;

    // Add route to all slides for this player
    const updatedSlides = play.slides.map(slide => ({
      ...slide,
      routes: [...(slide.routes || []), currentRoute]
    }));

    onUpdate(updatedSlides);
    setCurrentRoute(null);
    setIsDrawingRoute(false);
  };

  const handleDeleteRoute = (routeId: string) => {
    const updatedSlides = play.slides.map(slide => ({
      ...slide,
      routes: (slide.routes || []).filter(r => r.id !== routeId)
    }));
    onUpdate(updatedSlides);
  };

  // Get routes for selected player from first slide (they're the same across all slides)
  const playerRoutes = play.slides[0]?.routes?.filter(r => r.playerId === selectedPlayerId) || [];

  return (
    <div className="flex flex-col h-full">
      {/* Player Selector */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">Edit Player Movement</h3>
          <div className="text-sm text-gray-600">
            {selectedPlayer?.label} - {selectedPlayerPositions.length}/{play.slides.length} positions
          </div>
        </div>

        {/* Link Mode Toggle */}
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={() => {
              setIsLinkMode(!isLinkMode);
              if (isLinkMode) {
                setLinkedPlayerIds(new Set()); // Clear links when exiting link mode
              }
            }}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2
              ${isLinkMode
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {isLinkMode ? 'Link Mode ON' : 'Link Players'}
          </button>
          {isLinkMode && (
            <span className="text-sm text-gray-600">
              Click players to link them together ({linkedPlayerIds.size} linked)
            </span>
          )}
        </div>

        {/* Horizontal scrollable player tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {allPlayers.map((player) => {
            const playerPositionsCount = play.slides.filter(slide =>
              slide.positions.find(p => p.id === player.id)?.x !== undefined
            ).length;
            const isComplete = playerPositionsCount === play.slides.length;
            const isSelected = player.id === selectedPlayerId;
            const isLinked = linkedPlayerIds.has(player.id);

            return (
              <button
                key={player.id}
                onClick={() => {
                  if (isLinkMode) {
                    // Toggle linked status
                    const newLinked = new Set(linkedPlayerIds);
                    if (newLinked.has(player.id)) {
                      newLinked.delete(player.id);
                    } else {
                      newLinked.add(player.id);
                    }
                    setLinkedPlayerIds(newLinked);
                  } else {
                    setSelectedPlayerId(player.id);
                  }
                }}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                  ${isSelected && !isLinkMode
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : isLinked && isLinkMode
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  {isLinked && isLinkMode && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  )}
                  <span>{player.label}</span>
                  {isComplete && (
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      {canEdit && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-blue-800">
              {selectedPlayerPositions.length < play.slides.length ? (
                <>
                  <strong>Tap canvas</strong> to place {selectedPlayer?.label}'s <strong className="text-blue-900">Slide {selectedPlayerPositions.length + 1}</strong> position •
                  <strong> Drag</strong> existing positions to adjust
                </>
              ) : (
                <>
                  <strong>All positions placed!</strong> •
                  <strong> Drag</strong> to adjust •
                  <strong> Draw route</strong> to add path
                </>
              )}
            </p>
            {selectedPlayerPositions.length < play.slides.length && (
              <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
                Placing: Slide {selectedPlayerPositions.length + 1}/{play.slides.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gray-900 p-4">
        <Stage
          ref={stageRef}
          width={FIELD.width}
          height={FIELD.height}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onTouchStart={handleCanvasMouseDown}
          onTouchMove={handleCanvasMouseMove}
          onTouchEnd={handleCanvasMouseUp}
          className="shadow-2xl"
        >
          <Layer>
            {/* Field background */}
            <Rect width={FIELD.width} height={FIELD.height} fill="#0f7d43" />

            {/* Grid */}
            {showGrid && (
              <>
                {Array.from({ length: 21 }, (_, i) => (
                  <Line
                    key={`h-${i}`}
                    points={[0, i * 30, FIELD.width, i * 30]}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    opacity={0.2}
                    listening={false}
                  />
                ))}
                {Array.from({ length: 11 }, (_, i) => (
                  <Line
                    key={`v-${i}`}
                    points={[i * 60, 0, i * 60, FIELD.height]}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    opacity={0.2}
                    listening={false}
                  />
                ))}
              </>
            )}

            {/* Line of scrimmage */}
            <Line
              points={[0, 300, FIELD.width, 300]}
              stroke="#ff0000"
              strokeWidth={3}
              opacity={0.6}
              listening={false}
            />

            {/* Linked players - show all positions for linked players */}
            {linkedPlayerIds.size > 0 && Array.from(linkedPlayerIds).map(playerId => {
              if (playerId === selectedPlayerId) return null; // Skip selected player

              const linkedPlayerPositions = play.slides.map((slide, slideIndex) => {
                const pos = slide.positions.find(p => p.id === playerId);
                return pos ? { ...pos, slideIndex: slideIndex + 1 } : null;
              }).filter(Boolean) as (PlayerPosition & { slideIndex: number })[];

              return linkedPlayerPositions.map((pos, index) => (
                <Group key={`linked-${pos.id}-${pos.slideIndex}`}>
                  {/* Connecting line to previous position */}
                  {index > 0 && (
                    <Line
                      points={[
                        linkedPlayerPositions[index - 1].x,
                        linkedPlayerPositions[index - 1].y,
                        pos.x,
                        pos.y
                      ]}
                      stroke="#a855f7"
                      strokeWidth={2}
                      dash={[5, 5]}
                      opacity={0.6}
                      listening={false}
                    />
                  )}

                  {/* Position circle */}
                  <Circle
                    x={pos.x}
                    y={pos.y}
                    radius={16}
                    fill="#9333ea"
                    stroke="#7e22ce"
                    strokeWidth={3}
                    draggable={canEdit}
                    onDragEnd={(e) => {
                      handlePositionDragEnd(pos.slideIndex, e.target.x(), e.target.y(), pos.id);
                    }}
                    shadowColor="purple"
                    shadowBlur={5}
                    shadowOpacity={0.4}
                  />

                  {/* Player label */}
                  <Text
                    x={pos.x - 20}
                    y={pos.y - 8}
                    text={pos.label}
                    fontSize={11}
                    fontStyle="bold"
                    fill="#ffffff"
                    width={40}
                    align="center"
                    listening={false}
                  />

                  {/* Slide number badge */}
                  <Circle
                    x={pos.x + 13}
                    y={pos.y - 13}
                    radius={8}
                    fill="#a855f7"
                    stroke="#ffffff"
                    strokeWidth={2}
                    listening={false}
                  />
                  <Text
                    x={pos.x + 13 - 8}
                    y={pos.y - 13 - 5}
                    text={pos.slideIndex.toString()}
                    fontSize={9}
                    fontStyle="bold"
                    fill="#ffffff"
                    width={16}
                    align="center"
                    listening={false}
                  />
                </Group>
              ));
            })}

            {/* Ghost players (all other players at their first slide position) */}
            {play.slides[0]?.positions
              .filter(p => p.id !== selectedPlayerId && !linkedPlayerIds.has(p.id))
              .map((player) => (
                <Group key={player.id}>
                  <Circle
                    x={player.x}
                    y={player.y}
                    radius={15}
                    fill="#3b82f6"
                    opacity={0.3}
                    listening={false}
                  />
                  <Text
                    x={player.x - 20}
                    y={player.y - 8}
                    text={player.label}
                    fontSize={12}
                    fontStyle="bold"
                    fill="#ffffff"
                    opacity={0.4}
                    width={40}
                    align="center"
                    listening={false}
                  />
                </Group>
              ))}

            {/* Selected player positions across all slides */}
            {selectedPlayerPositions.map((pos, index) => (
              <Group key={`${pos.id}-${pos.slideIndex}`}>
                {/* Connecting line to previous position */}
                {index > 0 && (
                  <Line
                    points={[
                      selectedPlayerPositions[index - 1].x,
                      selectedPlayerPositions[index - 1].y,
                      pos.x,
                      pos.y
                    ]}
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dash={[5, 5]}
                    opacity={0.6}
                    listening={false}
                  />
                )}

                {/* Position circle */}
                <Circle
                  x={pos.x}
                  y={pos.y}
                  radius={18}
                  fill="#3b82f6"
                  stroke="#1e40af"
                  strokeWidth={3}
                  draggable={canEdit}
                  onDragEnd={(e) => {
                    handlePositionDragEnd(pos.slideIndex, e.target.x(), e.target.y(), pos.id);
                  }}
                  shadowColor="black"
                  shadowBlur={5}
                  shadowOpacity={0.3}
                />

                {/* Player label */}
                <Text
                  x={pos.x - 20}
                  y={pos.y - 8}
                  text={pos.label}
                  fontSize={12}
                  fontStyle="bold"
                  fill="#ffffff"
                  width={40}
                  align="center"
                  listening={false}
                />

                {/* Slide number badge */}
                <Circle
                  x={pos.x + 15}
                  y={pos.y - 15}
                  radius={10}
                  fill="#fbbf24"
                  stroke="#ffffff"
                  strokeWidth={2}
                  listening={false}
                />
                <Text
                  x={pos.x + 15 - 10}
                  y={pos.y - 15 - 6}
                  text={pos.slideIndex.toString()}
                  fontSize={10}
                  fontStyle="bold"
                  fill="#000000"
                  width={20}
                  align="center"
                  listening={false}
                />
              </Group>
            ))}

            {/* Player routes */}
            {playerRoutes.map((route) => {
              if (route.points.length < 2) return null;
              const points = route.points.flatMap(p => [p.x, p.y]);

              return (
                <Group key={route.id}>
                  <Line
                    points={points}
                    stroke={route.color || '#FF6B6B'}
                    strokeWidth={3}
                    tension={0.3}
                    listening={false}
                  />
                  <Arrow
                    points={[
                      route.points[route.points.length - 2].x,
                      route.points[route.points.length - 2].y,
                      route.points[route.points.length - 1].x,
                      route.points[route.points.length - 1].y
                    ]}
                    stroke={route.color || '#FF6B6B'}
                    fill={route.color || '#FF6B6B'}
                    strokeWidth={3}
                    pointerLength={10}
                    pointerWidth={10}
                    listening={false}
                  />
                </Group>
              );
            })}

            {/* Current route being drawn */}
            {currentRoute && currentRoute.points.length > 0 && (
              <Line
                points={currentRoute.points.flatMap(p => [p.x, p.y])}
                stroke={currentRoute.color}
                strokeWidth={3}
                tension={0.3}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Bottom toolbar */}
      {canEdit && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Route drawing toggle */}
            <button
              onClick={() => setIsDrawingRoute(!isDrawingRoute)}
              className={`
                px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2
                ${isDrawingRoute
                  ? 'bg-green-600 text-white ring-2 ring-green-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {isDrawingRoute ? 'Drawing Route...' : 'Draw Route'}
            </button>

            {/* Color picker */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Color:</label>
              <input
                type="color"
                value={routeColor}
                onChange={(e) => setRouteColor(e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
            </div>

            {/* Delete routes */}
            {playerRoutes.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(`Delete all routes for ${selectedPlayer?.label}?`)) {
                    playerRoutes.forEach(route => handleDeleteRoute(route.id));
                  }
                }}
                className="px-4 py-3 rounded-lg font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all"
              >
                Clear Routes
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Complete Setup Button - show when all players have all positions */}
            {(() => {
              const allPlayersComplete = allPlayers.every(player => {
                const playerPosCount = play.slides.filter(slide =>
                  slide.positions.find(p => p.id === player.id)?.x !== undefined
                ).length;
                return playerPosCount === play.slides.length;
              });

              if (allPlayersComplete) {
                return (
                  <button
                    onClick={() => {
                      if (confirm('All players are set up! Switch to Traditional editing mode?')) {
                        // This will be handled by parent component
                        window.dispatchEvent(new CustomEvent('completePlayerSetup'));
                      }
                    }}
                    className="px-6 py-3 rounded-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Complete Setup
                  </button>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
