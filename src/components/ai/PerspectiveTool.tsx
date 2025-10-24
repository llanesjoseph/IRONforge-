import { useEffect, useRef, useState } from 'react'
import type { Perspective } from '../../types/ai'

export default function PerspectiveTool({ imageUrl, perspective, onSave }: { imageUrl: string; perspective?: Perspective | null; onSave: (p: Perspective) => void }) {
  const [pts, setPts] = useState<{ x: number; y: number }[]>(perspective?.p || [])
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => { if (perspective?.p) setPts(perspective.p) }, [perspective])

  function onClick(e: React.MouseEvent) {
    const rect = (e.target as HTMLImageElement).getBoundingClientRect()
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top
    setPts(prev => {
      const next = [...prev, { x, y }].slice(0, 4)
      return next
    })
  }

  function save() {
    if (pts.length !== 4) return
    onSave({ p: pts })
  }

  return (
    <div className="bg-gray-800 rounded shadow p-4">
      <div className="text-sm mb-2 font-medium text-gray-200">Perspective: click 4 corners of the visible field in order (TL → TR → BR → BL). Optional but helps alignment.</div>
      <div style={{ position: 'relative' }}>
        <img ref={imgRef} src={imageUrl} alt="persp" onClick={onClick} style={{ maxWidth: '100%', borderRadius: '4px' }} />
        {pts.map((pt, i) => (
          <div key={i} style={{ position: 'absolute', left: pt.x - 5, top: pt.y - 5, width: 10, height: 10, background: '#a855f7', borderRadius: 10, border: '2px solid white' }} />
        ))}
        {pts.length === 4 && (
          <svg style={{ position: 'absolute', inset: 0 }}>
            <polyline points={`${pts[0].x},${pts[0].y} ${pts[1].x},${pts[1].y} ${pts[2].x},${pts[2].y} ${pts[3].x},${pts[3].y} ${pts[0].x},${pts[0].y}`} fill="rgba(168,85,247,0.1)" stroke="#a855f7" strokeWidth="2" />
          </svg>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button className="px-3 py-1 rounded border border-gray-600 bg-gray-700 text-white hover:bg-gray-600" onClick={() => setPts([])}>Reset</button>
        <button className="px-3 py-1 rounded border border-purple-600 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed" onClick={save} disabled={pts.length !== 4}>Save Perspective</button>
      </div>
    </div>
  )
}
