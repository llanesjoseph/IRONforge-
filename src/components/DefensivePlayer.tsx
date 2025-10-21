import React, { useState } from 'react';
import { Circle, Text, Group, Line } from 'react-konva';
import { GRID_SIZE } from '../lib/formations';
import { DefensivePlayer as DefensivePlayerType } from '../types';

type DefensivePlayerProps = {
  player: DefensivePlayerType;
  onDrag?: (id: string, x: number, y: number) => void;
  onClick?: () => void;
  editable?: boolean;
  enableSnapping?: boolean;
  showAssignment?: boolean;
  assignmentTarget?: { x: number; y: number } | null;
}

const DefensivePlayer: React.FC<DefensivePlayerProps> = ({
  player,
  onDrag,
  onClick,
  editable = false,
  enableSnapping = true,
  showAssignment = false,
  assignmentTarget = null
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (e: any) => {
    const node = e.target;
    let newX = node.x();
    let newY = node.y();

    // Snap to grid if enabled
    if (enableSnapping) {
      newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
      newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
    }

    // Update position
    node.position({ x: newX, y: newY });

    if (onDrag) {
      onDrag(player.id, newX, newY);
    }

    setIsDragging(false);
  };

  return (
    <>
      {/* Assignment line (rendered first so it appears behind the player) */}
      {showAssignment && assignmentTarget && (
        <Line
          points={[player.x, player.y, assignmentTarget.x, assignmentTarget.y]}
          stroke="#DC2626"
          strokeWidth={2}
          dash={[8, 4]}
          opacity={0.5}
          listening={false}
        />
      )}

      <Group
        x={player.x}
        y={player.y}
        draggable={editable}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onClick={onClick}
        onTap={onClick}
      >
        {/* Outer ring for selection/hover effect */}
        <Circle
          radius={22}
          fill="transparent"
          stroke={isDragging ? '#EF4444' : 'transparent'}
          strokeWidth={2}
          opacity={0.5}
        />

        {/* Main defensive player circle */}
        <Circle
          radius={18}
          fill="#DC2626"
          stroke="#991B1B"
          strokeWidth={2}
          shadowColor="black"
          shadowBlur={isDragging ? 8 : 4}
          shadowOpacity={0.4}
          shadowOffsetX={2}
          shadowOffsetY={2}
        />

        {/* Inner circle for contrast */}
        <Circle
          radius={14}
          fill="#B91C1C"
          opacity={0.8}
        />

        {/* Player label */}
        <Text
          text={player.label}
          fontSize={11}
          fontStyle="bold"
          fill="white"
          align="center"
          verticalAlign="middle"
          width={28}
          height={28}
          x={-14}
          y={-14}
        />

        {/* Assignment indicator (small icon) */}
        {player.assignment && (
          <Circle
            x={15}
            y={-15}
            radius={6}
            fill="#FEE2E2"
            stroke="#DC2626"
            strokeWidth={1}
          />
        )}
      </Group>

      {/* Assignment text (hover tooltip-like) */}
      {showAssignment && player.assignment && (
        <Group x={player.x + 25} y={player.y - 25}>
          <Text
            text={player.assignment}
            fontSize={10}
            fill="#DC2626"
            padding={4}
            align="left"
          />
        </Group>
      )}
    </>
  );
};

export default DefensivePlayer;