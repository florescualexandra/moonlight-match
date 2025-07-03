"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Event {
  id: string;
  name: string;
  date: string;
  formUrl?: string;
}

export default function MyEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get userId from localStorage
    if (typeof window !== "undefined") {
      const profileStr = localStorage.getItem("mm_user_profile");
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        setUserId(profile.id);
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/user/events?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.events) {
          setEvents(data.events);
        } else {
          setError(data.error || "Failed to fetch your events");
        }
      })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col items-center px-4 py-16">
      <div className="max-w-2xl w-full">
        <button
          className="mb-8 px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg border-2 border-[#D4AF37] hover:bg-[#e6c97a] transition"
          onClick={() => window.location.href = '/user'}
          style={{ display: 'block', marginLeft: 0 }}
        >
          &larr; Back to Dashboard
        </button>
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-8 text-center">My Events</h1>
        {loading ? (
          <div className="text-white text-center">Loading your events...</div>
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : events.length === 0 ? (
          <div className="text-white text-center">You have not registered for any events yet.</div>
        ) : (
          <div className="grid gap-6">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-2">
                <h2 className="text-2xl font-serif font-bold text-[#181c24]">{event.name}</h2>
                <div className="text-[#D4AF37] font-semibold">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                  {" "}
                  {new Date(event.date).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
                {event.formUrl && (
                  <div className="mt-2">
                    <a
                      href={event.formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1a73e8] underline"
                    >
                      View Event Form
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 