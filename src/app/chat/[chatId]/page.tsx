"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Message {
  id: string;
  content: string;
  sender: { id: string; name?: string; image?: string };
  createdAt: string;
}

interface Chat {
  id: string;
  match: {
    id: string;
    userId: string;
    matchedUserId: string;
    user: { name?: string; email?: string; image?: string } | null;
    matchedUser: { name?: string; email?: string; image?: string } | null;
  };
}

export default function ChatRoomPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get userId from localStorage (replace with real auth in production)
  let userId: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const profile = JSON.parse(localStorage.getItem("mm_user_profile") || '{}');
      userId = profile.id || null;
      if (!userId) {
        console.warn("No userId found in mm_user_profile:", profile);
      }
    } catch (e) {
      console.warn("Failed to parse mm_user_profile from localStorage", e);
      userId = null;
    }
  }

  // Fetch chat info and messages
  useEffect(() => {
    if (!userId || !chatId) {
      setError("You must be logged in to view this chat. Please log in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/chats?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.chats) {
          const found = data.chats.find((c: Chat) => c.id === chatId);
          setChat(found || null);
        }
      });
    fetch(`/api/chats/${chatId}/messages?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages) setMessages(data.messages);
        else setError(data.error || "Failed to load messages");
      })
      .catch(() => setError("Failed to load messages"))
      .finally(() => setLoading(false));
  }, [userId, chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chats/${chatId}/messages?userId=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages(msgs => [...msgs, data.message]);
        setInput("");
      } else {
        setError(data.error || "Failed to send message");
      }
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!userId) {
    return <div className="text-center text-red-500 p-10">You must be logged in to view this chat. Please log in again.</div>;
  }
  if (loading) {
    return <div className="text-center text-white p-10">Loading chat...</div>;
  }
  if (error) {
    return <div className="text-center text-red-500 p-10">{error}</div>;
  }
  if (!chat) {
    return <div className="text-center text-white p-10">Chat not found or you are not a participant.</div>;
  }

  // Show the other user's info
  const isUserA = chat.match.userId === userId;
  const other = isUserA ? chat.match.matchedUser : chat.match.user;

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col">
      <div className="bg-[#23283a] flex items-center gap-4 px-6 py-4 border-b border-[#D4AF37]/30">
        <button onClick={() => router.push('/chats')} className="text-[#D4AF37] text-2xl font-bold mr-2">&#8592;</button>
        <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-lg font-bold text-[#181c24] overflow-hidden">
          {other?.image ? (
            <img src={other.image} alt={other.name || "User"} className="w-full h-full object-cover rounded-full" />
          ) : (
            (other?.name?.[0] || "?").toUpperCase()
          )}
        </div>
        <div className="text-lg font-semibold text-white">{other?.name || other?.email || "Anonymous"}</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center text-white">No messages yet. Start the conversation!</div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender.id === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.sender.id === userId ? 'bg-[#D4AF37] text-[#181c24]' : 'bg-[#23283a] text-white'} shadow`}
                  title={new Date(msg.createdAt).toLocaleString()}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <form
        className="flex items-center gap-2 p-4 border-t border-[#D4AF37]/30 bg-[#181c24] max-w-2xl mx-auto w-full"
        onSubmit={e => { e.preventDefault(); handleSend(); }}
      >
        <input
          className="flex-1 rounded-full px-4 py-2 bg-[#23283a] text-white border border-[#D4AF37]/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          className="px-6 py-2 rounded-full bg-[#D4AF37] text-[#181c24] font-bold hover:bg-[#e6c97a] transition border-2 border-[#D4AF37] disabled:opacity-50"
          disabled={sending || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
} 