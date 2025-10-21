import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { tripsRightTemplate, doublesTemplate, emptyTemplate } from '../lib/formations';

type FormationType = 'trips' | 'doubles' | 'empty';

export default function NewPlay() {
  const navigate = useNavigate();
  const [formation, setFormation] = useState<FormationType>('trips');
  const [playName, setPlayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const slides = formation === 'trips'
        ? tripsRightTemplate()
        : formation === 'doubles'
        ? doublesTemplate()
        : emptyTemplate();

      const formationLabels = {
        trips: 'Trips Right',
        doubles: 'Doubles',
        empty: 'Empty'
      };

      const docRef = await addDoc(collection(db, 'plays'), {
        name: playName || `New Play (${formationLabels[formation]})`,
        teamId: 'team-1',
        createdBy: user.uid,
        slides,
        formation, // Store the formation type
        createdAt: serverTimestamp(),
      });

      navigate(`/play/${docRef.id}`);
    } catch (error) {
      console.error('Error creating play:', error);
      alert('Failed to create play. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create New Play</h1>
            <Link
              to="/"
              className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Play Name (Optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter play name..."
                value={playName}
                onChange={(e) => setPlayName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formation Template
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formation}
                onChange={(e) => setFormation(e.target.value as FormationType)}
              >
                <option value="trips">Trips Right</option>
                <option value="doubles">Doubles</option>
                <option value="empty">Empty</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Formation Details:</h3>
              <div className="text-sm text-gray-700">
                {formation === 'trips' && (
                  <p>Trips Right formation with 3 receivers to the right side, single back in the backfield.</p>
                )}
                {formation === 'doubles' && (
                  <p>Doubles formation with 2 receivers on each side, single back in the backfield.</p>
                )}
                {formation === 'empty' && (
                  <p>Empty backfield with 5 receivers spread across the field, no running backs.</p>
                )}
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Play'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}