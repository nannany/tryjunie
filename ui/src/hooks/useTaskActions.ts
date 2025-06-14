import React from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TaskAction } from "@/types/task";

const supabase = createClient();

export const useTaskActions = (dispatch: React.Dispatch<TaskAction>) => {
  const { toast } = useToast();

  // タスクを削除
  const handleDelete = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
      console.error("Error deleting task:", error);
    } else {
      // ローカル状態から削除したタスクを除外
      dispatch({ type: "DELETE_TASK", payload: taskId });
    }
  };

  // タスクの開始/停止を処理
  const handleTaskTimer = async (
    taskId: string,
    action: "start" | "stop" | "complete",
  ) => {
    const updateData: any = {};

    if (action === "start") {
      updateData.start_time = new Date().toISOString();
    } else if (action === "stop") {
      updateData.end_time = new Date().toISOString();
    }

    const { error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} task`,
        variant: "destructive",
      });
      console.error(`Error ${action}ing task:`, error);
    } else {
      dispatch({ type: "UPDATE_TASK", payload: { id: taskId, ...updateData } });
    }
  };

  return {
    handleDelete,
    handleTaskTimer,
  };
};