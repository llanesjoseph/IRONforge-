import React from 'react';
import { Group, Path, Circle, Text, Rect } from 'react-konva';

type EndpointMarkerProps = {
  x: number;
  y: number;
  onClick?: () => void;
  isDraggable?: boolean;
  onDragEnd?: (x: number, y: number) => void;
}

const EndpointMarker: React.FC<EndpointMarkerProps> = ({
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
      {/* Pulsing circle effect */}
      <Circle
        x={0}
        y={0}
        radius={20}
        fill="#10B981"
        opacity={0.2}
      />

      {/* Flag pole */}
      <Rect
        x={-2}
        y={-20}
        width={4}
        height={40}
        fill="#374151"
        cornerRadius={2}
      />

      {/* Flag */}
      <Path
        data="M 2,-20 L 25,-12 L 25,-4 L 2,-12 Z"
        fill="#10B981"
        stroke="#059669"
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.3}
        shadowOffsetX={2}
        shadowOffsetY={2}
      />

      {/* Target circle at base */}
      <Circle
        x={0}
        y={20}
        radius={8}
        fill="none"
        stroke="#10B981"
        strokeWidth={2}
        dash={[4, 4]}
      />

      {/* Center dot */}
      <Circle
        x={0}
        y={20}
        radius={3}
        fill="#10B981"
      />

      {/* Label */}
      <Text
        x={-30}
        y={35}
        text="TARGET"
        fontSize={10}
        fontStyle="bold"
        fill="#10B981"
        align="center"
        width={60}
      />
    </Group>
  );
};

export default EndpointMarker;