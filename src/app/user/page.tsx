"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

function getInitials(name: string) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

export default function UserPage() {
  const [profile, setProfile] = useState<{name?: string, email?: string}>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const profileStr = localStorage.getItem('mm_user_profile');
      if (profileStr) setProfile(JSON.parse(profileStr));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181c24] to-[#23283a] flex flex-col">
      {/* Top Bar */}
      <header className="w-full px-6 py-5 bg-[#181c24] border-b border-[#D4AF37]/40 flex items-center">
        <span className="text-2xl font-bold text-[#D4AF37] font-serif">My Dashboard</span>
      </header>

      <main className="flex-1 flex flex-col items-center py-10 px-2 md:px-0">
        <div className="w-full max-w-3xl flex flex-col gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow flex items-center gap-5 px-6 py-5">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center text-3xl font-bold text-white font-serif">
              {getInitials(profile.name || profile.email || "A")}
            </div>
            <div>
              <div className="text-xl font-bold text-[#23283a] font-serif">{profile.name || "Guest"}</div>
              <div className="text-[#23283a] text-base">{profile.email || "user@email.com"}</div>
            </div>
          </div>

          {/* Event Information Card */}
          <div className="bg-white rounded-2xl shadow px-6 py-5">
            <div className="text-lg font-bold text-[#D4AF37] font-serif mb-1">Event Information</div>
            <div className="text-[#23283a] text-base">You are registered for an upcoming Moonlight Match event.</div>
            <div className="text-[#23283a] text-sm mt-1 italic">Check back here for your matches after the event begins!</div>
          </div>

          {/* Matches Card */}
          <div className="bg-white rounded-2xl shadow px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-bold text-[#23283a] font-serif mb-1">Your Matches</div>
              <div className="text-[#23283a] text-base">Your matches will appear here once the event matching begins.</div>
            </div>
            <Link href="/matches" className="mt-4 md:mt-0 px-6 py-2 rounded-full bg-[#D4AF37] text-[#181c24] font-semibold border-2 border-[#D4AF37] hover:bg-[#e6c97a] transition text-center">View All</Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow px-6 py-5 flex flex-col gap-4">
            <div className="text-lg font-bold text-[#23283a] font-serif mb-2">Quick Actions</div>
            <div className="flex flex-col md:flex-row gap-4">
              <Link href="/matches" className="flex-1 px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg border-2 border-[#D4AF37] hover:bg-[#e6c97a] transition text-center">View All Matches</Link>
              <Link href="/events" className="flex-1 px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg border-2 border-[#D4AF37] hover:bg-[#e6c97a] transition text-center">Browse Events</Link>
              <Link href="/user/events" className="flex-1 px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg border-2 border-[#D4AF37] hover:bg-[#e6c97a] transition text-center">My Events</Link>
            </div>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('mm_logged_in', 'false');
                  localStorage.removeItem('mm_user_profile');
                  window.location.href = "/";
                }
              }}
              className="w-full px-6 py-3 rounded-full bg-white text-red-600 font-bold text-lg border-2 border-red-400 hover:bg-red-50 transition mt-2"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 