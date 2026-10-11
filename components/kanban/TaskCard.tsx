"use client";

import { useState } from "react";
import { Task, TaskPriority, TaskColumn } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { formatDate, getInitials } from "@/lib/utils";
import { toggleSubtaskAction, deleteTaskAction, moveTaskAction } from "@/app/actions/kanban";
import {
  Calendar,
  CheckSquare,
  Square,
  Trash2,
  AlertTriangle,
  MoveRight,
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  columns: TaskColumn[];
  onTaskUpdated?: () => void;
}

export function TaskCard({ task, columns, onTaskUpdated }: TaskCardProps) {
  const { user, isExecutive } = useAuth();
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [moving, setMoving] = useState(false);

  const isAssignedToMe = task.assignee_id === user?.id;
  const canModify = isExecutive || isAssignedToMe;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", task.id);
  };

  const handleToggleSubtask = async (subtaskId: string, currentDone: boolean) => {
    if (!canModify) return;

    // Optimistic update
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, done: !currentDone } : s))
    );

    await toggleSubtaskAction(subtaskId, !currentDone);
    onTaskUpdated?.();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    await deleteTaskAction(task.id);
    onTaskUpdated?.();
  };

  const handleMove = async (colId: string) => {
    if (colId === task.column_id) return;
    setMoving(true);
    await moveTaskAction(task.id, colId);
    setMoving(false);
    onTaskUpdated?.();
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "high":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "medium":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      case "low":
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/40";
    }
  };

  const completedSubtasks = subtasks.filter((s) => s.done).length;
  const totalSubtasks = subtasks.length;
  const progressPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-[#232428] border border-[#35373c] hover:border-[#5865f2]/60 rounded-lg p-3.5 shadow-md cursor-grab active:cursor-grabbing transition-all space-y-3 group"
    >
      {/* Top Header: Priority Badge + Quick Column Selector / Delete */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityStyle(
            task.priority
          )}`}
        >
          {task.priority}
        </span>

        <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
          {/* Quick column select for mobile/accessibility */}
          <select
            value={task.column_id}
            onChange={(e) => handleMove(e.target.value)}
            disabled={!canModify || moving}
            className="text-[11px] bg-[#1e1f22] text-[#949ba4] border border-[#3f4147] rounded px-1.5 py-0.5 focus:outline-none focus:border-[#5865f2]"
            title="Move to column"
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>

          {isExecutive && (
            <button
              onClick={handleDelete}
              className="p-1 text-[#949ba4] hover:text-red-400 hover:bg-[#35373c] rounded transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <h4 className="font-semibold text-white text-sm leading-snug">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-[#949ba4] mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Subtasks Progress / Checklist */}
      {totalSubtasks > 0 && (
        <div className="pt-1">
          <div
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center justify-between text-xs text-[#949ba4] hover:text-white cursor-pointer py-1"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <CheckSquare className="w-3.5 h-3.5 text-[#5865f2]" />
              <span>Subtasks ({completedSubtasks}/{totalSubtasks})</span>
            </span>
            <span>{progressPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#1e1f22] h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-[#5865f2] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Expanded checklist */}
          {showSubtasks && (
            <div className="mt-2.5 pt-2 border-t border-[#35373c] space-y-1.5">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => handleToggleSubtask(sub.id, sub.done)}
                  className={`flex items-start gap-2 text-xs p-1 rounded hover:bg-[#2b2d31] transition-colors ${
                    canModify ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  {sub.done ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[#23a55a] flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[#949ba4] flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`leading-tight ${
                      sub.done ? "line-through text-[#949ba4]" : "text-[#dbdee1]"
                    }`}
                  >
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer: Assignee & Deadline */}
      <div className="flex items-center justify-between pt-2 border-t border-[#35373c] text-xs">
        {/* Assignee */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-[#5865f2] text-white flex items-center justify-center text-[10px] font-bold">
            {task.assignee?.avatar_url ? (
              <img
                src={task.assignee.avatar_url}
                alt={task.assignee.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(task.assignee?.full_name || "Unassigned")
            )}
          </div>
          <span className="text-[#949ba4] truncate max-w-[100px]">
            {task.assignee?.full_name || "Unassigned"}
          </span>
        </div>

        {/* Deadline */}
        {task.deadline && (
          <div className="flex items-center gap-1 text-[#949ba4]">
            <Calendar className="w-3 h-3 text-[#f0b232]" />
            <span className="text-[11px]">{formatDate(task.deadline)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
