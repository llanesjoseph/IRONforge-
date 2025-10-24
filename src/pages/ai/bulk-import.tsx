import { useState } from 'react'
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, auth } from '../../lib/firebase'

export default function BulkImport() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !auth.currentUser) return

    setUploading(true)
    setTotal(files.length)
    setProgress(0)

    try {
      const batch = writeBatch(db)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Upload to Firebase Storage
        const storageRef = ref(storage, `play_drafts/${auth.currentUser.uid}/${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        const imageUrl = await getDownloadURL(storageRef)

        // Create draft document
        const draftRef = doc(collection(db, 'play_drafts'))
        batch.set(draftRef, {
          sourceImagePath: storageRef.fullPath,
          imageUrl,
          createdBy: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        setProgress(i + 1)
      }

      await batch.commit()
      alert(`Successfully uploaded ${files.length} files!`)
      setProgress(0)
      setTotal(0)
    } catch (error) {
      console.error('Bulk upload failed:', error)
      alert('Bulk upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Bulk Import</h1>

      <div className="bg-gray-800 rounded shadow p-6">
        <p className="text-gray-300 mb-4">
          Upload multiple play diagrams, screenshots, or photos at once for batch AI analysis.
        </p>

        <label className="block">
          <span className="sr-only">Choose files</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleBulkUpload}
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
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${(progress / total) * 100}%` }}
              ></div>
            </div>
            <p className="text-gray-400 mt-2 text-center">
              Uploading {progress} of {total}...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
