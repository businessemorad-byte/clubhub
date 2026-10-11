"use client";

import { useState } from "react";
import { createPollAction } from "@/app/actions/chatEnhancements";
import { X, Plus, Trash2, Loader2, BarChart2 } from "lucide-react";

interface CreatePollModalProps {
  channelId: string;
  onClose: () => void;
  onSuccess: (pollId: string) => void;
}

export function CreatePollModal({ channelId, onClose, onSuccess }: CreatePollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    const result = await createPollAction(channelId, question, options);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.pollId) {
      onSuccess(result.pollId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#313338] border border-[#3f4147] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3f4147] flex items-center justify-between bg-[#2b2d31]">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#5865f2]" />
            <h3 className="text-base font-bold text-white">Create Live In-Chat Poll</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#949ba4] hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded text-red-200 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
              Poll Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which date works best for the hackathon kickoff?"
              className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
              Options (2 to 5 choices)
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 px-3 py-1.5 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-xs"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="p-1.5 text-[#949ba4] hover:text-red-400 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2 text-xs text-[#5865f2] hover:text-[#7983f5] font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add another option
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-[#3f4147] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#dbdee1] hover:bg-[#35373c]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-5 py-2 rounded-lg text-xs font-medium bg-[#5865f2] hover:bg-[#4752c4] text-white flex items-center gap-2 shadow disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Launch Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
