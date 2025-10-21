import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { getOrCreateUserProfile } from '../lib/user';
import {
  getOrCreateAdminTeam,
  getTeam,
  createInvite,
  getTeamInvites,
  cancelInvite,
  removeTeamMember,
  updateTeamName
} from '../lib/team';
import { Team as TeamType, Invite, TeamMember, UserProfile } from '../types';

export default function Team() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<TeamType | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'coach' | 'player'>('player');
  const [sending, setSending] = useState(false);
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const userProfile = await getOrCreateUserProfile();
      setProfile(userProfile);

      if (userProfile.role === 'admin') {
        // Admin: get or create team
        const adminTeam = await getOrCreateAdminTeam(user.uid, user.email || '');
        setTeam(adminTeam);
        setTeamName(adminTeam.name);

        // Load invites
        const teamInvites = await getTeamInvites(adminTeam.id);
        setInvites(teamInvites);
      } else if (userProfile.teamId) {
        // Coach/Player: load their team
        const userTeam = await getTeam(userProfile.teamId);
        if (userTeam) {
          setTeam(userTeam);
          setTeamName(userTeam.name);

          // Coaches can see invites
          if (userProfile.role === 'coach') {
            const teamInvites = await getTeamInvites(userTeam.id);
            setInvites(teamInvites);
          }
        }
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!team || !profile || !auth.currentUser?.email) return;

    setSending(true);
    try {
      await createInvite(
        team.id,
        inviteEmail,
        inviteRole,
        auth.currentUser.uid,
        auth.currentUser.email
      );

      alert('Invite sent successfully!');
      setInviteEmail('');
      setShowInviteModal(false);

      // Reload invites
      const teamInvites = await getTeamInvites(team.id);
      setInvites(teamInvites);
    } catch (error: any) {
      alert(error.message || 'Failed to send invite');
    } finally {
      setSending(false);
    }
  }

  async function handleCancelInvite(inviteId: string) {
    if (!confirm('Cancel this invite?')) return;

    try {
      await cancelInvite(inviteId);
      setInvites(invites.filter(inv => inv.id !== inviteId));
    } catch (error) {
      alert('Failed to cancel invite');
    }
  }

  async function handleRemoveMember(uid: string, memberName: string) {
    if (!team) return;
    if (!confirm(`Remove ${memberName} from the team?`)) return;

    try {
      await removeTeamMember(team.id, uid);
      const updatedTeam = await getTeam(team.id);
      if (updatedTeam) setTeam(updatedTeam);
    } catch (error) {
      alert('Failed to remove member');
    }
  }

  async function handleSaveTeamName() {
    if (!team || !teamName.trim()) return;

    try {
      await updateTeamName(team.id, teamName);
      setTeam({ ...team, name: teamName });
      setEditingTeamName(false);
    } catch (error) {
      alert('Failed to update team name');
    }
  }

  const canInvite = profile?.role === 'admin' || profile?.role === 'coach';
  const canManageTeam = profile?.role === 'admin';
  const members = team ? Object.values(team.members) : [];
  const pendingInvites = invites.filter(inv => inv.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your team</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You haven't joined a team yet</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {editingTeamName && canManageTeam ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="text-3xl font-bold text-gray-900 border-b-2 border-blue-600 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveTeamName}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setTeamName(team.name);
                      setEditingTeamName(false);
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
                  {canManageTeam && (
                    <button
                      onClick={() => setEditingTeamName(true)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Edit team name"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}
              <p className="text-gray-600 mt-1">
                {members.length} member{members.length !== 1 ? 's' : ''}
                {profile.role === 'admin' && ' · You are the admin'}
                {profile.role === 'coach' && ' · You are a coach'}
                {profile.role === 'player' && ' · You are a player'}
              </p>
            </div>
            <Link
              to="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>

          {canInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invite {profile.role === 'admin' ? 'Coach' : 'Player'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Members */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Team Members</h2>

            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No team members yet</p>
            ) : (
              <div className="space-y-3">
                {members.map(member => (
                  <div
                    key={member.uid}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {member.displayName || member.email}
                      </p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded capitalize">
                        {member.role}
                      </span>
                    </div>
                    {canManageTeam && member.uid !== auth.currentUser?.uid && (
                      <button
                        onClick={() => handleRemoveMember(member.uid, member.displayName || member.email)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invites */}
          {canInvite && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Invites</h2>

              {pendingInvites.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending invites</p>
              ) : (
                <div className="space-y-3">
                  {pendingInvites.map(invite => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{invite.email}</p>
                        <p className="text-sm text-gray-600">
                          Invited as <span className="capitalize font-medium">{invite.role}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Invite {profile.role === 'admin' ? 'Coach' : 'Player'}
            </h3>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="coach@example.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {profile.role === 'admin' && (
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'coach' | 'player')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="coach">Coach</option>
                    <option value="player">Player</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Invite'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteRole('player');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
