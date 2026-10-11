"use client";

import { useState } from "react";
import { generateInviteAction, revokeInviteAction } from "@/app/actions/invites";
import { Invitation, UserRole } from "@/types";
import { getRoleBadgeClass, getRoleDisplayName, formatDateTime } from "@/lib/utils";
import {
  Key,
  Copy,
  Check,
  Trash2,
  Plus,
  Loader2,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface InviteManagerProps {
  initialInvites: Invitation[];
}

export function InviteManager({ initialInvites }: InviteManagerProps) {
  const [invites, setInvites] = useState<Invitation[]>(initialInvites);
  const [selectedRole, setSelectedRole] = useState<UserRole>("member");
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("role", selectedRole);
    formData.append("expiresInDays", expiresInDays.toString());

    const result = await generateInviteAction(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.invite) {
      setInvites([result.invite, ...invites]);
    }
    setLoading(false);
  };

  const handleRevoke = async (code: string) => {
    if (!confirm(`Revoke invitation code ${code}?`)) return;

    const result = await revokeInviteAction(code);
    if (result.error) {
      alert(result.error);
    } else {
      setInvites(invites.filter((inv) => inv.code !== code));
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const activeInvites = invites.filter(
    (inv) => !inv.used_by && new Date(inv.expires_at) > new Date()
  );
  const usedOrExpiredInvites = invites.filter(
    (inv) => inv.used_by || new Date(inv.expires_at) <= new Date()
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3f4147]">
        <div className="p-3 bg-[#5865f2]/20 border border-[#5865f2]/40 rounded-xl text-[#5865f2]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Invitation Keys Manager
          </h1>
          <p className="text-sm text-[#949ba4]">
            Generate restricted registration keys for new members and assign their initial club role.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Generator Card */}
      <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl p-5 mb-8 shadow-lg">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#b5bac1] mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-[#5865f2]" />
          <span>Generate New Invitation Key</span>
        </h2>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-[#949ba4] mb-1.5 uppercase">
              Target Club Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2]"
            >
              <option value="member">Member</option>
              <option value="media_team">Media Team</option>
              <option value="executive">Executive</option>
              <option value="vice_president">Vice President</option>
              <option value="president">President</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#949ba4] mb-1.5 uppercase">
              Validity Period
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2]"
            >
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Create Invite Code</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Active Invitation Keys */}
      <div className="mb-8">
        <h2 className="text-base font-bold text-white mb-3 flex items-center justify-between">
          <span>Active & Available Keys</span>
          <span className="text-xs font-normal text-[#949ba4] bg-[#1e1f22] px-2.5 py-1 rounded-full border border-[#3f4147]">
            {activeInvites.length} Available
          </span>
        </h2>

        {activeInvites.length === 0 ? (
          <div className="bg-[#2b2d31]/50 border border-dashed border-[#3f4147] rounded-xl p-8 text-center text-[#949ba4]">
            No active invitation keys. Generate one above to invite club members.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeInvites.map((invite) => (
              <div
                key={invite.code}
                className="bg-[#2b2d31] border border-[#3f4147] rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-[#5865f2]/50 transition-colors"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-base font-bold text-white tracking-wider">
                      {invite.code}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getRoleBadgeClass(
                        invite.role
                      )}`}
                    >
                      {getRoleDisplayName(invite.role)}
                    </span>
                  </div>
                  <div className="text-xs text-[#949ba4] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expires {formatDateTime(invite.expires_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(invite.code)}
                    className="p-2 hover:bg-[#35373c] rounded-lg text-[#949ba4] hover:text-white transition-colors"
                    title="Copy Invite Code"
                  >
                    {copiedCode === invite.code ? (
                      <Check className="w-4 h-4 text-[#23a55a]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRevoke(invite.code)}
                    className="p-2 hover:bg-red-950/60 rounded-lg text-[#949ba4] hover:text-red-400 transition-colors"
                    title="Revoke Invite"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Used / Expired Keys */}
      <div>
        <h2 className="text-base font-bold text-white mb-3">
          Redeemed & Expired Keys ({usedOrExpiredInvites.length})
        </h2>

        {usedOrExpiredInvites.length === 0 ? (
          <div className="text-xs text-[#949ba4] italic">
            No redeemed or expired keys recorded.
          </div>
        ) : (
          <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1e1f22] text-[#949ba4] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Redeemed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3f4147] text-[#dbdee1]">
                  {usedOrExpiredInvites.map((inv) => {
                    const isUsed = !!inv.used_by;
                    return (
                      <tr key={inv.code} className="hover:bg-[#35373c]/30">
                        <td className="py-3 px-4 font-mono font-medium">{inv.code}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${getRoleBadgeClass(
                              inv.role
                            )}`}
                          >
                            {getRoleDisplayName(inv.role)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isUsed ? (
                            <span className="inline-flex items-center gap-1 text-[#23a55a] font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Redeemed
                            </span>
                          ) : (
                            <span className="text-red-400 font-medium">Expired</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#949ba4]">
                          {inv.used_at ? formatDateTime(inv.used_at) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
