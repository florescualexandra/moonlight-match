'use client';
import React, { useEffect, useState } from 'react';

function MoonLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 28C22.4772 28 18 23.5228 18 18C18 13.5228 21.134 9.85786 25.25 8.4375C25.0833 8.41667 24.9167 8.41667 24.75 8.41667C16.9919 8.41667 10.5 14.9086 10.5 22.6667C10.5 26.134 13.366 29 16.8333 29C21.134 29 24.75 25.384 24.75 21.0833C24.75 20.9167 24.75 20.75 24.7292 20.5833C23.3089 24.6993 19.6438 27.8333 15.1667 27.8333C9.6438 27.8333 5.16667 23.3562 5.16667 17.8333C5.16667 12.3105 9.6438 7.83333 15.1667 7.83333C20.6895 7.83333 25.1667 12.3105 25.1667 17.8333C25.1667 23.3562 20.6895 27.8333 15.1667 27.8333" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    setLoggedIn(typeof window !== 'undefined' && localStorage.getItem('mm_logged_in') === 'true');
  }, []);
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
          {!loggedIn ? (
            <>
              <a href="/login" className="text-[#181c24] bg-[#D4AF37] font-semibold px-5 py-2 rounded-full shadow hover:bg-[#e6c97a] border-2 border-[#D4AF37] transition">Sign In</a>
              <a href="/register" className="text-[#181c24] bg-[#D4AF37] font-semibold px-5 py-2 rounded-full shadow hover:bg-[#e6c97a] border-2 border-[#D4AF37] transition">Register</a>
            </>
          ) : (
            <a href="/user" className="text-[#181c24] bg-[#D4AF37] font-semibold px-5 py-2 rounded-full shadow hover:bg-[#e6c97a] border-2 border-[#D4AF37] transition">Dashboard</a>
          )}
          <a href="#features" className="text-[#D4AF37] font-semibold hover:underline">Features</a>
          <a href="#contact" className="text-[#D4AF37] font-semibold hover:underline">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 bg-[#181c24]">
        <h1 className="text-5xl md:text-6xl font-serif font-extrabold text-white mb-6 tracking-tight">Experience Luxury Matchmaking</h1>
        <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto font-light">
          Welcome to Moonlight Match, an exclusive event for those who seek meaningful connections. Discover curated guests, a luxury experience, and discreet matchmaking under the stars.
        </p>
        <a href="#features" className="inline-block px-10 py-4 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-xl hover:bg-[#e6c97a] transition shadow-lg border-2 border-[#D4AF37]">Get Started</a>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full flex flex-col md:flex-row gap-8 justify-center items-stretch py-16 px-4 bg-white">
        <div className="flex-1 max-w-sm mx-auto bg-white border border-[#D4AF37] rounded-2xl p-10 flex flex-col items-center shadow-lg">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#D4AF37" strokeWidth="1.5" className="mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75v14.5m7.25-7.25H4.75" /></svg>
          <h3 className="text-xl font-serif font-bold text-[#D4AF37] mb-2">Curated Guests</h3>
          <p className="text-[#23283a] text-base text-center">Every attendee is handpicked to ensure a refined, like-minded crowd.</p>
        </div>
        <div className="flex-1 max-w-sm mx-auto bg-white border border-[#D4AF37] rounded-2xl p-10 flex flex-col items-center shadow-lg">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#D4AF37" strokeWidth="1.5" className="mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636" /></svg>
          <h3 className="text-xl font-serif font-bold text-[#D4AF37] mb-2">Luxury Experience</h3>
          <p className="text-[#23283a] text-base text-center">Enjoy a night of elegance, fine music, and gourmet delights in a stunning venue.</p>
        </div>
        <div className="flex-1 max-w-sm mx-auto bg-white border border-[#D4AF37] rounded-2xl p-10 flex flex-col items-center shadow-lg">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#D4AF37" strokeWidth="1.5" className="mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" /></svg>
          <h3 className="text-xl font-serif font-bold text-[#D4AF37] mb-2">Discreet Matchmaking</h3>
          <p className="text-[#23283a] text-base text-center">Our AI ensures your matches are private, personal, and tailored to you.</p>
        </div>
      </section>

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
