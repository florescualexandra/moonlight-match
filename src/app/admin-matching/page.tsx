"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
  formResponse: any;
}

interface Match {
  userId: string;
  matchedUserId: string;
  score: number;
}

export default function AdminMatchingPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [isMatchingComplete, setIsMatchingComplete] = useState(false);
  const [matchesSent, setMatchesSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchUsers();
      checkEventStatus();
    }
  }, [eventId]);

  const checkEventStatus = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) throw new Error("Failed to fetch event status");
      const data = await res.json();
      setIsMatchingComplete(data.event.isMatchingComplete);
      setMatchesSent(data.event.matchesSent);
    } catch (err) {
      console.error("Error checking event status:", err);
      // Not setting a user-facing error for this, as it's a background check
    }
  };

  const startMatching = async () => {
    try {
      setIsMatching(true);
      const res = await fetch(`/api/events/${eventId}/start-matching`, {
        method: "POST"
      });
      const data = await res.json();
      
      if (res.ok) {
        setMatches(data.matches);
        setIsMatchingComplete(true);
      } else {
        setError(data.error || "Failed to start matching");
      }
    } catch (err) {
      setError("Failed to start matching process");
    } finally {
      setIsMatching(false);
    }
  };

  const sendMatches = async () => {
    if (!eventId) return;
    setIsSending(true);
    try {
      // We need admin authorization. For this simple setup, we retrieve it from localStorage.
      const adminProfileStr = localStorage.getItem('mm_user_profile');
      if (!adminProfileStr) {
          throw new Error("Admin user profile not found in local storage.");
      }
      const adminProfile = JSON.parse(adminProfileStr);
      const adminEmail = adminProfile.email;

      const res = await fetch(`/api/events/${eventId}/send-matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail }),
      });

      if (res.ok) {
        setMatchesSent(true);
        alert("Matches have been sent to all users!");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send matches");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsSending(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/users`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users.filter((u: any) => !u.isAdmin));
      } else {
        setError(data.error || "Failed to fetch users");
      }
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const calculateMatchScore = (user1: User, user2: User): number => {
    if (!user1.formResponse || !user2.formResponse) return 0;

    let score = 0;
    const form1 = user1.formResponse;
    const form2 = user2.formResponse;

    // Example matching criteria - adjust based on your form fields
    if (form1.interests && form2.interests) {
      const commonInterests = form1.interests.filter((interest: string) =>
        form2.interests.includes(interest)
      );
      score += commonInterests.length * 2;
    }

    if (form1.personality && form2.personality) {
      const personalityDiff = Math.abs(
        parseInt(form1.personality) - parseInt(form2.personality)
      );
      score += (5 - personalityDiff) * 2;
    }

    if (form1.activities && form2.activities) {
      const commonActivities = form1.activities.filter((activity: string) =>
        form2.activities.includes(activity)
      );
      score += commonActivities.length * 3;
    }

    return score;
  };

  const generateMatches = () => {
    setIsMatching(true);
    const newMatches: Match[] = [];

    // Create a copy of users array to track who's been matched
    const availableUsers = [...users];

    while (availableUsers.length >= 2) {
      const user1 = availableUsers[0];
      let bestMatch = null;
      let bestScore = -1;

      // Find the best match for user1
      for (let i = 1; i < availableUsers.length; i++) {
        const user2 = availableUsers[i];
        const score = calculateMatchScore(user1, user2);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = { user: user2, index: i };
        }
      }

      if (bestMatch) {
        newMatches.push({
          userId: user1.id,
          matchedUserId: bestMatch.user.id,
          score: bestScore
        });

        // Remove matched users from available users
        availableUsers.splice(bestMatch.index, 1);
        availableUsers.shift();
      } else {
        // If no match found, remove the first user
        availableUsers.shift();
      }
    }

    setMatches(newMatches);
    setIsMatching(false);
  };

  const saveMatches = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save matches");
      }

      alert("Matches saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save matches");
    }
  };

  if (!eventId) {
    return (
      <div className="min-h-screen bg-[#181c24] flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">No Event Selected</h1>
          <p>Please select an event from the events page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col items-center px-4 py-16">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-8">
          Admin Matching
        </h1>

        {loading ? (
          <div className="text-white text-center">Loading users...</div>
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-serif font-bold text-[#D4AF37] mb-4">
                Users ({users.length})
              </h2>
              <div className="grid gap-4">
                {users.map(user => (
                  <div
                    key={user.id}
                    className="bg-white rounded-2xl shadow-2xl p-6"
                  >
                    <h3 className="text-lg font-bold text-[#181c24]">
                      {user.name || "Anonymous"}
                    </h3>
                    <p className="text-[#23283a]">{user.email}</p>
                  </div>
                ))}
              </div>
            </div>

            {!isMatchingComplete && !matchesSent && (
              <div className="flex justify-center mb-8">
                <button
                  onClick={startMatching}
                  disabled={isMatching || users.length < 2}
                  className="px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold hover:bg-[#e6c97a] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMatching ? "Starting Matching..." : "Start Matching"}
                </button>
              </div>
            )}
            
            {isMatchingComplete && !matchesSent && (
               <div className="flex justify-center mb-8">
                 <button
                   onClick={sendMatches}
                   disabled={isSending}
                   className="px-6 py-3 rounded-full bg-green-500 text-white font-bold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isSending ? "Sending Matches..." : "Send Top 3 Matches to Users"}
                 </button>
               </div>
            )}

            {matchesSent && (
                <div className="text-center text-green-400 font-bold p-4 rounded-lg bg-green-900/50 border border-green-500">
                    Matches have already been sent for this event.
                </div>
            )}

            {isMatchingComplete && matches.length > 0 && (
              <div>
                <h2 className="text-xl font-serif font-bold text-[#D4AF37] mb-4">
                  Generated Matches ({matches.length})
                </h2>
                <div className="grid gap-4">
                  {matches.map((match, index) => {
                    const user1 = users.find(u => u.id === match.userId);
                    const user2 = users.find(u => u.id === match.matchedUserId);

                    return (
                      <div
                        key={index}
                        className="bg-white rounded-2xl shadow-2xl p-6"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-bold text-[#181c24]">
                              {user1?.name || "Anonymous"} ↔{" "}
                              {user2?.name || "Anonymous"}
                            </h3>
                            <p className="text-[#23283a]">
                              Match Score: {match.score}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}