import type { DraftCalibration } from '../../types/ai'

export default function YardSnapGrid({ calibrated }: { calibrated?: DraftCalibration }) {
  if (!calibrated) return <div className="text-xs text-gray-400 mb-2">Calibrate to enable accurate yard snapping.</div>
  return (
    <div className="text-xs text-gray-300 mb-2">
      Yard scale: {calibrated.yardScale.toFixed(2)} px/yd • LOS y: {Math.round(calibrated.losY)} • Rot: {calibrated.rotationDeg.toFixed(1)}°
    </div>
  )
}
