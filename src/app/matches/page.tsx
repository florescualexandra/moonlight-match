"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { useSearchParams, useRouter } from 'next/navigation';

interface Match {
  id: string;
  matchedUser: {
    id: string;
    name: string | null;
    formResponse: any; 
  };
  score: number;
  isInitiallyRevealed: boolean;
  isPaidReveal: boolean;
}

interface Event {
    id: string;
    matchesSent: boolean;
}

const MatchCard = ({ match, onChatClick }: { match: Match, onChatClick: (matchId: string) => void }) => (
  <div className="bg-white/10 rounded-2xl shadow-lg p-6 backdrop-blur-sm border border-white/20 flex flex-col">
    <h3 className="text-2xl font-bold text-[#D4AF37]">{match.matchedUser.name || 'Anonymous'}</h3>
    <p className="text-white/80 mb-4">Compatibility Score: {Math.round(match.score * 100)}%</p>
    <div className="flex-grow"></div>
    <button 
        onClick={() => onChatClick(match.id)}
        className="mt-4 w-full px-4 py-2 rounded-full bg-[#D4AF37] text-[#181c24] font-bold hover:bg-[#e6c97a] transition"
    >
        Chat Now
    </button>
  </div>
);

const BlurredMatchCard = ({ onRevealClick }: { onRevealClick: () => void }) => (
    <div className="relative bg-white/10 rounded-2xl shadow-lg p-6 border border-white/20">
        <div className="blur-md">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">A Potential Match</h3>
            <p className="text-transparent">Compatibility Score: XX%</p>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-2xl">
            <p className="text-white font-bold text-lg">Reveal more matches</p>
            <button onClick={onRevealClick} className="mt-2 px-4 py-2 rounded-full bg-[#D4AF37] text-[#181c24] font-bold hover:bg-[#e6c97a] transition">
                Pay to Reveal
            </button>
        </div>
    </div>
);

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();


  useEffect(() => {
    const email = localStorage.getItem('mm_email');
    const profileStr = localStorage.getItem('mm_user_profile');
    if (email && profileStr) {
      setUserEmail(email);
      setUserId(JSON.parse(profileStr).id);
    } else {
      setError("You must be logged in to view matches.");
      setLoading(false);
    }

    const sessionId = searchParams.get('session_id');
    if (sessionId) {
        setPaymentStatus('success');
    }

  }, [searchParams]);

  const handleChatClick = async (matchId: string) => {
    try {
        const res = await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId })
        });
        const { chat } = await res.json();
        if (chat && chat.id) {
            router.push(`/chat/${chat.id}`);
        } else {
            throw new Error('Failed to create or retrieve chat session.');
        }
    } catch (err) {
        setError('Could not start chat session. Please try again.');
        console.error(err);
    }
  };

  const handleRevealClick = async () => {
    if (!userId) {
      setError("User not identified. Please log in again.");
      return;
    }
    try {
        const res = await fetch('/api/payment/create-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        const { sessionId } = await res.json();
        if (!sessionId) {
            throw new Error('Failed to create payment session.');
        }

        const stripe = await stripePromise;
        if (stripe) {
            await stripe.redirectToCheckout({ sessionId });
        }
    } catch (err) {
        setError('Payment failed. Please try again.');
        console.error(err);
    }
  };

  useEffect(() => {
    if (!userEmail) return;

    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/user/matches?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (res.ok) {
          setMatches(data.matches);
          setEvent(data.event);
        } else {
          setError(data.error || 'Failed to fetch matches.');
        }
      } catch (err) {
        setError('An error occurred while fetching matches.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [userEmail, paymentStatus]);

  if (loading) return <div className="text-center text-white p-10">Loading your matches...</div>;
  if (error) return <div className="text-center text-red-500 p-10">{error}</div>;

  if (!event || !event.matchesSent) {
    return (
        <div className="min-h-screen bg-[#181c24] flex flex-col items-center justify-center text-white text-center px-4">
            <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-4">Patience, Young Grasshopper</h1>
            <p className="text-lg max-w-2xl">Matches for this event have not been released yet. The admin is working their magic! Please check back soon.</p>
             <Link href="/user" className="mt-8 px-8 py-4 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-xl hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37] text-center">
                Back to Dashboard
            </Link>
        </div>
    );
  }

  const revealedMatches = matches.filter(m => m.isInitiallyRevealed || m.isPaidReveal);
  const hiddenMatches = matches.filter(m => !m.isInitiallyRevealed && !m.isPaidReveal);


  return (
    <div className="min-h-screen bg-[#181c24] p-8">
       {paymentStatus === 'success' && (
        <div className="bg-green-500 text-white text-center p-3 rounded-lg mb-8">
          Payment successful! Your new matches should now be visible.
        </div>
      )}
      <h1 className="text-4xl font-serif font-bold text-[#D4AF37] mb-8 text-center">Your Matches</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {revealedMatches.map(match => (
          <MatchCard key={match.id} match={match} onChatClick={handleChatClick} />
        ))}
        {hiddenMatches.map((match) => (
            <BlurredMatchCard key={`hidden-${match.id}`} onRevealClick={handleRevealClick} />
        ))}
        {matches.length === 0 && (
             <div className="col-span-full text-center text-white p-10">
                <p>No matches found for you in this event yet. Stay tuned!</p>
            </div>
        )}
      </div>
    </div>
  );
} 