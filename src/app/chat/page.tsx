"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Chat {
  id: string;
  match: {
    user: { id: string; name: string | null };
    matchedUser: { id: string; name: string | null };
  };
  messages: { content: string; createdAt: string, sender: { name: string | null } }[];
}

export default function ChatListPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string, email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const profileStr = localStorage.getItem('mm_user_profile');
    if (profileStr) {
      const profile = JSON.parse(profileStr);
      setCurrentUser(profile);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchChats = async () => {
      try {
        const res = await fetch(`/api/chats?email=${encodeURIComponent(currentUser.email)}`);
        if (res.ok) {
          const data = await res.json();
          setChats(data.chats);
        } else {
          setError('Failed to fetch chats.');
        }
      } catch (err) {
        setError('An error occurred while fetching chats.');
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [currentUser]);

  if (loading) return <div className="text-center text-white p-10">Loading chats...</div>;
  if (error) return <div className="text-center text-red-500 p-10">{error}</div>;

  const getOtherParticipant = (chat: Chat) => {
    if (!currentUser) return null;
    return chat.match.user.id === currentUser.id ? chat.match.matchedUser : chat.match.user;
  };
  
  return (
    <div className="min-h-screen bg-[#181c24] p-8">
      <h1 className="text-4xl font-serif font-bold text-[#D4AF37] mb-8 text-center">Your Conversations</h1>
      <div className="max-w-2xl mx-auto bg-white/5 rounded-2xl shadow-lg p-4">
        {chats.length > 0 ? (
          <ul className="divide-y divide-white/20">
            {chats.map(chat => {
              const otherUser = getOtherParticipant(chat);
              const lastMessage = chat.messages[0];
              return (
                <li key={chat.id} className="p-4 hover:bg-white/10 rounded-lg transition">
                  <Link href={`/chat/${chat.id}`}>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {/* Placeholder for avatar */}
                        <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#181c24] font-bold text-xl">
                          {otherUser?.name?.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-white truncate">{otherUser?.name}</p>
                        <p className="text-sm text-white/60 truncate">
                          {lastMessage ? `${lastMessage.sender.name}: ${lastMessage.content}` : 'No messages yet...'}
                        </p>
                      </div>
                      {lastMessage && <p className="text-xs text-white/50">{new Date(lastMessage.createdAt).toLocaleTimeString()}</p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center text-white p-10">
            <p>You have no active conversations. Go make some matches!</p>
          </div>
        )}
      </div>
    </div>
  );
} 