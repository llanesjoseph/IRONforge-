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
        className="rounded-xl shadow bg-green-700"
        onClick={handleStageClick}
        onDblClick={handleStageClick}
      >
        <Layer>
          <Rect width={width} height={height} fill="#2e7d32" cornerRadius={12} />

          {/* Grid Overlay - render before yard lines so they appear behind */}
          {gridLines}

          {/* Horizontal Yard Lines (running left to right across field) */}
          {yardLines.map(y => (
            <Line
              key={y}
              points={[20, y, width - 20, y]}
              stroke="#e5e7eb"
              dash={[6, 6]}
              strokeWidth={1}
            />
          ))}

          {/* Line of Scrimmage - Horizontal line */}
          <Line
            points={[20, LOS_Y, width - 20, LOS_Y]}
            stroke="#FF6B6B"
            strokeWidth={4}
            opacity={0.8}
          />

          {/* LOS Label */}
          <KText
            x={10}
            y={LOS_Y - 20}
            text="LINE OF SCRIMMAGE"
            fill="#FF6B6B"
            fontStyle="bold"
            fontSize={12}
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