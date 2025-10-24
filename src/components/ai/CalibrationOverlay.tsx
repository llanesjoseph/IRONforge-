import { useState, useRef } from 'react'
import type { DraftCalibration } from '../../types/ai'

export default function CalibrationOverlay({ imageUrl, calibrated, onSave }: { imageUrl: string; calibrated?: DraftCalibration; onSave: (c: DraftCalibration) => void }) {
  const [losY, setLosY] = useState(calibrated?.losY || 300)
  const [yardScale, setYardScale] = useState(calibrated?.yardScale || 10)
  const [rotationDeg, setRotationDeg] = useState(calibrated?.rotationDeg || 0)
  const [showOverlay, setShowOverlay] = useState(false)

  function save() {
    onSave({ losY, yardScale, rotationDeg })
    setShowOverlay(false)
  }

  return (
    <div className="bg-gray-800 rounded shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-200">Field Calibration</div>
        <button
          className="px-3 py-1 rounded border border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setShowOverlay(!showOverlay)}
        >
          {showOverlay ? 'Hide' : 'Show'} Calibration
        </button>
      </div>

      {showOverlay && (
        <div className="space-y-3 mt-3">
          <div className="relative">
            <img src={imageUrl} alt="calibration" style={{ maxWidth: '100%', borderRadius: '4px', opacity: 0.7 }} />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: losY,
                height: 2,
                background: '#ef4444',
                transform: `rotate(${rotationDeg}deg)`,
                transformOrigin: 'center'
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">LOS Y Position</label>
              <input
                type="range"
                min="0"
                max="600"
                value={losY}
                onChange={(e) => setLosY(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-300 mt-1">{Math.round(losY)} px</div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Pixels per Yard</label>
              <input
                type="range"
                min="5"
                max="30"
                step="0.5"
                value={yardScale}
                onChange={(e) => setYardScale(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-300 mt-1">{yardScale.toFixed(1)} px/yd</div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Rotation</label>
              <input
                type="range"
                min="-45"
                max="45"
                step="1"
                value={rotationDeg}
                onChange={(e) => setRotationDeg(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-300 mt-1">{rotationDeg.toFixed(1)}°</div>
            </div>
          </div>

          <button
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 w-full"
            onClick={save}
          >
            Save Calibration
          </button>
        </div>
      )}

      {calibrated && !showOverlay && (
        <div className="text-xs text-gray-400 mt-2">
          Calibrated: {calibrated.yardScale.toFixed(1)} px/yd, LOS at {Math.round(calibrated.losY)}px, {calibrated.rotationDeg.toFixed(1)}°
        </div>
      )}
    </div>
  )
}
