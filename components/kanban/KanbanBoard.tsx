"use client";

import { useEffect, useState } from "react";
import { Task, TaskColumn, Profile } from "@/types";
import { TaskCard } from "./TaskCard";
import { NewTaskModal } from "./NewTaskModal";
import { useAuth } from "@/context/AuthContext";
import { moveTaskAction } from "@/app/actions/kanban";
import { createClient } from "@/lib/supabase/client";
import { Plus, KanbanSquare } from "lucide-react";

interface KanbanBoardProps {
  initialColumns: TaskColumn[];
  initialTasks: Task[];
  members: Profile[];
}

export function KanbanBoard({
  initialColumns,
  initialTasks,
  members,
}: KanbanBoardProps) {
  const { isExecutive } = useAuth();
  const [columns] = useState<TaskColumn[]>(initialColumns);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetColumnForModal, setTargetColumnForModal] = useState<string | undefined>();
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select(`
        *,
        assignee:profiles (*),
        subtasks (*)
      `)
      .order("order", { ascending: true });

    if (data) {
      setTasks(data as Task[]);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("kanban-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          fetchTasks();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subtasks" },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(colId);
  };

  const handleDragLeave = () => {
    setDragOverColId(null);
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    // Optimistically update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column_id: colId } : t))
    );

    await moveTaskAction(taskId, colId);
  };

  const openCreateModal = (colId?: string) => {
    setTargetColumnForModal(colId);
    setModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] overflow-hidden">
      {/* Top Header */}
      <div className="h-14 border-b border-[#1f2023] px-6 flex items-center justify-between bg-[#313338] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <KanbanSquare className="w-5 h-5 text-[#5865f2]" />
          <h1 className="font-bold text-white text-lg">Project Tasks Kanban</h1>
        </div>

        {isExecutive && (
          <button
            onClick={() => openCreateModal()}
            className="px-3.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Columns Container */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-6 items-start">
        {columns.map((column) => {
          const colTasks = tasks.filter((t) => t.column_id === column.id);
          const isOver = dragOverColId === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`w-80 flex-shrink-0 bg-[#2b2d31] rounded-xl flex flex-col max-h-full border transition-all ${
                isOver
                  ? "border-[#5865f2] ring-2 ring-[#5865f2]/20"
                  : "border-[#383a40]"
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-[#35373c] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                    {column.name}
                  </h3>
                  <span className="text-xs bg-[#1e1f22] text-[#949ba4] font-semibold px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {isExecutive && (
                  <button
                    onClick={() => openCreateModal(column.id)}
                    className="p-1 text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded transition-colors"
                    title={`Add task to ${column.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Cards List */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    columns={columns}
                    onTaskUpdated={fetchTasks}
                  />
                ))}

                {colTasks.length === 0 && (
                  <div className="h-24 border border-dashed border-[#3f4147] rounded-lg flex items-center justify-center text-xs text-[#949ba4] italic">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {modalOpen && (
        <NewTaskModal
          columns={columns}
          members={members}
          initialColumnId={targetColumnForModal}
          onClose={() => setModalOpen(false)}
          onSuccess={fetchTasks}
        />
      )}
    </div>
  );
}
