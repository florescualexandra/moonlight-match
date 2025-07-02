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
          <span className="text-2xl font-bold text-[#D4AF37] font-serif tracking-wide">Moonlight Match</span>
        </div>
        <div className="flex gap-6 items-center">
          <Link href="/events" className="text-lg font-semibold text-[#D4AF37] hover:text-white transition">Events</Link>
          <Link href="/chats" className="text-lg font-semibold text-[#D4AF37] hover:text-white transition">My Chats</Link>
          <a href="#features" className="text-lg font-semibold text-[#D4AF37] hover:text-white transition">Features</a>
          <a href="#contact" className="text-lg font-semibold text-[#D4AF37] hover:text-white transition">Contact</a>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/login" className="px-6 py-2 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] font-semibold bg-transparent hover:bg-[#D4AF37]/10 transition">Sign In</Link>
          <Link href="/register" className="px-6 py-2 rounded-full bg-[#D4AF37] text-[#181c24] font-semibold border-2 border-[#D4AF37] hover:bg-[#e6c97a] transition">Register</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 py-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#D4AF37] font-serif mb-6 text-center">Experience Luxury Matchmaking</h1>
        <p className="text-xl md:text-2xl text-white text-center mb-2 max-w-2xl">Welcome to Moonlight Match, an exclusive event for those who seek meaningful connections. Discover curated guests, a luxury experience, and discreet matchmaking under the stars.</p>
        <Link href="/register" className="mt-8 px-8 py-4 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-xl hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37]">Get Started</Link>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full flex flex-col items-center pb-20 bg-white">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 px-4 py-16">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-[#D4AF37] p-8 flex flex-col items-center shadow-lg">
            <span className="text-4xl text-[#D4AF37] mb-4">+</span>
            <h3 className="text-2xl font-bold text-[#D4AF37] font-serif mb-2">Curated Guests</h3>
            <p className="text-[#23283a] text-center">Every attendee is handpicked to ensure a refined, like-minded crowd.</p>
          </div>
          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-[#D4AF37] p-8 flex flex-col items-center shadow-lg">
            <span className="text-4xl text-[#D4AF37] mb-4">&#9733;</span>
            <h3 className="text-2xl font-bold text-[#D4AF37] font-serif mb-2">Luxury Experience</h3>
            <p className="text-[#23283a] text-center">Enjoy a night of elegance, fine music, and gourmet delights in a stunning venue.</p>
          </div>
          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-[#D4AF37] p-8 flex flex-col items-center shadow-lg">
            <span className="text-4xl text-[#D4AF37] mb-4">&#9673;</span>
            <h3 className="text-2xl font-bold text-[#D4AF37] font-serif mb-2">Discreet Matchmaking</h3>
            <p className="text-[#23283a] text-center">Our AI ensures your matches are private, personal, and tailored to you.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="w-full text-center text-[#23283a] text-base py-10 bg-white border-t border-[#e5e7eb]">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <span>&copy; {new Date().getFullYear()} Moonlight Match</span>
          <span className="hidden md:inline">|</span>
          <a href="mailto:contact@moonlightmatch.com" className="hover:text-[#D4AF37] transition">Contact</a>
          <span className="hidden md:inline">|</span>
          <a href="tel:+40732733512" className="hover:text-[#D4AF37] transition">+40 732 733 512</a>
          <span className="hidden md:inline">|</span>
          <a href="#" className="hover:text-[#D4AF37] transition">Instagram</a>
        </div>
      </footer>
    </div>
  );
}
