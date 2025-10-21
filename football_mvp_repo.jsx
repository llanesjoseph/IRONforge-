// MVP React App Setup for High School Football Play Designer

// File: /README.md

# Football Play Designer MVP

A simple React + Firebase MVP for drawing and saving football plays in slide-based format (Setup → Mid → Final). Designed for use by a high school football team.

## Tech Stack
- React + Vite
- Firebase (Auth, Firestore, Hosting)
- React Router
- React Konva (Canvas-based play drawing)
- Tailwind CSS

## Features
- Firebase Auth (Email/Google) with protected routes
- Roles: Coach, Player (coach-only editing)
- Create plays with 3 slides (Setup, Mid, Final)
- Drag-and-drop player positions on canvas
- Rename player tokens (double-click)
- Mirror left/right, Flip field
- **Export** current slide to **PNG** or **SVG**
- **Formation templates**: Trips Right, Doubles, Empty
- **Schedules page (parent view)** with coach add form
- Animated preview (auto-run + frame-by-frame)
- Save/Load plays from Firestore

## Quick Start
1. Clone this repo
2. `npm i`
3. Copy `.env.example` → `.env.local` and fill Firebase keys
4. Create Firestore collections `plays`, `users`, `schedule` (or use the app to seed)
5. `npm run dev`
6. Sign in, hit **New Play**, choose a formation, edit, preview, and export

## File Structure
```
/components
  CanvasField.tsx        // Field + player canvas with Konva (forwardRef for export)
  PlayerToken.tsx        // Draggable player markers (rename on double-click)
  SlideControls.tsx      // Slide step buttons (1,2,3)
  PlayPreview.tsx        // Auto-run + frame-stepping animation preview
  ExportButtons.tsx      // PNG/SVG export for current slide
  ProtectedRoute.tsx     // Auth gate for protected pages
/lib
  firebase.ts            // Firebase config + init
  auth.ts                // auth helpers
  user.ts                // user profile fetch
  formations.ts          // Formation templates & helpers (Trips, Doubles, Empty)
  download.ts            // File download helpers
/pages
  login.tsx              // Firebase Auth UI
  dashboard.tsx          // List plays + New Play + link to Schedule
  schedule.tsx           // Parent-friendly schedule list + coach add form
  play/[id].tsx          // Play editor (mirror/flip/preview/export)
  new-play.tsx           // Create a play from template
/types
  index.ts               // Firestore schemas (Play, Slide, User, Schedule)
App.tsx                  // Routes
main.tsx                 // Vite entry
index.css                // Tailwind
```

