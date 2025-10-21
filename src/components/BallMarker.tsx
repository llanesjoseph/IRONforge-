import React from 'react';
import { Circle, Group, Path, Text } from 'react-konva';

type BallMarkerProps = {
  x: number;
  y: number;
  onClick?: () => void;
  isDraggable?: boolean;
  onDragEnd?: (x: number, y: number) => void;
}

const BallMarker: React.FC<BallMarkerProps> = ({
  x,
  y,
  onClick,
  isDraggable = false,
  onDragEnd
}) => {
  return (
    <Group
      x={x}
      y={y}
      draggable={isDraggable}
      onDragEnd={(e) => {
        if (onDragEnd) {
          const node = e.target;
          onDragEnd(node.x(), node.y());
        }
      }}
      onClick={onClick}
      onTap={onClick}
    >
      {/* Outer glow effect */}
      <Circle
        x={0}
        y={0}
        radius={16}
        fill="#FF6B35"
        opacity={0.3}
      />

      {/* Main ball circle */}
      <Circle
        x={0}
        y={0}
        radius={12}
        fill="#D2691E"
        stroke="#8B4513"
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.3}
        shadowOffsetX={2}
        shadowOffsetY={2}
      />

      {/* Football laces path */}
      <Path
        data="M 0,-8 L 0,8 M -3,-4 L 3,-4 M -3,0 L 3,0 M -3,4 L 3,4"
        stroke="white"
        strokeWidth={1.5}
        lineCap="round"
        lineJoin="round"
      />

      {/* Label */}
      <Text
        x={-20}
        y={20}
        text="BALL"
        fontSize={10}
        fontStyle="bold"
        fill="#FF6B35"
        align="center"
        width={40}
      />
    </Group>
  );
};

export default BallMarker;