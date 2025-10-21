import React from 'react';
import { Line, Arrow, Circle, Group } from 'react-konva';
import { Route } from '../types';

type RouteDrawingProps = {
  routes: Route[];
  currentRoute: Route | null;
  isDrawing: boolean;
  onRouteClick?: (routeId: string) => void;
};

const RouteDrawing: React.FC<RouteDrawingProps> = ({
  routes,
  currentRoute,
  isDrawing,
  onRouteClick
}) => {
  // Convert route points to flat array for Konva Line
  const getLinePoints = (route: Route): number[] => {
    return route.points.flatMap(p => [p.x, p.y]);
  };

  // Get arrow points for the end of the route
  const getArrowPoints = (route: Route): number[] | null => {
    if (route.points.length < 2) return null;

    const lastTwo = route.points.slice(-2);
    return [
      lastTwo[0].x,
      lastTwo[0].y,
      lastTwo[1].x,
      lastTwo[1].y
    ];
  };

  return (
    <>
      {/* Render completed routes */}
      {routes.map((route) => {
        const linePoints = getLinePoints(route);
        const arrowPoints = getArrowPoints(route);

        return (
          <Group
            key={route.id}
            onClick={() => onRouteClick?.(route.id)}
          >
            {/* Main route line */}
            <Line
              points={linePoints}
              stroke={route.color || '#FF6B6B'}
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
              tension={0.3}
              bezier={true}
            />

            {/* Arrow at the end */}
            {arrowPoints && (
              <Arrow
                points={arrowPoints}
                stroke={route.color || '#FF6B6B'}
                strokeWidth={3}
                fill={route.color || '#FF6B6B'}
                pointerLength={12}
                pointerWidth={12}
              />
            )}

            {/* Route points for editing */}
            {route.points.map((point, idx) => (
              <Circle
                key={`${route.id}-point-${idx}`}
                x={point.x}
                y={point.y}
                radius={4}
                fill={route.color || '#FF6B6B'}
                stroke="#fff"
                strokeWidth={1}
              />
            ))}
          </Group>
        );
      })}

      {/* Render current route being drawn */}
      {currentRoute && isDrawing && currentRoute.points.length > 0 && (
        <Group>
          <Line
            points={getLinePoints(currentRoute)}
            stroke={currentRoute.color || '#4ECDC4'}
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
            tension={0.3}
            bezier={true}
            dash={[10, 5]}
          />

          {/* Show points while drawing */}
          {currentRoute.points.map((point, idx) => (
            <Circle
              key={`current-point-${idx}`}
              x={point.x}
              y={point.y}
              radius={5}
              fill={currentRoute.color || '#4ECDC4'}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Group>
      )}
    </>
  );
};

export default RouteDrawing;