import { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { DraftToken, DraftCalibration } from '../../types/ai'

function rotatePoint(x: number, y: number, deg: number, cx = 0, cy = 0) {
  const r = deg * Math.PI / 180
  const cos = Math.cos(r), sin = Math.sin(r)
  const dx = x - cx, dy = y - cy
  return { x: cos * dx - sin * dy + cx, y: sin * dx + cos * dy + cy }
}

export default function RouteTool({ draftId, tokens, calibrated }: { draftId: string; tokens: DraftToken[]; calibrated?: DraftCalibration }) {
  const [activeToken, setActiveToken] = useState<string>('')
  const [pts, setPts] = useState<{ x: number; y: number }[]>([])
  const [routeType, setRouteType] = useState<'route' | 'block' | 'motion'>('route')
  const snap = !!calibrated

  function snapPoint(p: { x: number; y: number }) {
    if (!calibrated) return p
    // un-rotate to field coordinates (0 rot), snap Y to nearest yard
    const unrot = rotatePoint(p.x, p.y, -calibrated.rotationDeg)
    const pxPerYard = calibrated.yardScale
    const yFromLos = unrot.y - calibrated.losY
    const yards = Math.round(yFromLos / pxPerYard)
    const snappedY = calibrated.losY + yards * pxPerYard
    const rotBack = rotatePoint(unrot.x, snappedY, calibrated.rotationDeg)
    return { x: rotBack.x, y: rotBack.y }
  }

  function onCanvasClick(e: any) {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return
    const p = snap ? snapPoint(pos) : pos
    setPts(prev => [...prev, p])
  }

  function computeYardage(a: { x: number; y: number }, b: { x: number; y: number }) {
    if (!calibrated) return undefined
    // measure along field y in unrotated space
    const A = rotatePoint(a.x, a.y, -calibrated.rotationDeg)
    const B = rotatePoint(b.x, b.y, -calibrated.rotationDeg)
    const dy = Math.abs(B.y - A.y)
    return Math.round(dy / calibrated.yardScale)
  }

  async function save() {
    if (!activeToken || pts.length < 2) return
    const yard = computeYardage(pts[0], pts[pts.length - 1])
    await addDoc(collection(db, 'play_drafts', draftId, 'routes'), {
      tokenId: activeToken,
      type: routeType,
      points: pts,
      yardage: yard
    })
    setPts([])
  }

  return (
    <div className="flex items-center gap-2 py-2 flex-wrap">
      <label className="text-sm text-gray-300">Route for:</label>
      <select
        className="border border-gray-600 bg-gray-700 text-white rounded px-2 py-1 text-sm"
        value={activeToken}
        onChange={e => setActiveToken(e.target.value)}
      >
        <option value="">Select token</option>
        {tokens.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>

      <label className="text-sm text-gray-300">Type:</label>
      <select
        className="border border-gray-600 bg-gray-700 text-white rounded px-2 py-1 text-sm"
        value={routeType}
        onChange={e => setRouteType(e.target.value as 'route' | 'block' | 'motion')}
      >
        <option value="route">Route</option>
        <option value="block">Block</option>
        <option value="motion">Motion</option>
      </select>

      <button onClick={save} className="px-3 py-1 rounded border border-green-600 bg-green-600 text-white hover:bg-green-700 text-sm">
        Save Route
      </button>

      {pts.length > 0 && (
        <button onClick={() => setPts([])} className="px-3 py-1 rounded border border-red-600 bg-red-600 text-white hover:bg-red-700 text-sm">
          Clear ({pts.length})
        </button>
      )}

      <span className="text-xs text-gray-400">
        Click image to add points. {snap ? 'Snapping to yards is ON' : 'Calibrate to enable yard snapping'}.
      </span>
    </div>
  )
}
