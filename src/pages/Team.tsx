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
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-iron-300 mb-4">Please sign in to view your team</p>
          <Link to="/" className="text-blue-400 hover:text-blue-300">
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
          <p className="text-iron-300 mb-4">You haven't joined a team yet</p>
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {editingTeamName && canManageTeam ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="text-3xl font-bold text-white bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-400"
                  />
                  <button
                    onClick={handleSaveTeamName}
                    className="btn-primary"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setTeamName(team.name);
                      setEditingTeamName(false);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-display font-bold text-white">{team.name}</h1>
                  {canManageTeam && (
                    <button
                      onClick={() => setEditingTeamName(true)}
                      className="text-iron-400 hover:text-iron-200"
                      title="Edit team name"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}
              <p className="text-iron-300 mt-1">
                {members.length} member{members.length !== 1 ? 's' : ''}
                {profile.role === 'admin' && ' · You are the admin'}
                {profile.role === 'coach' && ' · You are a coach'}
                {profile.role === 'player' && ' · You are a player'}
              </p>
            </div>
            <Link
              to="/"
              className="btn-secondary"
            >
              Back to Dashboard
            </Link>
          </div>

          {canInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2"
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
          <div className="card p-6">
            <h2 className="text-xl font-display font-bold text-white mb-4">Team Members</h2>

            {members.length === 0 ? (
              <p className="text-iron-400 text-center py-8">No team members yet</p>
            ) : (
              <div className="space-y-3">
                {members.map(member => (
                  <div
                    key={member.uid}
                    className="flex items-center justify-between p-4 bg-iron-700/30 rounded-lg border border-iron-700"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {member.displayName || member.email}
                      </p>
                      <p className="text-sm text-iron-300">{member.email}</p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded capitalize ${
                        member.role === 'admin' ? 'badge-purple' :
                        member.role === 'coach' ? 'badge-blue' :
                        'badge-green'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    {canManageTeam && member.uid !== auth.currentUser?.uid && (
                      <button
                        onClick={() => handleRemoveMember(member.uid, member.displayName || member.email)}
                        className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors text-sm font-medium"
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
            <div className="card p-6">
              <h2 className="text-xl font-display font-bold text-white mb-4">Pending Invites</h2>

              {pendingInvites.length === 0 ? (
                <p className="text-iron-400 text-center py-8">No pending invites</p>
              ) : (
                <div className="space-y-3">
                  {pendingInvites.map(invite => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30"
                    >
                      <div>
                        <p className="font-semibold text-white">{invite.email}</p>
                        <p className="text-sm text-iron-300">
                          Invited as <span className="capitalize font-medium text-yellow-300">{invite.role}</span>
                        </p>
                        <p className="text-xs text-iron-400 mt-1">
                          Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        className="px-3 py-1 bg-iron-700 text-iron-200 border border-iron-600 rounded hover:bg-iron-600 transition-colors text-sm font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-6">
            <h3 className="text-2xl font-display font-bold text-white mb-4">
              Invite {profile.role === 'admin' ? 'Coach' : 'Player'}
            </h3>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="coach@example.com"
                  required
                  className="input-field w-full"
                />
              </div>

              {profile.role === 'admin' && (
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-white mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'coach' | 'player')}
                    className="input-field w-full"
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
                  className="flex-1 btn-primary disabled:opacity-50"
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
                  className="btn-secondary"
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
