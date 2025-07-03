"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Chat {
  id: string;
  match: {
    id: string;
    userId: string;
    matchedUserId: string;
    user: { name?: string; image?: string } | null;
    matchedUser: { name?: string; image?: string } | null;
  };
}

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Get userId from localStorage (replace with real auth in production)
  const userId = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("mm_user_profile") || '{}').id : null;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/chats?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.chats) setChats(data.chats);
        else setError(data.error || "Failed to load chats");
      })
      .catch(() => setError("Failed to load chats"))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) {
    return <div className="text-center text-white p-10">Please log in to view your chats.</div>;
  }

  return (
    <div className="min-h-screen bg-[#181c24] py-10 px-4">
      <button
        className="mb-4 px-6 py-2 rounded-full bg-[#D4AF37] text-[#181c24] font-bold hover:bg-[#e6c97a] transition border-2 border-[#D4AF37]"
        onClick={() => router.push('/user')}
      >
        &larr; Back to Dashboard
      </button>
      <h1 className="text-3xl font-bold text-[#D4AF37] mb-8 text-center">My Chats</h1>
      {loading ? (
        <div className="text-white text-center">Loading chats...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : chats.length === 0 ? (
        <div className="text-white text-center">No chats yet. Start a conversation with your matches!</div>
      ) : (
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {chats.map(chat => {
            // Show the other user's info
            const isUserA = chat.match.userId === userId;
            const other = isUserA ? chat.match.matchedUser : chat.match.user;
            return (
              <div
                key={chat.id}
                className="bg-[#23283a] rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-[#2c3142] transition"
                onClick={() => router.push(`/chat/${chat.id}`)}
              >
                <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center text-xl font-bold text-[#181c24] overflow-hidden">
                  {other?.image ? (
                    <img src={other.image} alt={other.name || "User"} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    (other?.name?.[0] || "?").toUpperCase()
                  )}
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">{other?.name || "User"}</div>
                  <div className="text-sm text-[#D4AF37]">Click to open chat</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 