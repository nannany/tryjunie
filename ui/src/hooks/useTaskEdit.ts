import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { EditingField } from "@/components/task/types";
import { TaskAction } from "@/types/task";

const supabase = createClient();

export const useTaskEdit = (dispatch: React.Dispatch<TaskAction>) => {
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const { toast } = useToast();

  // 編集モードを開始
  const handleEditStart = (
    taskId: string,
    field: "title" | "estimated_minute" | "start_time" | "end_time",
    value: string,
  ) => {
    setEditingField({ taskId, field });
    setEditValue(value);
  };

  // 編集内容の変更
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  // 編集内容を保存
  const handleEditSave = async (customValue?: string) => {
    if (!editingField) return;

    const { taskId, field } = editingField;
    const valueToSave = customValue !== undefined ? customValue : editValue;

    // バリデーション
    if (field === "title" && !valueToSave.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const updateData: any = {};
    if (field === "title") {
      updateData.title = valueToSave;
    } else if (field === "estimated_minute") {
      updateData.estimated_minute = valueToSave ? parseInt(valueToSave) : null;
    } else if (field === "start_time" || field === "end_time") {
      updateData[field] = valueToSave
        ? new Date(valueToSave).toISOString()
        : null;
    }

    const { error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to update ${field}`,
        variant: "destructive",
      });
      console.error("Error updating task:", error);
    } else {
      // ローカル状態で更新したタスクの値を更新
      dispatch({ type: "UPDATE_TASK", payload: { id: taskId, ...updateData } });
    }

    // 編集モードを終了
    setEditingField(null);
  };

  // キーボードイベント処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleEditSave();
    } else if (e.key === "Escape") {
      setEditingField(null);
    }
  };

  return {
    editingField,
    editValue,
    setEditingField,
    setEditValue,
    handleEditStart,
    handleEditChange,
    handleEditSave,
    handleKeyDown,
  };
};
