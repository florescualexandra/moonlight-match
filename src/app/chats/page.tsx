"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ChatItem {
  chatId: string;
  otherUserName: string | null;
  otherUserImage: string | null;
  lastMessage: string;
  lastMessageTimestamp: string;
}

const ChatListItem = ({ chat }: { chat: ChatItem }) => (
  <Link href={`/chat/${chat.chatId}`} className="block w-full">
    <div className="flex items-center p-4 bg-white/10 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition duration-300">
      <img
        src={chat.otherUserImage || '/default-avatar.png'}
        alt={chat.otherUserName || 'User'}
        className="w-16 h-16 rounded-full object-cover mr-4"
      />
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">{chat.otherUserName || 'Anonymous'}</h3>
          <p className="text-xs text-white/60">{new Date(chat.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <p className="text-white/80 truncate">{chat.lastMessage}</p>
      </div>
    </div>
  </Link>
);

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem('mm_email');
    if (!email) {
      router.push('/login');
      return;
    }

    const fetchChats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/chats?email=${encodeURIComponent(email)}`);
        if (!res.ok) {
          throw new Error('Failed to fetch chats');
        }
        const data = await res.json();
        setChats(data.chats);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [router]);

  if (loading) return <div className="text-center text-white p-10">Loading your chats...</div>;
  if (error) return <div className="text-center text-red-500 p-10">{error}</div>;

  return (
    <div className="min-h-screen bg-[#181c24] p-8">
      <h1 className="text-4xl font-serif font-bold text-[#D4AF37] mb-8 text-center">My Chats</h1>
      <div className="max-w-4xl mx-auto">
        {chats.length > 0 ? (
          <div className="space-y-4">
            {chats.map(chat => (
              <ChatListItem key={chat.chatId} chat={chat} />
            ))}
          </div>
        ) : (
          <div className="text-center bg-white/5 rounded-2xl p-10">
            <p className="text-white text-lg">You have no active conversations yet.</p>
            <p className="text-white/70 mt-2">When you start a chat with one of your matches, it will appear here.</p>
            <Link href="/matches" className="mt-6 inline-block px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold hover:bg-[#e6c97a] transition">
              View Your Matches
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 