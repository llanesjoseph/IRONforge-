import React, { useEffect, useState } from 'react';
import { addDoc, collection, getDocs, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ScheduleEvent } from '../types';
import { getOrCreateUserProfile } from '../lib/user';
import { Link } from 'react-router-dom';

export default function Schedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [role, setRole] = useState<'admin' | 'coach' | 'player'>('player');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ScheduleEvent>({
    title: '',
    date: '',
    time: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        const eventsQuery = query(collection(db, 'schedule'), orderBy('date', 'asc'));
        const snap = await getDocs(eventsQuery);
        setEvents(snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<ScheduleEvent, 'id'>)
        })) as ScheduleEvent[]);

        // Fetch user role
        if (auth.currentUser) {
          const profile = await getOrCreateUserProfile();
          setRole(profile.role);
        }
      } catch (error) {
        console.error('Error fetching schedule data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddEvent = async () => {
    if (!form.title || !form.date) {
      alert('Please provide at least a title and date for the event');
      return;
    }

    try {
      await addDoc(collection(db, 'schedule'), {
        ...form,
        createdAt: serverTimestamp(),
        teamId: 'team-1'
      });

      // Refresh events list
      const eventsQuery = query(collection(db, 'schedule'), orderBy('date', 'asc'));
      const snap = await getDocs(eventsQuery);
      setEvents(snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<ScheduleEvent, 'id'>)
      })) as ScheduleEvent[]);

      // Reset form
      setForm({
        title: '',
        date: '',
        time: '',
        location: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to add event. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Schedule</h1>
              <p className="text-sm text-gray-600 mt-1">
                Your role: <span className="font-semibold capitalize">{role}</span>
              </p>
            </div>
            <Link
              to="/"
              className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>

          {role === 'coach' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Event</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event Title"
                  value={form.title || ''}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
                <input
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="date"
                  value={form.date || ''}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
                <input
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="time"
                  value={form.time || ''}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                />
                <input
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Location"
                  value={form.location || ''}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                />
              </div>
              <textarea
                className="border border-gray-300 rounded-md px-3 py-2 w-full mt-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notes (optional)"
                rows={3}
                value={form.notes || ''}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
              <button
                onClick={handleAddEvent}
                className="mt-3 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Add Event
              </button>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            {events.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No events scheduled yet</p>
            ) : (
              <ul className="space-y-3">
                {events.map(event => (
                  <li key={event.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {event.date}
                      {event.time && ` at ${event.time}`}
                      {event.location && ` - ${event.location}`}
                    </div>
                    {event.notes && (
                      <div className="text-sm text-gray-700 mt-2">{event.notes}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}