## Firestore Rules (starter)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /plays/{playId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        (request.resource.data.createdBy == request.auth.uid ||
         resource.data.createdBy == request.auth.uid);
    }
    match /users/{uid} {
      allow read, write: if request.auth != null && uid == request.auth.uid;
    }
    match /schedule/{eventId} {
      allow read: if true; // public team schedule view
      allow write: if request.auth != null; // tighten later to coaches only
    }
  }
}
```

---

// File: /.env.example

VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef

---

// File: /package.json
{
  "name": "football-play-mvp",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
  "dependencies": {
    "firebase": "^10.13.1",
    "konva": "^9.3.6",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-konva": "^18.2.10",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@types/konva": "^8.0.7",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.4.5",
    "vite": "^5.4.8"
  }
}

---

// File: /App.tsx
import { Route, Routes, Navigate, Link } from 'react-router-dom'
import Dashboard from './pages/dashboard'
import Login from './pages/login'
import PlayEditor from './pages/play/[id]'
import NewPlay from './pages/new-play'
import Schedule from './pages/schedule'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
      <Route path="/play/:id" element={<ProtectedRoute><PlayEditor /></ProtectedRoute>} />
      <Route path="/new" element={<ProtectedRoute><NewPlay /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

---

// File: /lib/download.ts
export function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  downloadDataUrl(filename, url)
  setTimeout(()=>URL.revokeObjectURL(url), 1000)
}

---

// File: /lib/formations.ts
import { Slide, PlayerPosition } from '../types'

export const FIELD = { width: 700, height: 400 }

function clonePositions(arr: PlayerPosition[]): PlayerPosition[] {
  return JSON.parse(JSON.stringify(arr))
}

export function tripsRightTemplate(): Slide[] {
  const base: PlayerPosition[] = [
    { id: 'QB', label: 'QB', x: 350, y: 320 },
    { id: 'RB', label: 'RB', x: 390, y: 340 },
    { id: 'LT', label: 'LT', x: 260, y: 300 },
    { id: 'LG', label: 'LG', x: 290, y: 300 },
    { id: 'C',  label: 'C',  x: 320, y: 300 },
    { id: 'RG', label: 'RG', x: 350, y: 300 },
    { id: 'RT', label: 'RT', x: 380, y: 300 },
    { id: 'X',  label: 'X',  x: 200, y: 200 },
    { id: 'Y',  label: 'Y',  x: 440, y: 220 },
    { id: 'Z',  label: 'Z',  x: 470, y: 200 }
  ]
  return [1,2,3].map(i => ({ index: i as 1|2|3, positions: clonePositions(base) }))
}

export function doublesTemplate(): Slide[] {
  const base: PlayerPosition[] = [
    { id: 'QB', label: 'QB', x: 350, y: 320 },
    { id: 'RB', label: 'RB', x: 350, y: 350 },
    { id: 'LT', label: 'LT', x: 260, y: 300 },
    { id: 'LG', label: 'LG', x: 290, y: 300 },
    { id: 'C',  label: 'C',  x: 320, y: 300 },
    { id: 'RG', label: 'RG', x: 350, y: 300 },
    { id: 'RT', label: 'RT', x: 380, y: 300 },
    { id: 'X',  label: 'X',  x: 220, y: 210 },
    { id: 'H',  label: 'H',  x: 220, y: 190 },
    { id: 'Y',  label: 'Y',  x: 460, y: 210 },
    { id: 'Z',  label: 'Z',  x: 460, y: 190 }
  ]
  return [1,2,3].map(i => ({ index: i as 1|2|3, positions: clonePositions(base) }))
}

export function emptyTemplate(): Slide[] {
  const base: PlayerPosition[] = [
    { id: 'QB', label: 'QB', x: 350, y: 330 },
    { id: 'LT', label: 'LT', x: 260, y: 300 },
    { id: 'LG', label: 'LG', x: 290, y: 300 },
    { id: 'C',  label: 'C',  x: 320, y: 300 },
    { id: 'RG', label: 'RG', x: 350, y: 300 },
    { id: 'RT', label: 'RT', x: 380, y: 300 },
    { id: 'X',  label: 'X',  x: 200, y: 210 },
    { id: 'H',  label: 'H',  x: 240, y: 190 },
    { id: 'Y',  label: 'Y',  x: 350, y: 180 },
    { id: 'Z',  label: 'Z',  x: 460, y: 210 },
    { id: 'W',  label: 'W',  x: 420, y: 190 }
  ]
  return [1,2,3].map(i => ({ index: i as 1|2|3, positions: clonePositions(base) }))
}

---

// File: /types/index.ts
export type PlayerPosition = { id: string; label: string; x: number; y: number }
export type Slide = { index: 1 | 2 | 3; positions: PlayerPosition[] }
export type Play = { id: string; teamId: string; name: string; createdBy: string; slides: Slide[]; createdAt: any }
export type UserProfile = { uid: string; displayName?: string; role: 'coach' | 'player' }
export type ScheduleEvent = { id?: string; title: string; date: string; time?: string; location?: string; teamId?: string; notes?: string }

---

// File: /components/CanvasField.tsx
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Stage, Layer, Rect, Line, Text as KText } from 'react-konva'
import PlayerToken from './PlayerToken'
import { PlayerPosition } from '../types'
import { FIELD } from '../lib/formations'

export type CanvasHandle = { toDataURL: () => string | undefined }

type CanvasProps = {
  players: PlayerPosition[]
  onDrag: (id: string, x: number, y: number) => void
  onRename?: (id: string, label: string) => void
  editable?: boolean
}

const CanvasField = forwardRef<CanvasHandle, CanvasProps>(({ players, onDrag, onRename, editable = true }, ref) => {
  const { width, height } = FIELD
  const yardLines = Array.from({ length: 9 }).map((_, i) => 50 + i * 70)
  const stageRef = useRef<any>(null)
  useImperativeHandle(ref, () => ({ toDataURL: () => stageRef.current?.toDataURL({ pixelRatio: 2 }) }))

  return (
    <Stage ref={stageRef} width={width} height={height} className="rounded-xl shadow bg-green-700">
      <Layer>
        <Rect width={width} height={height} fill="#2e7d32" cornerRadius={12} />
        {yardLines.map(x => (<Line key={x} points={[x, 20, x, height-20]} stroke="#e5e7eb" dash={[6,6]} />))}
        <KText x={10} y={5} text="LOS →" fill="#fff" fontStyle="bold"/>
        {players.map(p => (
          <PlayerToken key={p.id} player={p} onDrag={onDrag} onRename={onRename} editable={editable} />
        ))}
      </Layer>
    </Stage>
  )
})

export default CanvasField

---

// File: /components/ExportButtons.tsx
import { Slide } from '../types'
import { downloadBlob, downloadDataUrl } from '../lib/download'
import { FIELD } from '../lib/formations'
import { CanvasHandle } from './CanvasField'

export default function ExportButtons({ slide, fileBase, canvasRef }: { slide: Slide; fileBase: string; canvasRef: React.RefObject<CanvasHandle> }){
  function exportPNG(){
    const dataUrl = canvasRef.current?.toDataURL()
    if (dataUrl) downloadDataUrl(`${fileBase}.png`, dataUrl)
  }
  function exportSVG(){
    const { width, height } = FIELD
    const circles = slide.positions.map(p => `<g transform="translate(${p.x},${p.y})"><circle r="16" fill="#ffffff" stroke="#111827" stroke-width="2"/><text x="-10" y="5" font-size="12" fill="#111827">${escapeXml(p.label)}</text></g>`).join('')
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n<rect width="${width}" height="${height}" rx="12" ry="12" fill="#2e7d32"/>${circles}\n</svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    downloadBlob(`${fileBase}.svg`, blob)
  }
  return (
    <div className="flex gap-2">
      <button className="px-3 py-2 rounded border bg-white" onClick={exportPNG}>Export PNG</button>
      <button className="px-3 py-2 rounded border bg-white" onClick={exportSVG}>Export SVG</button>
    </div>
  )
}

function escapeXml(s:string){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&apos;'}[c] as string)) }

---

// File: /pages/new-play.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { tripsRightTemplate, doublesTemplate, emptyTemplate } from '../lib/formations'

export default function NewPlay() {
  const navigate = useNavigate()
  const [tpl, setTpl] = useState<'trips'|'doubles'|'empty'>('trips')
  async function create() {
    const user = auth.currentUser!
    const slides = tpl==='trips' ? tripsRightTemplate() : tpl==='doubles' ? doublesTemplate() : emptyTemplate()
    const docRef = await addDoc(collection(db, 'plays'), {
      name: `New Play (${tpl})`, teamId: 'team-1', createdBy: user.uid, slides, createdAt: serverTimestamp(),
    })
    navigate(`/play/${docRef.id}`)
  }
  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">New Play</h1>
      <label className="block">Formation Template</label>
      <select className="border rounded px-3 py-2" value={tpl} onChange={e=>setTpl(e.target.value as any)}>
        <option value="trips">Trips Right</option>
        <option value="doubles">Doubles</option>
        <option value="empty">Empty</option>
      </select>
      <button onClick={create} className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
    </div>
  )
}

---

// File: /pages/schedule.tsx
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase'
import { ScheduleEvent } from '../types'
import { getOrCreateUserProfile } from '../lib/user'

export default function Schedule(){
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [role, setRole] = useState<'coach'|'player'>('player')
  const [form, setForm] = useState<ScheduleEvent>({ title:'', date:'', time:'', location:'', notes:'' })

  useEffect(()=>{ (async()=>{ const snap = await getDocs(collection(db,'schedule')); setEvents(snap.docs.map(d=>({ id:d.id, ...(d.data() as any) })) as any) })() },[])
  useEffect(()=>{ (async()=>{ if(auth.currentUser){ const p = await getOrCreateUserProfile(); setRole(p.role) } })() },[])

  async function add(){
    await addDoc(collection(db,'schedule'), { ...form, createdAt: serverTimestamp() })
    setForm({ title:'', date:'', time:'', location:'', notes:'' })
    const snap = await getDocs(collection(db,'schedule'))
    setEvents(snap.docs.map(d=>({ id:d.id, ...(d.data() as any) })) as any)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Schedule</h1>
        <span className="text-sm text-gray-500">Role: {role}</span>
      </div>
      {role==='coach' && (
        <div className="bg-white p-4 rounded shadow space-y-2">
          <h2 className="font-semibold">Add Event</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="border rounded px-2 py-1" placeholder="Title" value={form.title||''} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
            <input className="border rounded px-2 py-1" type="date" value={form.date||''} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
            <input className="border rounded px-2 py-1" type="time" value={form.time||''} onChange={e=>setForm(f=>({...f,time:e.target.value}))} />
            <input className="border rounded px-2 py-1" placeholder="Location" value={form.location||''} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
          </div>
          <textarea className="border rounded px-2 py-1 w-full" placeholder="Notes" value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
          <button onClick={add} className="px-3 py-2 rounded bg-blue-600 text-white">Add</button>
        </div>
      )}

      <ul className="space-y-2">
        {events.map(ev => (
          <li key={ev.id} className="bg-white p-4 rounded shadow">
            <div className="font-medium">{ev.title}</div>
            <div className="text-sm text-gray-600">{ev.date} {ev.time ? `• ${ev.time}`:''} {ev.location? `• ${ev.location}`:''}</div>
            {ev.notes && <div className="text-sm text-gray-700 mt-1">{ev.notes}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}

---

// File: /pages/dashboard.tsx
import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Play } from '../types'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [plays, setPlays] = useState<Play[]>([])
  useEffect(() => { (async () => {
    const snapshot = await getDocs(collection(db, 'plays'))
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Play[]
    setPlays(results)
  })() }, [])
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Team Plays</h1>
        <div className="flex gap-2">
          <Link to="/schedule" className="px-3 py-2 rounded border bg-white">Schedule</Link>
          <Link to="/new" className="px-3 py-2 rounded bg-green-600 text-white">New Play</Link>
        </div>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {plays.map(play => (
          <li key={play.id} className="bg-white p-4 rounded shadow">
            <Link to={`/play/${play.id}`} className="text-blue-600 font-medium">{play.name || 'Untitled Play'}</Link>
            <div className="text-sm text-gray-500">Slides: {play.slides?.length || 0}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

---

// File: /pages/play/[id].tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import CanvasField, { CanvasHandle } from '../../components/CanvasField'
import SlideControls from '../../components/SlideControls'
import PlayPreview from '../../components/PlayPreview'
import ExportButtons from '../../components/ExportButtons'
import { Play } from '../../types'
import { FIELD } from '../../lib/formations'
import { getOrCreateUserProfile } from '../../lib/user'

export default function PlayEditor() {
  const { id } = useParams()
  const [play, setPlay] = useState<Play | null>(null)
  const [slideIndex, setSlideIndex] = useState<1|2|3>(1)
  const [role, setRole] = useState<'coach'|'player'>('player')
  const canEdit = role === 'coach' && auth.currentUser && play && play.createdBy === auth.currentUser.uid
  const canvasRef = useRef<CanvasHandle>(null)

  useEffect(() => { (async () => {
    const snap = await getDoc(doc(db, 'plays', id!))
    if (snap.exists()) setPlay({ id: snap.id, ...(snap.data() as any) })
  })() }, [id])

  useEffect(() => { (async () => {
    if (!auth.currentUser) return
    const profile = await getOrCreateUserProfile()
    setRole(profile.role)
  })() }, [])

  const updatePosition = async (playerId: string, x: number, y: number) => {
    if (!play || !canEdit) return
    const updatedSlides = play.slides.map(s => s.index === slideIndex
      ? { ...s, positions: s.positions.map(p => p.id === playerId ? { ...p, x, y } : p) }
      : s
    )
    const newPlay = { ...play, slides: updatedSlides }
    setPlay(newPlay)
    await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides })
  }

  const renamePosition = async (playerId: string, label: string) => {
    if (!play || !canEdit) return
    const updatedSlides = play.slides.map(s => ({
      ...s,
      positions: s.positions.map(p => p.id === playerId ? { ...p, label } : p)
    }))
    const newPlay = { ...play, slides: updatedSlides }
    setPlay(newPlay)
    await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides })
  }

  function mirrorLeftRight(){
    if (!play || !canEdit) return
    const w = FIELD.width
    const updated = play.slides.map(s => ({ ...s, positions: s.positions.map(p => ({ ...p, x: w - p.x })) }))
    const np = { ...play, slides: updated }
    setPlay(np)
    updateDoc(doc(db, 'plays', play.id), { slides: updated })
  }

  function flipField(){
    if (!play || !canEdit) return
    const h = FIELD.height
    const updated = play.slides.map(s => ({ ...s, positions: s.positions.map(p => ({ ...p, y: h - p.y })) }))
    const np = { ...play, slides: updated }
    setPlay(np)
    updateDoc(doc(db, 'plays', play.id), { slides: updated })
  }

  const current = useMemo(()=> play?.slides.find(s=>s.index===slideIndex) || null, [play, slideIndex])
  if (!play || !current) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Editing: {play.name}</h2>
        <div className="text-sm text-gray-600">Role: {role} {canEdit? '(can edit)':'(read only)'}</div>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <button disabled={!canEdit} onClick={mirrorLeftRight} className={`px-3 py-2 rounded border ${canEdit? 'bg-white':'bg-gray-100 text-gray-400'}`}>Mirror L/R</button>
        <button disabled={!canEdit} onClick={flipField} className={`px-3 py-2 rounded border ${canEdit? 'bg-white':'bg-gray-100 text-gray-400'}`}>Flip Field</button>
        <ExportButtons slide={current} fileBase={`${play.name.replace(/\s+/g,'_')}-slide${slideIndex}`} canvasRef={canvasRef} />
      </div>
      <SlideControls current={slideIndex} setSlide={setSlideIndex} />
      <CanvasField ref={canvasRef} players={current.positions} onDrag={updatePosition} onRename={renamePosition} editable={!!canEdit} />
      <div className="pt-2">
        <h3 className="font-semibold mb-2">Preview</h3>
        <PlayPreview slides={play.slides} />
      </div>
    </div>
  )
}
