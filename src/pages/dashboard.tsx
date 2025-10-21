import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Play, UserProfile, Team as TeamType, Invite } from '../types';
import { Link } from 'react-router-dom';
import { logout } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUserProfile } from '../lib/user';
import { getOrCreateAdminTeam, getTeamInvites } from '../lib/team';

export default function Dashboard() {
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<TeamType | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const userProfile = await getOrCreateUserProfile();
        setProfile(userProfile);

        // Fetch plays
        const snapshot = await getDocs(collection(db, 'plays'));
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Play, 'id'>)
        })) as Play[];
        setPlays(results);

        // Fetch team data if admin
        if (userProfile.role === 'admin' && auth.currentUser) {
          const adminTeam = await getOrCreateAdminTeam(
            auth.currentUser.uid,
            auth.currentUser.email || ''
          );
          setTeam(adminTeam);

          const teamInvites = await getTeamInvites(adminTeam.id);
          setInvites(teamInvites);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="card mb-8">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-display font-bold text-white mb-2">
                  <span className="bg-gradient-to-r from-[#3fe0ff] to-blue-400 bg-clip-text text-transparent">
                    GridAIron
                  </span>
                  {' '}Playbook
                </h1>
                <div className="flex items-center gap-2">
                  <span className="badge badge-blue">{userEmail}</span>
                  {profile && (
                    <span className={`badge ${
                      profile.role === 'admin' ? 'badge-purple' :
                      profile.role === 'coach' ? 'badge-yellow' :
                      'badge-green'
                    }`}>
                      {profile.role === 'admin' ? '👑 Admin' :
                       profile.role === 'coach' ? '📋 Coach' :
                       '🏃 Player'}
                    </span>
                  )}
                  <span className="badge badge-green">{plays.length} Plays</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/schedule"
                  className="btn-secondary"
                >
                  📅 Schedule
                </Link>
                <Link
                  to="/team"
                  className="btn-secondary"
                >
                  👥 Team
                </Link>
                <Link
                  to="/new"
                  className="btn-success"
                >
                  ➕ New Play
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-danger"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Dashboard Section */}
        {profile?.role === 'admin' && team && (
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="text-2xl font-display font-bold text-white">Team Overview</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-3 mb-6">
                {/* Team Members Card */}
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-lg p-6 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-iron-300 text-sm font-semibold uppercase tracking-wide">Team Members</span>
                    <span className="text-3xl">👥</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">
                    {Object.keys(team.members || {}).length}
                  </div>
                  <div className="text-blue-300 text-sm">
                    {Object.values(team.members || {}).filter(m => m.role === 'coach').length} coaches,{' '}
                    {Object.values(team.members || {}).filter(m => m.role === 'player').length} players
                  </div>
                </div>

                {/* Pending Invites Card */}
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 rounded-lg p-6 border border-yellow-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-iron-300 text-sm font-semibold uppercase tracking-wide">Pending Invites</span>
                    <span className="text-3xl">📬</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">
                    {invites.filter(inv => inv.status === 'pending').length}
                  </div>
                  <div className="text-yellow-300 text-sm">
                    Waiting for response
                  </div>
                </div>

                {/* Total Plays Card */}
                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-lg p-6 border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-iron-300 text-sm font-semibold uppercase tracking-wide">Total Plays</span>
                    <span className="text-3xl">🏈</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">
                    {plays.length}
                  </div>
                  <div className="text-green-300 text-sm">
                    In playbook
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Link
                  to="/team"
                  className="btn-primary flex items-center gap-2"
                >
                  <span>👥</span>
                  Manage Team
                </Link>
                <Link
                  to="/new"
                  className="btn-success flex items-center gap-2"
                >
                  <span>➕</span>
                  Create Play
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Plays Grid */}
        {plays.length === 0 ? (
          <div className="card">
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏈</div>
              <h3 className="text-2xl font-bold text-white mb-2">No Plays Yet</h3>
              <p className="text-iron-300 mb-6">Create your first play to get started!</p>
              <Link
                to="/new"
                className="btn-primary inline-flex items-center gap-2"
              >
                <span className="text-2xl">⚡</span>
                Create First Play
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plays.map(play => (
              <Link
                key={play.id}
                to={`/play/${play.id}`}
                className="group"
              >
                <div className="card hover:border-blue-500/50 transition-all duration-300 hover:scale-105 h-full">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-display font-bold text-white group-hover:text-blue-400 transition-colors">
                        {play.name || 'Untitled Play'}
                      </h3>
                      <div className="text-2xl">🏈</div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-iron-400 text-sm">Slides</span>
                        <span className="badge badge-blue">
                          {play.slides?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-iron-400 text-sm">Team</span>
                        <span className="text-iron-200 text-sm font-medium">
                          {play.teamId}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-iron-700">
                      <span className="text-blue-400 text-sm font-semibold group-hover:text-blue-300">
                        View Play →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}