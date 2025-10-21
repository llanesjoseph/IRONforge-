import React from 'react';
import { Slide } from '../types';
import { downloadBlob, downloadDataUrl } from '../lib/download';
import { FIELD } from '../lib/formations';
import { CanvasHandle } from './CanvasField';

interface ExportButtonsProps {
  slide: Slide;
  fileBase: string;
  canvasRef: React.RefObject<CanvasHandle>;
}

export default function ExportButtons({ slide, fileBase, canvasRef }: ExportButtonsProps) {
  function exportPNG() {
    const dataUrl = canvasRef.current?.toDataURL();
    if (dataUrl) {
      downloadDataUrl(`${fileBase}.png`, dataUrl);
    }
  }

  function exportSVG() {
    const { width, height } = FIELD;
    const circles = slide.positions
      .map(p => {
        const escapedLabel = escapeXml(p.label);
        return `<g transform="translate(${p.x},${p.y})">
          <circle r="16" fill="#ffffff" stroke="#111827" stroke-width="2"/>
          <text x="0" y="5" font-size="12" fill="#111827" text-anchor="middle">${escapedLabel}</text>
        </g>`;
      })
      .join('\n');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="12" ry="12" fill="#2e7d32"/>
  ${circles}
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(`${fileBase}.svg`, blob);
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        className="px-3 py-2 rounded border bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-400 transition-colors font-medium"
        onClick={exportPNG}
      >
        Export PNG
      </button>
      <button
        className="px-3 py-2 rounded border bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-400 transition-colors font-medium"
        onClick={exportSVG}
      >
        Export SVG
      </button>
    </div>
  );
}

function escapeXml(s: string): string {
  const replacements: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  };
  return s.replace(/[&<>"']/g, c => replacements[c]);
}