"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
  };
}

export default function ChatRoomPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const params = useParams();
  const chatId = params.chatId as string;
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const profileStr = localStorage.getItem('mm_user_profile');
    if (profileStr) {
      setCurrentUser(JSON.parse(profileStr));
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!chatId) return;
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      } else {
        setError('Failed to fetch messages.');
      }
    } catch (err) {
      setError('An error occurred while fetching messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(); // Initial fetch
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage, senderId: currentUser.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      } else {
        alert('Failed to send message.');
      }
    } catch (err) {
      alert('An error occurred while sending the message.');
    }
  };

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col p-4 md:p-8">
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto bg-white/5 rounded-2xl shadow-lg overflow-hidden">
        <header className="bg-white/10 p-4 border-b border-white/20">
            <Link href="/chat" className="text-[#D4AF37] hover:underline">
                &larr; Back to Conversations
            </Link>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
            {loading && <div className="text-center text-white">Loading messages...</div>}
            {error && <div className="text-center text-red-500">{error}</div>}
            <div className="space-y-4">
            {messages.map(msg => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl max-w-sm md:max-w-md ${msg.sender.id === currentUser?.id ? 'bg-[#D4AF37] text-[#181c24]' : 'bg-white/20 text-white'}`}>
                        <p className="font-bold text-sm">{msg.sender.name}</p>
                        <p>{msg.content}</p>
                        <p className="text-xs opacity-70 text-right mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
            </div>
        </main>
        <footer className="p-4 bg-white/5 border-t border-white/20">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 rounded-full bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
            <button type="submit" className="px-6 py-2 rounded-full bg-[#D4AF37] text-[#181c24] font-bold hover:bg-[#e6c97a] transition">
              Send
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
} 