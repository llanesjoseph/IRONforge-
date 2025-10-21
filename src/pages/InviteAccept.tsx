import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getInvite, acceptInvite, declineInvite } from '../lib/team';
import { Invite } from '../types';

export default function InviteAccept() {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    loadInvite();
  }, [inviteId]);

  async function loadInvite() {
    if (!inviteId) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }

    try {
      const inviteData = await getInvite(inviteId);
      if (!inviteData) {
        setError('Invite not found');
        setLoading(false);
        return;
      }

      if (inviteData.status !== 'pending') {
        setError(`This invite has already been ${inviteData.status}`);
        setLoading(false);
        return;
      }

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(inviteData.expiresAt);
      if (now > expiresAt) {
        setError('This invite has expired');
        setLoading(false);
        return;
      }

      setInvite(inviteData);
      setEmail(inviteData.email);

      // Check if user is already signed in
      const user = auth.currentUser;
      if (user) {
        if (user.email?.toLowerCase() !== inviteData.email.toLowerCase()) {
          setError(`You are signed in as ${user.email}, but this invite is for ${inviteData.email}. Please sign out and try again.`);
          setLoading(false);
          return;
        }
      } else {
        setNeedsAuth(true);
      }
    } catch (err) {
      console.error('Error loading invite:', err);
      setError('Failed to load invite');
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;

    setProcessing(true);
    setError(null);

    try {
      if (isSignUp) {
        // Create new account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Wait a moment for user to be fully created
        await new Promise(resolve => setTimeout(resolve, 500));

        // Accept the invite
        await acceptInvite(invite.id, userCredential.user.uid, email, displayName);

        alert('Account created and invite accepted! Redirecting to dashboard...');
        navigate('/');
      } else {
        // Sign in existing user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Accept the invite
        await acceptInvite(invite.id, userCredential.user.uid, email);

        alert('Invite accepted! Redirecting to dashboard...');
        navigate('/');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account already exists with this email. Please sign in instead.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setProcessing(false);
    }
  }

  async function handleAccept() {
    if (!invite || !auth.currentUser) return;

    setProcessing(true);
    setError(null);

    try {
      await acceptInvite(
        invite.id,
        auth.currentUser.uid,
        auth.currentUser.email || invite.email,
        auth.currentUser.displayName || undefined
      );

      alert('Invite accepted! Redirecting to dashboard...');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to accept invite');
    } finally {
      setProcessing(false);
    }
  }

  async function handleDecline() {
    if (!invite) return;
    if (!confirm('Are you sure you want to decline this invitation?')) return;

    setProcessing(true);
    try {
      await declineInvite(invite.id);
      alert('Invitation declined');
      navigate('/');
    } catch (err) {
      setError('Failed to decline invite');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  if (needsAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🏈</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Invitation</h1>
            <p className="text-gray-600">
              You've been invited to join as a <span className="font-semibold capitalize">{invite.role}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">by {invite.invitedByEmail}</p>
          </div>

          <div className="mb-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            >
              {processing ? 'Processing...' : isSignUp ? 'Create Account & Accept' : 'Sign In & Accept'}
            </button>
          </form>

          <div className="mt-4">
            <button
              onClick={handleDecline}
              disabled={processing}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Decline Invitation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">🏈</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Invitation</h1>
        <p className="text-gray-600 mb-2">
          You've been invited to join as a <span className="font-semibold capitalize">{invite.role}</span>
        </p>
        <p className="text-sm text-gray-500 mb-6">by {invite.invitedByEmail}</p>

        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={processing}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
          >
            {processing ? 'Accepting...' : 'Accept Invitation'}
          </button>

          <button
            onClick={handleDecline}
            disabled={processing}
            className="w-full px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
