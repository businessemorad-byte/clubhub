"use client";

import { useAuth } from "@/context/AuthContext";
import { getInitials, getRoleBadgeClass, getRoleDisplayName } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

export function UserStatusFooter() {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="h-[56px] bg-[#232428] px-2 flex items-center justify-between border-t border-[#1e1f22]">
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
        {/* Avatar with online dot */}
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#5865f2] text-white flex items-center justify-center font-semibold text-xs uppercase shadow">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(profile.full_name)
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#23a55a] border-2 border-[#232428] rounded-full" />
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white truncate leading-tight">
            {profile.full_name}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold tracking-wider ${getRoleBadgeClass(
                profile.role
              )}`}
            >
              {getRoleDisplayName(profile.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Logout button */}
      <form action={logoutAction}>
        <button
          type="submit"
          className="p-1.5 text-[#949ba4] hover:text-red-400 hover:bg-[#35373c] rounded transition duration-150"
          title="Log Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
