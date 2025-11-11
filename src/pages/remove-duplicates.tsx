import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Play } from '../types';

type DuplicateGroup = {
  name: string;
  plays: Play[];
  keep: Play;
  remove: Play[];
};

export default function RemoveDuplicates() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [totalPlays, setTotalPlays] = useState(0);
  const [removing, setRemoving] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    loadPlays();
  }, []);

  const loadPlays = async () => {
    try {
      setLoading(true);
      addLog('📖 Loading all plays from database...');

      const snapshot = await getDocs(collection(db, 'plays'));
      const plays = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Play, 'id'>)
      })) as Play[];

      setTotalPlays(plays.length);
      addLog(`Found ${plays.length} total plays`);

      // Group by name
      const playsByName: { [key: string]: Play[] } = {};
      plays.forEach(play => {
        if (!playsByName[play.name]) {
          playsByName[play.name] = [];
        }
        playsByName[play.name].push(play);
      });

      // Find duplicates
      const duplicateGroups: DuplicateGroup[] = [];
      Object.entries(playsByName).forEach(([name, instances]) => {
        if (instances.length > 1) {
          // Sort by creation date (oldest first)
          instances.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
            return aTime - bTime;
          });

          const [keep, ...remove] = instances;
          duplicateGroups.push({
            name,
            plays: instances,
            keep,
            remove
          });
        }
      });

      setDuplicates(duplicateGroups);

      if (duplicateGroups.length === 0) {
        addLog('✅ No duplicates found!');
      } else {
        const totalDupes = duplicateGroups.reduce((sum, g) => sum + g.remove.length, 0);
        addLog(`⚠️  Found ${duplicateGroups.length} play names with ${totalDupes} duplicate copies`);
      }
    } catch (error: any) {
      console.error('Error loading plays:', error);
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    const user = auth.currentUser;
    if (!user) {
      addLog('❌ Error: You must be logged in');
      return;
    }

    const totalToDelete = duplicates.reduce((sum, g) => sum + g.remove.length, 0);

    if (!confirm(`This will permanently delete ${totalToDelete} duplicate plays. Continue?`)) {
      return;
    }

    setRemoving(true);
    addLog('');
    addLog('🗑️  Starting duplicate removal...');

    let deleted = 0;
    let errors = 0;

    for (const group of duplicates) {
      addLog(`\nProcessing "${group.name}":`);
      addLog(`  ✓ Keeping: ${group.keep.id}`);

      for (const play of group.remove) {
        try {
          await deleteDoc(doc(db, 'plays', play.id));
          addLog(`  ✗ Deleted: ${play.id}`);
          deleted++;
        } catch (error: any) {
          addLog(`  ❌ Failed to delete ${play.id}: ${error.message}`);
          errors++;
        }
      }
    }

    addLog('');
    addLog('✅ Cleanup complete!');
    addLog(`   Successfully deleted: ${deleted} plays`);
    if (errors > 0) {
      addLog(`   Failed: ${errors} plays`);
    }
    addLog(`   Remaining plays: ${totalPlays - deleted}`);

    setRemoving(false);

    // Reload plays
    setTimeout(() => {
      setLogs([]);
      loadPlays();
    }, 2000);
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="card mb-6">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-display font-bold text-white">
                🔍 Duplicate Play Remover
              </h1>
              <button onClick={handleBackToDashboard} className="btn-secondary">
                ← Back to Dashboard
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-500/30">
                <div className="text-sm text-iron-300 mb-1">Total Plays</div>
                <div className="text-3xl font-bold text-white">{totalPlays}</div>
              </div>
              <div className="bg-yellow-600/20 rounded-lg p-4 border border-yellow-500/30">
                <div className="text-sm text-iron-300 mb-1">Duplicate Names</div>
                <div className="text-3xl font-bold text-white">{duplicates.length}</div>
              </div>
              <div className="bg-red-600/20 rounded-lg p-4 border border-red-500/30">
                <div className="text-sm text-iron-300 mb-1">Copies to Remove</div>
                <div className="text-3xl font-bold text-white">
                  {duplicates.reduce((sum, g) => sum + g.remove.length, 0)}
                </div>
              </div>
            </div>

            {duplicates.length > 0 && (
              <button
                onClick={handleRemoveDuplicates}
                disabled={removing}
                className="btn-danger w-full mb-6"
              >
                {removing ? '🗑️  Removing Duplicates...' : '🗑️  Remove All Duplicates'}
              </button>
            )}
          </div>
        </div>

        {duplicates.length > 0 && (
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-display font-bold text-white">Duplicates Found</h2>
            </div>
            <div className="p-6 space-y-6">
              {duplicates.map((group, idx) => (
                <div key={idx} className="border border-iron-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-3">{group.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-green-600/10 border border-green-500/30 rounded">
                      <span className="text-2xl">✓</span>
                      <div className="flex-1">
                        <div className="text-sm text-iron-300">Keeping (oldest):</div>
                        <div className="text-white font-mono text-sm">{group.keep.id}</div>
                        <div className="text-xs text-iron-400">
                          Created: {group.keep.createdAt?.toDate?.()?.toLocaleString() || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    {group.remove.map((play, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-red-600/10 border border-red-500/30 rounded">
                        <span className="text-2xl">✗</span>
                        <div className="flex-1">
                          <div className="text-sm text-iron-300">Will delete:</div>
                          <div className="text-white font-mono text-sm">{play.id}</div>
                          <div className="text-xs text-iron-400">
                            Created: {play.createdAt?.toDate?.()?.toLocaleString() || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-display font-bold text-white">Activity Log</h2>
            </div>
            <div className="p-6">
              <div className="bg-iron-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                {logs.map((log, idx) => (
                  <div key={idx} className="text-iron-300 mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
