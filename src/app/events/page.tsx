'use client';
import React from 'react';
import Link from 'next/link';

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

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#181c24] py-16 px-4">
      <h1 className="text-4xl font-serif font-bold text-[#D4AF37] text-center mb-12">Upcoming Events</h1>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <img src={event.image} alt={event.title} className="w-full h-48 object-cover" />
            <div className="p-6 flex flex-col flex-1">
              <h2 className="text-2xl font-serif font-bold text-[#181c24] mb-2">{event.title}</h2>
              <div className="text-[#D4AF37] font-semibold mb-1">{new Date(event.date).toLocaleDateString()}</div>
              <div className="text-[#23283a] mb-3">{event.location}</div>
              <p className="text-[#23283a] mb-4 flex-1">{event.description}</p>
              <Link
                href={`/event/${event.id}`}
                className="inline-block px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37] mt-auto"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 