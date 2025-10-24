import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, auth } from '../../lib/firebase'

export default function NewDraft() {
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !auth.currentUser) return

    setUploading(true)
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `play_drafts/${auth.currentUser.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const imageUrl = await getDownloadURL(storageRef)

      // Create draft document
      const draftDoc = await addDoc(collection(db, 'play_drafts'), {
        sourceImagePath: storageRef.fullPath,
        imageUrl,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      navigate(`/ai/draft/${draftDoc.id}`)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">New AI Draft</h1>

      <div className="bg-gray-800 rounded shadow p-6">
        <p className="text-gray-300 mb-4">
          Upload a screenshot or photo of a play diagram, formation, or game footage to analyze with AI.
        </p>

        <label className="block">
          <span className="sr-only">Choose file</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-300
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700
              disabled:opacity-50"
          />
        </label>

        {uploading && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Uploading...</p>
          </div>
        )}
      </div>
    </div>
  )
}
