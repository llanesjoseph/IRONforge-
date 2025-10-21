import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Team, Invite, TeamMember } from '../types';

/**
 * Create or get the admin's team
 */
export async function getOrCreateAdminTeam(adminUid: string, adminEmail: string): Promise<Team> {
  // Check if admin already has a team
  const teamsRef = collection(db, 'teams');
  const q = query(teamsRef, where('createdBy', '==', adminUid));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const teamDoc = snapshot.docs[0];
    return { id: teamDoc.id, ...teamDoc.data() } as Team;
  }

  // Create new team
  const newTeam: Omit<Team, 'id'> = {
    name: 'My Team',
    createdBy: adminUid,
    members: {},
    createdAt: serverTimestamp()
  };

  const teamRef = await addDoc(teamsRef, newTeam);
  return { id: teamRef.id, ...newTeam } as Team;
}

/**
 * Get team by ID
 */
export async function getTeam(teamId: string): Promise<Team | null> {
  try {
    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);

    if (teamSnap.exists()) {
      return { id: teamSnap.id, ...teamSnap.data() } as Team;
    }
    return null;
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
}

/**
 * Update team name
 */
export async function updateTeamName(teamId: string, name: string): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);
  await updateDoc(teamRef, { name });
}

/**
 * Create an invite
 */
export async function createInvite(
  teamId: string,
  email: string,
  role: 'coach' | 'player',
  invitedBy: string,
  invitedByEmail: string
): Promise<Invite> {
  // Check if invite already exists for this email and team
  const invitesRef = collection(db, 'invites');
  const q = query(
    invitesRef,
    where('teamId', '==', teamId),
    where('email', '==', email.toLowerCase()),
    where('status', '==', 'pending')
  );
  const existing = await getDocs(q);

  if (!existing.empty) {
    throw new Error('An invite already exists for this email');
  }

  // Create expiration date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite: Omit<Invite, 'id'> = {
    teamId,
    email: email.toLowerCase(),
    role,
    status: 'pending',
    invitedBy,
    invitedByEmail,
    createdAt: serverTimestamp(),
    expiresAt: expiresAt.toISOString()
  };

  const inviteRef = await addDoc(invitesRef, invite);

  // Get team info for email
  const team = await getTeam(teamId);

  // Send email via Resend API
  try {
    await sendInviteEmail(email, inviteRef.id, role, invitedByEmail, team?.name);
  } catch (error) {
    console.error('Failed to send invite email:', error);
    // Don't fail the whole operation if email fails
  }

  return { id: inviteRef.id, ...invite } as Invite;
}

/**
 * Get all invites for a team
 */
export async function getTeamInvites(teamId: string): Promise<Invite[]> {
  const invitesRef = collection(db, 'invites');
  const q = query(invitesRef, where('teamId', '==', teamId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Invite[];
}

/**
 * Get invite by ID
 */
export async function getInvite(inviteId: string): Promise<Invite | null> {
  try {
    const inviteRef = doc(db, 'invites', inviteId);
    const inviteSnap = await getDoc(inviteRef);

    if (inviteSnap.exists()) {
      return { id: inviteSnap.id, ...inviteSnap.data() } as Invite;
    }
    return null;
  } catch (error) {
    console.error('Error fetching invite:', error);
    return null;
  }
}

/**
 * Accept an invite
 */
export async function acceptInvite(inviteId: string, uid: string, email: string, displayName?: string): Promise<void> {
  const invite = await getInvite(inviteId);
  if (!invite) throw new Error('Invite not found');
  if (invite.status !== 'pending') throw new Error('Invite is no longer valid');
  if (invite.email.toLowerCase() !== email.toLowerCase()) throw new Error('Email does not match invite');

  // Check expiration
  const now = new Date();
  const expiresAt = new Date(invite.expiresAt);
  if (now > expiresAt) {
    await updateDoc(doc(db, 'invites', inviteId), { status: 'expired' });
    throw new Error('Invite has expired');
  }

  // Add user to team
  const teamRef = doc(db, 'teams', invite.teamId);
  const member: TeamMember = {
    uid,
    email,
    displayName,
    role: invite.role,
    joinedAt: serverTimestamp()
  };

  await updateDoc(teamRef, {
    [`members.${uid}`]: member
  });

  // Update invite status
  await updateDoc(doc(db, 'invites', inviteId), { status: 'accepted' });

  // Update user profile with teamId and role
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    teamId: invite.teamId,
    role: invite.role
  });
}

/**
 * Decline an invite
 */
export async function declineInvite(inviteId: string): Promise<void> {
  await updateDoc(doc(db, 'invites', inviteId), { status: 'declined' });
}

/**
 * Cancel an invite
 */
export async function cancelInvite(inviteId: string): Promise<void> {
  await deleteDoc(doc(db, 'invites', inviteId));
}

/**
 * Remove a team member
 */
export async function removeTeamMember(teamId: string, uid: string): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);
  await updateDoc(teamRef, {
    [`members.${uid}`]: null // Firestore deletes null fields
  });

  // Remove teamId from user profile
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    teamId: null,
    role: 'player' // Reset to default
  });
}

/**
 * Send invite email via API endpoint
 */
async function sendInviteEmail(
  email: string,
  inviteId: string,
  role: string,
  invitedByEmail: string,
  teamName?: string
): Promise<void> {
  const response = await fetch('/api/send-invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      inviteId,
      role,
      invitedByEmail,
      teamName
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send email');
  }
}
