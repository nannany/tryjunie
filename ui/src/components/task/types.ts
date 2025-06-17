import React from "react";

// Task型の定義（既存の@/types/taskと統一）
export type { Task } from "@/types/task";

// 編集中のフィールドの型
export interface EditingField {
  taskId: string;
  field:
    | "title"
    | "estimated_minute"
    | "start_time"
    | "end_time"
    | "category_id";
}

// 共通のプロップス型
export interface TaskEditProps {
  task: import("@/types/task").Task;
  editingField: EditingField | null;
  editValue: string;
  onEditStart: (
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
  setEditValue: (value: string) => void;
  setEditingField: (field: EditingField | null) => void;
}
