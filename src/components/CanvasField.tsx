import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Stage, Layer, Rect, Line, Text as KText } from 'react-konva';
import Konva from 'konva';
import PlayerToken from './PlayerToken';
import RouteDrawing from './RouteDrawing';
import BallMarker from './BallMarker';
import EndpointMarker from './EndpointMarker';
import DefensivePlayer from './DefensivePlayer';
import { PlayerPosition, Route, BallMarker as BallMarkerType, EndpointMarker as EndpointMarkerType, DefensivePlayer as DefensivePlayerType } from '../types';
import { FIELD, GRID_SIZE } from '../lib/formations';

export type CanvasHandle = {
  toDataURL: () => string | undefined;
};

type CanvasProps = {
  players: PlayerPosition[];
  routes?: Route[];
  currentRoute?: Route | null;
  isDrawing?: boolean;
  onDrag: (id: string, x: number, y: number) => void;
  onRename?: (id: string, label: string) => void;
  onCanvasClick?: (x: number, y: number) => void;
  onPlayerClick?: (playerId: string) => void;
  onRouteClick?: (routeId: string) => void;
  editable?: boolean;
  showGrid?: boolean;
  enableSnapping?: boolean;
  // New props for AI features
  ballMarker?: BallMarkerType | null;
  endpointMarker?: EndpointMarkerType | null;
  defensivePlayers?: DefensivePlayerType[];
  defensiveRoutes?: Route[];
  onBallMarkerDrag?: (x: number, y: number) => void;
  onEndpointMarkerDrag?: (x: number, y: number) => void;
  onDefensivePlayerDrag?: (id: string, x: number, y: number) => void;
  showDefensiveAssignments?: boolean;
};

