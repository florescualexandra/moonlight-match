"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Event {
  id: string;
  name: string;
  date: string;
  formUrl: string;
  qrCode?: string;
  isMatching?: boolean;
  isMatchingComplete?: boolean;
  matchesSent?: boolean;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [matchingStatus, setMatchingStatus] = useState<Record<string, string>>({});
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    formUrl: ""
  });
  const router = useRouter();

  useEffect(() => {
    const userProfile = localStorage.getItem('mm_user_profile');
    if (userProfile) {
      try {
        const user = JSON.parse(userProfile);
        if (!user.isAdmin) {
          router.replace('/login');
          return;
        }
      } catch (e) {
        console.error("Failed to parse user profile", e);
        router.replace('/login');
        return;
      }
    } else {
      router.replace('/login');
      return;
    }
    fetchEvents();
  }, [router]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events);
      } else {
        setError(data.error || "Failed to fetch events");
      }
    } catch (err) {
      setError("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent)
      });
      const data = await res.json();
      if (res.ok) {
        setEvents([...events, data.event]);
        setShowCreateModal(false);
        setNewEvent({ name: "", date: "", formUrl: "" });
      } else {
        setError(data.error || "Failed to create event");
      }
    } catch (err) {
      setError("Failed to create event");
    }
  };

  const sendMatches = async (eventId: string) => {
    setMatchingStatus(prev => ({ ...prev, [eventId]: 'Sending...' }));
    const adminEmail = localStorage.getItem('mm_email');
    if (!adminEmail) {
      setMatchingStatus(prev => ({ ...prev, [eventId]: 'Error: Admin email not found in session.' }));
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}/send-matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // This is the line that fixes the 401 Unauthorized error
        body: JSON.stringify({ email: adminEmail }),
      });
      
      const data = await res.json();

      if (res.ok) {
        setMatchingStatus(prev => ({ ...prev, [eventId]: 'Matches Sent!' }));
        fetchEvents();
      } else {
        throw new Error(data.error || 'Failed to send matches.');
      }
    } catch (err: any) {
      setMatchingStatus(prev => ({ ...prev, [eventId]: `Error: ${err.message}` }));
    }
  };

  const startMatching = async (eventId: string) => {
    setMatchingStatus(prev => ({ ...prev, [eventId]: 'Starting...' }));
    try {
      const res = await fetch(`/api/events/${eventId}/start-matching`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setMatchingStatus(prev => ({ ...prev, [eventId]: 'Completed successfully!' }));
        fetchEvents();
      } else {
        throw new Error(data.error || 'Failed to start matching.');
      }
    } catch (err: any) {
      setMatchingStatus(prev => ({ ...prev, [eventId]: `Error: ${err.message}` }));
    }
  };

  const generateQRCode = async (eventId: string, formUrl: string) => {
    try {
      const res = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, formUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setEvents(events.map(event => 
          event.id === eventId 
            ? { ...event, qrCode: data.qrCode }
            : event
        ));
      } else {
        setError(data.error || "Failed to generate QR code");
      }
    } catch (err) {
      setError("Failed to generate QR code");
    }
  };

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col items-center px-4 py-16">
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">Event Management</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold hover:bg-[#e6c97a] transition"
            >
              Create New Event
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('mm_logged_in', 'false');
                  localStorage.removeItem('mm_user_profile');
                  window.location.href = "/";
                }
              }}
              className="px-6 py-3 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] font-bold bg-transparent hover:bg-[#D4AF37]/10 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-white text-center">Loading events...</div>
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : (
          <div className="grid gap-6">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#181c24] mb-2">{event.name}</h2>
                    <p className="text-[#23283a] mb-4">
                      Date: {new Date(event.date).toLocaleDateString()}
                    </p>
                    <p className="text-[#23283a] mb-4">
                      Form URL: <a href={event.formUrl} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">{event.formUrl}</a>
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => generateQRCode(event.id, event.formUrl)}
                      className="px-4 py-2 rounded-full bg-[#181c24] text-[#D4AF37] font-bold hover:bg-[#23283a] transition border-2 border-[#D4AF37]"
                    >
                      Generate QR
                    </button>
                    <button
                      onClick={() => startMatching(event.id)}
                      disabled={!!matchingStatus[event.id] || event.isMatching}
                      className="px-4 py-2 rounded-full bg-[#D4AF37] text-[#181c24] font-bold hover:bg-[#e6c97a] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {matchingStatus[event.id] && !matchingStatus[event.id].startsWith('Error') ? matchingStatus[event.id] : 
                       event.isMatching ? 'Matching in Progress...' :
                       event.isMatchingComplete ? 'Re-run Matching' : 'Start Matching'}
                    </button>
                    <button
                      onClick={() => sendMatches(event.id)}
                      disabled={!event.isMatchingComplete || event.matchesSent || matchingStatus[event.id] === 'Starting...' || matchingStatus[event.id] === 'Sending...'}
                      className="px-4 py-2 rounded-full bg-green-500 text-white font-bold hover:bg-green-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {event.matchesSent ? 'Matches Sent' : 'Send Matches'}
                    </button>
                  </div>
                </div>
                {event.qrCode && (
                  <div className="mt-4 flex justify-center">
                    <img src={event.qrCode} alt="Event QR Code" className="w-48 h-48" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-serif font-bold text-[#D4AF37] mb-4">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-[#23283a] text-sm font-bold mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-full border-2 border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#181c24]"
                  required
                />
              </div>
              <div>
                <label className="block text-[#23283a] text-sm font-bold mb-2">
                  Event Date
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full px-4 py-2 rounded-full border-2 border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#181c24]"
                  required
                />
              </div>
              <div>
                <label className="block text-[#23283a] text-sm font-bold mb-2">
                  Google Form URL
                </label>
                <input
                  type="url"
                  value={newEvent.formUrl}
                  onChange={(e) => setNewEvent({ ...newEvent, formUrl: e.target.value })}
                  className="w-full px-4 py-2 rounded-full border-2 border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#181c24]"
                  required
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 rounded-full bg-gray-200 text-[#23283a] font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold hover:bg-[#e6c97a] transition"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 