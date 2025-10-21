import React, { useState } from 'react';
import { Circle, Text, Group } from 'react-konva';
import { PlayerPosition } from '../types';
import { snapToGrid } from '../lib/formations';

interface PlayerTokenProps {
  player: PlayerPosition;
  onDrag: (id: string, x: number, y: number) => void;
  onRename?: (id: string, label: string) => void;
  onClick?: () => void;
  editable?: boolean;
  enableSnapping?: boolean;
}

export default function PlayerToken({ player, onDrag, onRename, onClick, editable = true, enableSnapping = true }: PlayerTokenProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleDragEnd = (e: any) => {
    if (editable) {
      const x = e.target.x();
      const y = e.target.y();

      // Apply snap-to-grid if enabled
      if (enableSnapping) {
        const snapped = snapToGrid(x, y);
        // Move the token to the snapped position for smooth visual feedback
        e.target.x(snapped.x);
        e.target.y(snapped.y);
        onDrag(player.id, snapped.x, snapped.y);
      } else {
        onDrag(player.id, x, y);
      }
    }
  };

  const handleDoubleClick = () => {
    if (editable && onRename) {
      const newLabel = prompt('Enter player label:', player.label);
      if (newLabel && newLabel !== player.label) {
        onRename(player.id, newLabel);
      }
    }
  };

  const handleClick = (e: any) => {
    e.cancelBubble = true; // Prevent event from bubbling to stage
    if (onClick) {
      onClick();
    }
  };

  return (
    <Group
      x={player.x}
      y={player.y}
      draggable={editable}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onDblClick={handleDoubleClick}
      onTap={handleDoubleClick}
    >
      {/* Outer glow */}
      <Circle
        radius={20}
        fill="#2563eb"
        opacity={0.3}
        shadowBlur={10}
        shadowColor="#2563eb"
      />

      {/* Main token - gradient effect with two circles */}
      <Circle
        radius={18}
        fill="#3b82f6"
        stroke="#1e40af"
        strokeWidth={3}
        shadowColor="rgba(0, 0, 0, 0.6)"
        shadowBlur={8}
        shadowOffsetY={3}
        shadowOpacity={0.8}
      />

      {/* Inner highlight for 3D effect */}
      <Circle
        radius={15}
        fill="rgba(147, 197, 253, 0.3)"
        offsetY={-2}
      />

      {/* Player label with shadow for readability */}
      <Text
        text={player.label}
        x={-12}
        y={-8}
        fontSize={13}
        fontStyle="bold"
        fill="#ffffff"
        align="center"
        width={24}
        shadowColor="#000000"
        shadowBlur={4}
        shadowOpacity={0.8}
      />
    </Group>
  );
}