"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function MoonLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 28C22.4772 28 18 23.5228 18 18C18 13.5228 21.134 9.85786 25.25 8.4375C25.0833 8.41667 24.9167 8.41667 24.75 8.41667C16.9919 8.41667 10.5 14.9086 10.5 22.6667C10.5 26.134 13.366 29 16.8333 29C21.134 29 24.75 25.384 24.75 21.0833C24.75 20.9167 24.75 20.75 24.7292 20.5833C23.3089 24.6993 19.6438 27.8333 15.1667 27.8333C9.6438 27.8333 5.16667 23.3562 5.16667 17.8333C5.16667 12.3105 9.6438 7.83333 15.1667 7.83333C20.6895 7.83333 25.1667 12.3105 25.1667 17.8333C25.1667 23.3562 20.6895 27.8333 15.1667 27.8333" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function UserPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<{name?: string, email?: string, description?: string}>({});
  const [formResponse, setFormResponse] = useState<Record<string, any> | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEmail(localStorage.getItem('mm_email') || '');
      const profileStr = localStorage.getItem('mm_user_profile');
      if (profileStr) setProfile(JSON.parse(profileStr));
    }
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (email) {
        const res = await fetch(`/api/user-profile?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          setFormResponse(data.user.formResponse || null);
        }
      }
    }
    fetchProfile();
  }, [email]);

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-8 py-6 bg-[#181c24] shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <MoonLogo />
          <span className="text-2xl font-bold text-[#D4AF37] tracking-wide font-serif">Moonlight Match</span>
        </div>
        <div className="flex gap-4">
          <a href="/events" className="text-[#181c24] bg-[#D4AF37] font-semibold px-5 py-2 rounded-full shadow hover:bg-[#e6c97a] border-2 border-[#D4AF37] transition">Events</a>
          <a href="/user" className="text-[#181c24] bg-[#D4AF37] font-semibold px-5 py-2 rounded-full shadow hover:bg-[#e6c97a] border-2 border-[#D4AF37] transition">Dashboard</a>
          <a href="#features" className="text-[#D4AF37] font-semibold hover:underline">Features</a>
          <a href="#contact" className="text-[#D4AF37] font-semibold hover:underline">Contact</a>
        </div>
      </nav>
      {/* Dashboard Main Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-4xl w-full mx-auto flex flex-col md:flex-row bg-white/5 rounded-3xl shadow-2xl overflow-hidden mt-24 mb-24">
          {/* Left: Welcome & Navigation */}
          <div className="flex-1 flex flex-col justify-center items-center md:items-start px-10 py-14 bg-white/90">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#D4AF37] mb-2">Welcome{profile.name && <span className="block text-2xl text-[#23283a] font-normal mt-2">{profile.name}</span>}</h1>
            <div className="text-[#23283a] text-lg mb-2">{profile.email}</div>
            {profile.description && <div className="italic text-[#23283a] mb-6 max-w-md">{profile.description}</div>}
            <p className="text-lg text-[#23283a] mb-10 max-w-md">Your luxury matchmaking dashboard</p>
            <div className="flex flex-col gap-5 w-full max-w-xs">
              <Link href="/matches" className="px-8 py-4 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-xl hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37] text-center">View My Matches</Link>
              <Link href="/events" className="px-8 py-4 rounded-full bg-[#181c24] text-[#D4AF37] font-bold text-xl hover:bg-[#23283a] transition border-2 border-[#D4AF37] text-center">Browse Events</Link>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') localStorage.setItem('mm_logged_in', 'false');
                  router.push('/');
                }}
                className="px-8 py-4 rounded-full bg-[#181c24] text-[#D4AF37] font-bold text-xl hover:bg-[#23283a] transition border-2 border-[#D4AF37] text-center"
              >
                Sign Out
              </button>
            </div>
            {/* My Form Responses Section */}
            {formResponse && (
              <div className="mt-10 w-full max-w-xl">
                <h2 className="text-2xl font-serif font-bold text-[#D4AF37] mb-4">My Form Responses</h2>
                <div className="grid gap-4">
                  {Object.entries(formResponse).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-xl shadow p-4 flex flex-col">
                      <span className="font-semibold text-[#23283a] mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                      <span className="text-[#181c24]">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Right: Status & Security */}
          <div className="flex-1 flex flex-col gap-8 justify-center items-center px-10 py-14 bg-[#181c24]">
            <div className="w-full bg-[#23283a] rounded-2xl p-8 shadow-lg mb-4">
              <div className="text-2xl font-serif font-bold text-[#D4AF37] mb-2">Your Status</div>
              <div className="text-lg text-white mb-1">Membership: <span className="font-bold text-[#D4AF37]">VIP</span></div>
              <div className="text-lg text-white mb-1">Events Attended: <span className="font-bold text-[#D4AF37]">2</span></div>
              <div className="text-lg text-white">Matches Made: <span className="font-bold text-[#D4AF37]">3</span></div>
            </div>
            <div className="w-full bg-white/90 rounded-2xl p-8 shadow text-center">
              <div className="text-lg font-bold text-[#23283a] mb-2">Account Security & Privacy</div>
              <div className="text-sm text-[#23283a] mb-2">Your personal information is encrypted and never shared. You can update your password and privacy settings at any time.</div>
              <a href="#" className="text-[#D4AF37] underline text-sm">Manage Privacy Settings</a>
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer id="contact" className="w-full text-center text-[#23283a] text-base py-10 border-t border-[#e5e7eb] bg-white mt-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <span>&copy; {new Date().getFullYear()} Moonlight Match</span>
          <span className="hidden md:inline">|</span>
          <a href="mailto:contact@moonlightmatch.com" className="hover:text-[#D4AF37] transition">Contact</a>
          <span className="hidden md:inline">|</span>
          <a href="#" className="hover:text-[#D4AF37] transition">Instagram</a>
        </div>
      </footer>
    </div>
  );
} 