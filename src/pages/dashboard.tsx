import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Play } from '../types';
import { Link } from 'react-router-dom';
import { logout } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlays = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'plays'));
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Play, 'id'>)
        })) as Play[];
        setPlays(results);
      } catch (error) {
        console.error('Error fetching plays:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlays();
  }, []);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/login');
    } else {
      console.error('Logout error:', result.error);
    }
  };

  const userEmail = auth.currentUser?.email;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Team Plays</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {userEmail}</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/schedule"
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Schedule
              </Link>
              <Link
                to="/new"
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                New Play
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {plays.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No plays yet. Create your first play!</p>
              <Link
                to="/new"
                className="inline-block px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Create First Play
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plays.map(play => (
                <div
                  key={play.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <Link
                    to={`/play/${play.id}`}
                    className="block space-y-2"
                  >
                    <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-700">
                      {play.name || 'Untitled Play'}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Slides: {play.slides?.length || 0}</p>
                      <p>Team ID: {play.teamId}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}