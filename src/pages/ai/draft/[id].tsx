import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, doc, getDoc, onSnapshot, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import CalibrationOverlay from '../../../components/ai/CalibrationOverlay'
import TokenPalette from '../../../components/ai/TokenPalette'
import OverlayCanvas from '../../../components/ai/OverlayCanvas'
import RouteTool from '../../../components/ai/RouteTool'
import YardSnapGrid from '../../../components/ai/YardSnapGrid'
import ConvertToPlayBtn from '../../../components/ai/ConvertToPlayBtn'
import PerspectiveTool from '../../../components/ai/PerspectiveTool'
import type { DraftDoc, DraftToken, DraftRoute, DraftCalibration, Perspective } from '../../../types/ai'

export default function DraftEditor() {
  const { id } = useParams()
  const [draft, setDraft] = useState<DraftDoc | null>(null)
  const [tokens, setTokens] = useState<DraftToken[]>([])
  const [routes, setRoutes] = useState<DraftRoute[]>([])
  const [heatmap, setHeatmap] = useState(false)
  const [coverage, setCoverage] = useState<string>('—')
  const [persp, setPersp] = useState<Perspective | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'play_drafts', id), s => {
      if (s.exists()) {
        const data: any = s.data()
        setDraft({ id: s.id, ...data })
        if (data.perspective) setPersp(data.perspective)
      }
    })
    const tUnsub = onSnapshot(collection(db, 'play_drafts', id, 'tokens'), ss => {
      setTokens(ss.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    })
    const rUnsub = onSnapshot(collection(db, 'play_drafts', id, 'routes'), ss => {
      setRoutes(ss.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    })
    return () => { unsub(); tUnsub(); rUnsub() }
  }, [id])

  async function saveCalibration(c: DraftCalibration) {
    if (!id) return
    await updateDoc(doc(db, 'play_drafts', id), { calibrated: c })
    await addDoc(collection(db, 'play_drafts', id, 'history'), { ts: serverTimestamp(), action: 'calibrated', value: c })
  }

  async function savePerspective(p: Perspective) {
    if (!id) return
    await updateDoc(doc(db, 'play_drafts', id), { perspective: p })
    await addDoc(collection(db, 'play_drafts', id, 'history'), { ts: serverTimestamp(), action: 'perspective_set', value: p })
    setPersp(p)
  }

  async function aiAnalyze() {
    if (!draft) return
    setLoading(true)
    await addDoc(collection(db, 'play_drafts', draft.id, 'history'), { ts: serverTimestamp(), action: 'analyze_requested' })
    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gcsPath: draft.sourceImagePath, calibrated: draft.calibrated, perspective: draft.perspective })
      })
      const data = await res.json()
      for (const t of (data.tokens || [])) {
        await addDoc(collection(db, 'play_drafts', draft.id, 'tokens'), t)
      }
      for (const r of (data.routes || [])) {
        await addDoc(collection(db, 'play_drafts', draft.id, 'routes'), r)
      }
      await updateDoc(doc(db, 'play_drafts', draft.id), { ai: { formationGuess: data.formationGuess, coverageGuess: data.coverageGuess, confidence: data.confidence } })
      setCoverage(data.coverageGuess || '—')
      await addDoc(collection(db, 'play_drafts', draft.id, 'history'), { ts: serverTimestamp(), action: 'analyze_done', value: data })
    } catch (e) {
      console.error(e)
      alert('AI analysis failed. Make sure the server endpoint is configured.')
    } finally {
      setLoading(false)
    }
  }

  if (!draft) return <div className="p-6 bg-gray-900 text-white min-h-screen">Loading...</div>

  return (
    <div className="p-6 space-y-3 max-w-6xl mx-auto bg-gray-900 text-white min-h-screen">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold">AI Draft Editor</h1>
        <div className="text-sm text-gray-400">
          Coverage: <strong className="text-white">{draft.ai?.coverageGuess || coverage}</strong>
          {draft.ai?.confidence ? ` (${Math.round((draft.ai.confidence || 0) * 100)}%)` : ''}
        </div>
      </div>

      <PerspectiveTool imageUrl={(draft as any).imageUrl || ''} perspective={draft.perspective} onSave={savePerspective} />
      <CalibrationOverlay imageUrl={(draft as any).imageUrl || ''} calibrated={draft.calibrated} onSave={saveCalibration} />

      <div className="flex gap-4 flex-wrap items-center">
        <TokenPalette draftId={draft.id} />
        <button
          className="px-3 py-2 rounded border border-purple-600 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          onClick={aiAnalyze}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Run AI Assist'}
        </button>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={heatmap} onChange={e => setHeatmap(e.target.checked)} />
          Confidence heatmap
        </label>
      </div>

      <div className="bg-gray-800 rounded shadow p-2 overflow-auto">
        <YardSnapGrid calibrated={draft.calibrated} />
        <OverlayCanvas draftId={draft.id} imageUrl={(draft as any).imageUrl || ''} tokens={tokens} routes={routes} heatmap={heatmap} perspective={draft.perspective} />
        <RouteTool draftId={draft.id} tokens={tokens} calibrated={draft.calibrated} />
      </div>

      <ConvertToPlayBtn draftId={draft.id} />
    </div>
  )
}
