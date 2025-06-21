"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const events = [
  {
    id: "moonlight-gala",
    title: "Moonlight Gala",
    date: "2024-07-12",
    location: "Skyline Ballroom, Grand Hotel",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    description: "An exclusive gala under the stars for meaningful connections."
  },
  {
    id: "starlit-soiree",
    title: "Starlit Soirée",
    date: "2024-08-02",
    location: "Rooftop Garden, City Center",
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
    description: "A chic evening of music, mingling, and luxury matchmaking."
  },
  {
    id: "elegance-evening",
    title: "Evening of Elegance",
    date: "2024-09-15",
    location: "Crystal Hall, Palace Venue",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80",
    description: "A refined event for curated guests and unforgettable moments."
  },
];

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const event = events.find(e => e.id === eventId);
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181c24]">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-4">Event Not Found</h1>
          <Link href="/events" className="text-[#D4AF37] underline">Back to Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 flex flex-col md:flex-row gap-8">
        <img src={event.image} alt={event.title} className="w-full md:w-80 h-64 object-cover rounded-xl shadow" />
        <div className="flex-1 flex flex-col">
          <h1 className="text-3xl font-serif font-bold text-[#181c24] mb-2">{event.title}</h1>
          <div className="text-[#D4AF37] font-semibold mb-1">{new Date(event.date).toLocaleDateString()}</div>
          <div className="text-[#23283a] mb-3">{event.location}</div>
          <p className="text-[#23283a] mb-6">{event.description}</p>
          {!purchased ? (
            <button
              className="px-8 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37] mt-auto"
              disabled={loading}
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  setPurchased(true);
                  setLoading(false);
                }, 1200);
              }}
            >
              {loading ? "Processing..." : "Purchase Ticket"}
            </button>
          ) : (
            <Link
              href={`/event/${event.id}/qr`}
              className="inline-block px-8 py-3 rounded-full bg-[#181c24] text-[#D4AF37] font-bold text-lg hover:bg-[#23283a] transition border-2 border-[#D4AF37] mt-auto text-center"
            >
              View My QR Code
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 