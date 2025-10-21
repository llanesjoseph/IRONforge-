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
      <Circle
        radius={16}
        fill="#ffffff"
        stroke="#111827"
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={5}
        shadowOpacity={0.3}
      />
      <Text
        text={player.label}
        x={-10}
        y={-7}
        fontSize={12}
        fontStyle="bold"
        fill="#111827"
        align="center"
        width={20}
      />
    </Group>
  );
}