const CanvasField = forwardRef<CanvasHandle, CanvasProps>(
  ({
    players,
    routes = [],
    currentRoute = null,
    isDrawing = false,
    onDrag,
    onRename,
    onCanvasClick,
    onPlayerClick,
    onRouteClick,
    editable = true,
    showGrid = false,
    enableSnapping = true,
    ballMarker = null,
    endpointMarker = null,
    defensivePlayers = [],
    defensiveRoutes = [],
    onBallMarkerDrag,
    onEndpointMarkerDrag,
    onDefensivePlayerDrag,
    showDefensiveAssignments = false
  }, ref) => {
    const { width, height } = FIELD;
    // Create horizontal yard lines every ~40-50px vertically (matching real football field)
    const yardLines = Array.from({ length: 11 }).map((_, i) => 30 + i * 50);
    const stageRef = useRef<Konva.Stage>(null);
    const LOS_Y = 300; // Line of Scrimmage Y position

    // Create grid lines
    const gridLines: React.ReactNode[] = [];
    if (showGrid) {
      // Vertical grid lines
      for (let x = 0; x <= width; x += GRID_SIZE) {
        gridLines.push(
          <Line
            key={`v-grid-${x}`}
            points={[x, 0, x, height]}
            stroke="rgba(156, 163, 175, 0.2)"
            strokeWidth={1}
            listening={false}
          />
        );
      }
      // Horizontal grid lines
      for (let y = 0; y <= height; y += GRID_SIZE) {
        gridLines.push(
          <Line
            key={`h-grid-${y}`}
            points={[0, y, width, y]}
            stroke="rgba(156, 163, 175, 0.2)"
            strokeWidth={1}
            listening={false}
          />
        );
      }
    }

    useImperativeHandle(ref, () => ({
      toDataURL: () => stageRef.current?.toDataURL({ pixelRatio: 2 })
    }));

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only handle clicks on the stage background, not on other objects
      if (e.target === e.target.getStage() || e.target.className === 'Rect') {
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos && onCanvasClick) {
          onCanvasClick(pos.x, pos.y);
        }
      }
    };

    return (
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        className="rounded-xl shadow-field"
        onClick={handleStageClick}
        onDblClick={handleStageClick}
      >
        <Layer>
          {/* Base grass color */}
          <Rect width={width} height={height} fill="#0a4d2e" cornerRadius={12} />

          {/* Grass stripes (alternating dark/light) */}
          {Array.from({ length: 14 }).map((_, i) => (
            <Rect
              key={`stripe-${i}`}
              x={i * 50}
              y={0}
              width={50}
              height={height}
              fill={i % 2 === 0 ? '#0a4d2e' : '#0f6d3e'}
              listening={false}
            />
          ))}

          {/* Field border/sidelines */}
          <Line
            points={[10, 10, width - 10, 10, width - 10, height - 10, 10, height - 10, 10, 10]}
            stroke="#ffffff"
            strokeWidth={3}
            listening={false}
          />

          {/* End zones - subtle shading */}
          <Rect
            x={10}
            y={10}
            width={width - 20}
            height={50}
            fill="rgba(0, 0, 0, 0.1)"
            listening={false}
          />
          <Rect
            x={10}
            y={height - 60}
            width={width - 20}
            height={50}
            fill="rgba(0, 0, 0, 0.1)"
            listening={false}
          />

          {/* Grid Overlay - render before yard lines so they appear behind */}
          {gridLines}

          {/* Horizontal Yard Lines (running left to right across field) */}
          {yardLines.map((y, idx) => (
            <Line
              key={y}
              points={[15, y, width - 15, y]}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth={2}
              listening={false}
            />
          ))}

          {/* Hash marks on yard lines */}
          {yardLines.map(y => [
            <Line
              key={`hash-left-${y}`}
              points={[width * 0.35, y - 3, width * 0.35, y + 3]}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth={2}
              listening={false}
            />,
            <Line
              key={`hash-right-${y}`}
              points={[width * 0.65, y - 3, width * 0.65, y + 3]}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth={2}
              listening={false}
            />
          ])}

          {/* Line of Scrimmage - Glow effect */}
          <Line
            points={[15, LOS_Y, width - 15, LOS_Y]}
            stroke="#ef4444"
            strokeWidth={6}
            opacity={0.3}
            listening={false}
            shadowBlur={15}
            shadowColor="#ef4444"
          />
          <Line
            points={[15, LOS_Y, width - 15, LOS_Y]}
            stroke="#dc2626"
            strokeWidth={3}
            opacity={1}
            listening={false}
          />

          {/* LOS Label */}
          <KText
            x={width - 140}
            y={LOS_Y - 25}
            text="LINE OF SCRIMMAGE"
            fill="#fef2f2"
            fontStyle="bold"
            fontSize={11}
            listening={false}
            shadowBlur={8}
            shadowColor="#000000"
            shadowOpacity={0.8}
          />

          {/* Routes Layer - drawn before players so they appear behind */}
          <RouteDrawing
            routes={routes}
            currentRoute={currentRoute}
            isDrawing={isDrawing}
            onRouteClick={onRouteClick}
          />

          {/* Defensive Routes */}
          {defensiveRoutes.length > 0 && (
            <RouteDrawing
              routes={defensiveRoutes}
              currentRoute={null}
              isDrawing={false}
              onRouteClick={undefined}
            />
          )}

          {/* Ball Marker */}
          {ballMarker && (
            <BallMarker
              x={ballMarker.x}
              y={ballMarker.y}
              isDraggable={editable}
              onDragEnd={onBallMarkerDrag}
            />
          )}

          {/* Endpoint Marker */}
          {endpointMarker && (
            <EndpointMarker
              x={endpointMarker.x}
              y={endpointMarker.y}
              isDraggable={editable}
              onDragEnd={onEndpointMarkerDrag}
            />
          )}

          {/* Defensive Players */}
          {defensivePlayers.map(dp => {
            // Find assignment target (offensive player position)
            const assignmentTarget = dp.assignment && players.find(p =>
              dp.assignment?.includes(p.label) || dp.assignment?.includes(p.id)
            );

            return (
              <DefensivePlayer
                key={dp.id}
                player={dp}
                onDrag={onDefensivePlayerDrag}
                onClick={() => {}}
                editable={false}
                enableSnapping={enableSnapping}
                showAssignment={showDefensiveAssignments}
                assignmentTarget={assignmentTarget || null}
              />
            );
          })}

          {/* Player Tokens */}
          {players.map(p => (
            <PlayerToken
              key={p.id}
              player={p}
              onDrag={onDrag}
              onRename={onRename}
              onClick={() => onPlayerClick?.(p.id)}
              editable={editable}
              enableSnapping={enableSnapping}
            />
          ))}
        </Layer>
      </Stage>
    );
  }
);

CanvasField.displayName = 'CanvasField';

export default CanvasField;