import React, { createContext, useContext } from "react";
import { Task, Category } from "@/types/task";
import { EditingField } from "@/components/task/types";

// タスク編集に関するアクション
export interface TaskEditActions {
  editingField: EditingField | null;
  editValue: string;
  setEditingField: (field: EditingField | null) => void;
  setEditValue: (value: string) => void;
  handleEditStart: (
    taskId: string,
    field:
      | "title"
      | "estimated_minute"
      | "start_time"
      | "end_time"
      | "category_id",
    value: string,
  ) => void;
  handleEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditSave: (customValue?: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

// タスク操作に関するアクション
export interface TaskActions {
  handleDelete: (taskId: string) => void;
  handleTaskTimer: (
    taskId: string,
    action: "start" | "stop" | "complete",
  ) => void;
  handleRepeatTask: (task: Task) => void;
}

// タスクコンテキストの型定義
export interface TaskContextType {
  // 状態
  tasks: Task[];
  categories: Category[];
  lastTaskEndTime: string | null;
  currentRunningTask: Task | null;

  // アクション
  taskEdit: TaskEditActions;
  taskActions: TaskActions;
}

// コンテキストの作成
export const TaskContext = createContext<TaskContextType | undefined>(
  undefined,
);

// TaskContextを使用するためのカスタムフック
export const useTaskContext = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
};
