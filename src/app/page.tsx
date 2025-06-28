import Link from 'next/link';

function MoonLogo() {
  return (
    <span className="text-3xl font-bold text-[#D4AF37] mr-2">🌙</span>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181c24] to-[#23283a] flex flex-col">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-8 py-4 border-b border-[#D4AF37]/40 bg-[#181c24]">
        <div className="flex items-center gap-2">
          <MoonLogo />
          <span className="text-2xl font-bold text-[#D4AF37] font-serif tracking-wide">Moonlight</span>
        </div>
        <div className="flex gap-8 items-center">
          <Link href="/" className="text-lg font-semibold text-[#D4AF37] hover:text-white transition">Home</Link>
          <Link href="/user" className="text-lg font-semibold text-[#D4AF37] hover:text-white transition">Dashboard</Link>
          <Link href="/matches" className="text-lg font-semibold text-[#D4AF37] hover:text-white transition">Matches</Link>
        </div>
        <button className="px-6 py-2 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] font-semibold bg-transparent hover:bg-[#D4AF37]/10 transition">Log Out</button>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 py-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#D4AF37] font-serif mb-6 text-center">Moonlight Match</h1>
        <p className="text-xl md:text-2xl text-white text-center mb-2 max-w-2xl">An exclusive event for those who seek meaningful connections.</p>
        <p className="text-xl md:text-2xl text-white text-center mb-8 max-w-2xl">Experience luxury matchmaking under the stars.</p>
        <Link href="/login" className="px-8 py-4 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-xl hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37]">Get Started</Link>
      </section>

      {/* Features Section */}
      <section className="w-full flex flex-col items-center pb-20">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {/* Card 1 */}
          <div className="bg-gradient-to-b from-[#23283a]/80 to-[#181c24]/80 rounded-2xl border border-[#D4AF37] p-8 flex flex-col items-center shadow-lg">
            <span className="text-4xl text-[#D4AF37] mb-4">+</span>
            <h3 className="text-2xl font-bold text-[#D4AF37] font-serif mb-2">Curated Guests</h3>
            <p className="text-white text-center">Every attendee is handpicked to ensure a refined, like-minded crowd.</p>
          </div>
          {/* Card 2 */}
          <div className="bg-gradient-to-b from-[#23283a]/80 to-[#181c24]/80 rounded-2xl border border-[#D4AF37] p-8 flex flex-col items-center shadow-lg">
            <span className="text-4xl text-[#D4AF37] mb-4">×</span>
            <h3 className="text-2xl font-bold text-[#D4AF37] font-serif mb-2">Luxury Experience</h3>
            <p className="text-white text-center">Enjoy a night of elegance, fine music, and gourmet delights in a stunning venue.</p>
          </div>
          {/* Card 3 */}
          <div className="bg-gradient-to-b from-[#23283a]/80 to-[#181c24]/80 rounded-2xl border border-[#D4AF37] p-8 flex flex-col items-center shadow-lg">
            <span className="text-4xl text-[#D4AF37] mb-4">∟</span>
            <h3 className="text-2xl font-bold text-[#D4AF37] font-serif mb-2">Discreet Matchmaking</h3>
            <p className="text-white text-center">Our AI ensures your matches are private, personal, and tailored to you.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
