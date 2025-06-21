"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Message {
  from: number;
  text: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { matchId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMessages();
    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [matchId]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${matchId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
        setLoading(false);
      } else {
        setError(data.error || "Failed to fetch messages");
      }
    } catch (err) {
      setError("Failed to fetch messages");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`/api/chat/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([...messages, data.message]);
        setNewMessage("");
      } else {
        setError(data.error || "Failed to send message");
      }
    } catch (err) {
      setError("Failed to send message");
    }
  };

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col">
      <div className="flex-1 max-w-4xl w-full mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-2xl h-[calc(100vh-8rem)] flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-serif font-bold text-[#D4AF37]">Chat with Match</h1>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="text-center text-[#23283a]">Loading messages...</div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-[#23283a]">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.from === 1 ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-3 ${
                      msg.from === 1
                        ? "bg-[#D4AF37] text-[#181c24]"
                        : "bg-[#23283a] text-white"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-full border-2 border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#181c24]"
              />
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-[#D4AF37] text-[#181c24] font-bold hover:bg-[#e6c97a] transition"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 