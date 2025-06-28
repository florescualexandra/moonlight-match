import Link from 'next/link';

function MoonLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 28C22.4772 28 18 23.5228 18 18C18 13.5228 21.134 9.85786 25.25 8.4375C25.0833 8.41667 24.9167 8.41667 24.75 8.41667C16.9919 8.41667 10.5 14.9086 10.5 22.6667C10.5 26.134 13.366 29 16.8333 29C21.134 29 24.75 25.384 24.75 21.0833C24.75 20.9167 24.75 20.75 24.7292 20.5833C23.3089 24.6993 19.6438 27.8333 15.1667 27.8333C9.6438 27.8333 5.16667 23.3562 5.16667 17.8333C5.16667 12.3105 9.6438 7.83333 15.1667 7.83333C20.6895 7.83333 25.1667 12.3105 25.1667 17.8333C25.1667 23.3562 20.6895 27.8333 15.1667 27.8333" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#181c24] flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 bg-white/5 rounded-3xl shadow-2xl px-10 py-16 max-w-xl w-full mt-24">
        <div className="flex flex-col items-center gap-2 mb-4">
          <MoonLogo />
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#D4AF37] mb-2 mt-2">Moonlight Match</h1>
        </div>
        <p className="text-lg text-[#D4AF37] mb-6 text-center">Get started by logging in or browsing events. Experience luxury matchmaking for unforgettable connections.</p>
        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
          <Link href="/matches" className="px-8 py-4 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-xl hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37] text-center">See your matches</Link>
          <Link href="/admin-matching" className="px-8 py-4 rounded-full bg-transparent text-[#D4AF37] font-bold text-xl hover:bg-[#D4AF37]/10 transition shadow border-2 border-[#D4AF37] text-center">Admin Matching</Link>
        </div>
      </div>
      <footer className="w-full text-center text-[#23283a] text-base py-10 mt-16">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <span>&copy; {new Date().getFullYear()} Moonlight Match</span>
          <span className="hidden md:inline">|</span>
          <a href="mailto:contact@moonlightmatch.com" className="hover:text-[#D4AF37] transition">Contact</a>
          <span className="hidden md:inline">|</span>
          <a href="#" className="hover:text-[#D4AF37] transition">Instagram</a>
        </div>
      </footer>
    </main>
  );
}
