"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface PresenceUser {
  userId: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  onlineAt: string;
}

export function usePresence(roomName: string = "clubhub-global") {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceUser>>({});
  const supabase = createClient();

  useEffect(() => {
    if (!user || !profile) return;

    const channel = supabase.channel(`presence-${roomName}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: Record<string, PresenceUser> = {};
        for (const [key, presences] of Object.entries(state)) {
          if (presences && presences.length > 0) {
            const p = presences[0] as any;
            users[key] = {
              userId: key,
              fullName: p.full_name || "Member",
              role: p.role || "member",
              avatarUrl: p.avatar_url,
              onlineAt: p.online_at,
            };
          }
        }
        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (newPresences && newPresences[0]) {
          const p = newPresences[0] as any;
          setOnlineUsers((prev) => ({
            ...prev,
            [key]: {
              userId: key,
              fullName: p.full_name || "Member",
              role: p.role || "member",
              avatarUrl: p.avatar_url,
              onlineAt: p.online_at,
            },
          }));
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setOnlineUsers((prev) => {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            full_name: profile.full_name,
            role: profile.role,
            avatar_url: profile.avatar_url,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.full_name, roomName]);

  return {
    onlineUsers,
    isUserOnline: (userId: string) => !!onlineUsers[userId],
    onlineCount: Object.keys(onlineUsers).length,
  };
}
