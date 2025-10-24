import { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../../lib/firebase'

const roles = ['QB', 'RB', 'WR', 'TE', 'OL', 'CB', 'S', 'LB', 'DL'] as const

export default function TokenPalette({ draftId }: { draftId: string }) {
  const [selectedRole, setSelectedRole] = useState<typeof roles[number]>('QB')
  const [label, setLabel] = useState('')

  async function addToken() {
    if (!label.trim()) return
    await addDoc(collection(db, 'play_drafts', draftId, 'tokens'), {
      role: selectedRole,
      label: label.trim(),
      x: 360,
      y: 300,
      confidence: 1.0
    })
    setLabel('')
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="text-sm text-gray-300">Add Token:</label>
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as typeof roles[number])}
        className="border border-gray-600 bg-gray-700 text-white rounded px-2 py-1 text-sm"
      >
        {roles.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <input
        type="text"
        placeholder="Label (e.g., WR1)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="border border-gray-600 bg-gray-700 text-white rounded px-2 py-1 text-sm"
      />
      <button
        onClick={addToken}
        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
      >
        Add
      </button>
    </div>
  )
}
