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

  // タスクを今日に移動
  const handleMoveToToday = async (taskId: string) => {
    const today = new Date();
    const todayString = today
      .toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
      .split(" ")[0];
    const [year, month, day] = todayString.split("/");
    const taskDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    const { error } = await supabase
      .from("tasks")
      .update({ task_date: taskDate })
      .eq("id", taskId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to move task to today",
        variant: "destructive",
      });
      console.error("Error moving task to today:", error);
    } else {
      // ローカル状態から削除（画面から消す）
      dispatch({ type: "DELETE_TASK", payload: taskId });
      
      toast({
        title: "Success",
        description: "タスクを今日に移動しました",
      });
    }
  };

  return {
    handleDelete,
    handleTaskTimer,
    handleMoveToToday,
  };
};
