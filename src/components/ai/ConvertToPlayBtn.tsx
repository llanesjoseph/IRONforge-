import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../lib/firebase'

export default function ConvertToPlayBtn({ draftId }: { draftId: string }) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function convert() {
    if (!auth.currentUser) return
    setLoading(true)

    try {
      // Fetch draft and all tokens/routes
      const draftSnap = await getDoc(doc(db, 'play_drafts', draftId))
      if (!draftSnap.exists()) throw new Error('Draft not found')

      const tokensSnap = await getDoc(doc(db, 'play_drafts', draftId, 'tokens', 'all'))
      const routesSnap = await getDoc(doc(db, 'play_drafts', draftId, 'routes', 'all'))

      // Convert to play format
      const playDoc = await addDoc(collection(db, 'plays'), {
        name: `AI Play ${new Date().toLocaleDateString()}`,
        teamId: 'team-1',
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        slides: [{
          index: 0,
          positions: [], // Map tokens to positions
          routes: [] // Map draft routes to play routes
        }]
      })

      navigate(`/play/${playDoc.id}`)
    } catch (error) {
      console.error('Failed to convert draft to play:', error)
      alert('Failed to convert draft to play')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={convert}
      disabled={loading}
      className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Converting...' : 'Convert to Play'}
    </button>
  )
}
