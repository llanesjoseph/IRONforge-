import { Stage, Layer, Image as KImage, Group, Circle, Text, Line } from 'react-konva'
import useImage from 'use-image'
import type { DraftToken, DraftRoute, Perspective } from '../../types/ai'

export default function OverlayCanvas({
  draftId,
  imageUrl,
  tokens,
  routes,
  heatmap,
  perspective
}: {
  draftId: string;
  imageUrl: string;
  tokens: DraftToken[];
  routes: DraftRoute[];
  heatmap: boolean;
  perspective?: Perspective | null;
}) {
  const [img] = useImage(imageUrl, 'anonymous')
  const w = img?.width || 800, h = img?.height || 450

  return (
    <Stage width={w} height={h} className="rounded border border-gray-700">
      <Layer>{img && <KImage image={img} />}</Layer>

      {perspective?.p?.length === 4 && (
        <Layer>
          <Line
            points={[
              perspective.p[0].x, perspective.p[0].y,
              perspective.p[1].x, perspective.p[1].y,
              perspective.p[2].x, perspective.p[2].y,
              perspective.p[3].x, perspective.p[3].y,
              perspective.p[0].x, perspective.p[0].y
            ]}
            stroke="#a855f7"
            strokeWidth={2}
            closed
          />
        </Layer>
      )}

      {heatmap && (
        <Layer opacity={0.25}>
          {tokens.map(t => (
            <Circle
              key={t.id}
              x={t.x}
              y={t.y}
              radius={30 * (t.confidence || 0.5)}
              fill={t.confidence && t.confidence > 0.7 ? '#22c55e' : t.confidence && t.confidence > 0.4 ? '#f59e0b' : '#ef4444'}
            />
          ))}
        </Layer>
      )}

      <Layer listening={true}>
        {routes.map(r => (
          <Line
            key={r.id}
            points={r.points.flatMap(p => [p.x, p.y])}
            stroke={r.type === 'block' ? '#6b7280' : r.type === 'motion' ? '#f59e0b' : '#2563eb'}
            dash={r.type === 'block' ? [6, 6] : undefined}
            strokeWidth={3}
          />
        ))}

        {tokens.map(t => (
          <Group key={t.id} x={t.x} y={t.y} draggable>
            <Circle radius={14} fill="#ffffff" stroke="#111827" strokeWidth={2} />
            <Text text={t.label} fontSize={12} offsetX={t.label.length * 3} offsetY={6} fill="#000" />
          </Group>
        ))}
      </Layer>
    </Stage>
  )
}
