import Link from 'next/link';
import { useRef } from 'react';

function MoonLogo() {
  return (
    <span className="text-3xl font-bold text-[#D4AF37] mr-2">🌙</span>
  );
}

const events = [
  {
    id: 'moonlight-gala',
    title: 'Moonlight Gala',
    date: '2024-07-12',
    location: 'Skyline Ballroom, Grand Hotel',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    description: 'An exclusive gala under the stars for meaningful connections.'
  },
  {
    id: 'starlit-soiree',
    title: 'Starlit Soirée',
    date: '2024-08-02',
    location: 'Rooftop Garden, City Center',
    image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80',
    description: 'A chic evening of music, mingling, and luxury matchmaking.'
  },
  {
    id: 'elegance-evening',
    title: 'Evening of Elegance',
    date: '2024-09-15',
    location: 'Crystal Hall, Palace Venue',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
    description: 'A refined event for curated guests and unforgettable moments.'
  },
];

export default function Home() {
  const eventsRef = useRef<HTMLDivElement>(null);

  const handleSeeEvents = () => {
    eventsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        <button
          onClick={handleSeeEvents}
          className="mt-8 px-8 py-4 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-xl hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37]"
        >
          See Events
        </button>
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

      {/* Upcoming Events Section */}
      <section ref={eventsRef} className="w-full flex flex-col items-center bg-[#181c24] py-16">
        <h2 className="text-3xl font-serif font-bold text-[#D4AF37] mb-10 text-center">Upcoming Events</h2>
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-10 px-4">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <img src={event.image} alt={event.title} className="w-full h-48 object-cover" />
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-2xl font-serif font-bold text-[#181c24] mb-2">{event.title}</h3>
                <div className="text-[#D4AF37] font-semibold mb-1">{new Date(event.date).toLocaleDateString()}</div>
                <div className="text-[#23283a] mb-3">{event.location}</div>
                <p className="text-[#23283a] mb-4 flex-1">{event.description}</p>
                <Link
                  href={`/event/${event.id}`}
                  className="inline-block px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37] mt-auto text-center"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="w-full text-center text-[#23283a] text-base py-10 bg-white border-t border-[#e5e7eb]">
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
