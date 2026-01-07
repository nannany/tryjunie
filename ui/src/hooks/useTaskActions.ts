import React from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TaskAction, Task } from "@/types/task";
import { getTodayDateString } from "@/lib/utils";

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
    const taskDate = getTodayDateString();

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
      // 注：タスクは別の日付に移動しただけなので、データベースからは削除されていません。
      // 現在表示している日付から消すため、DELETE_TASkアクションを使用します。
      dispatch({ type: "DELETE_TASK", payload: taskId });

      toast({
        title: "Success",
        description: "タスクを今日に移動しました",
      });
    }
  };

  // タスクを中断
  const handlePauseTask = async (task: Task) => {
    // 1. 現在のタスクに終了時刻を設定して完了させる
    const endTime = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ end_time: endTime })
      .eq("id", task.id);

    if (updateError) {
      toast({
        title: "Error",
        description: "タスクの中断に失敗しました",
        variant: "destructive",
      });
      console.error("Error pausing task:", updateError);
      return;
    }

    // ローカル状態を更新
    dispatch({
      type: "UPDATE_TASK",
      payload: { id: task.id, end_time: endTime },
    });

    // 2. 同じ属性で新しいタスクを作成
    const newTask = {
      title: task.title,
      description: task.description,
      user_id: task.user_id,
      estimated_minute: task.estimated_minute,
      category_id: task.category_id,
      task_date: task.task_date,
      task_order: null,
    };

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert(newTask)
      .select();

    if (insertError) {
      toast({
        title: "Error",
        description: "新しいタスクの作成に失敗しました",
        variant: "destructive",
      });
      console.error("Error creating new task:", insertError);
      return;
    }

    if (!data || data.length === 0) {
      toast({
        title: "Error",
        description: "新しいタスクの作成に失敗しました",
        variant: "destructive",
      });
      console.error("Error creating new task: No data returned");
      return;
    }

    // 新しく作成したタスクをリストに追加
    const createdTask = data[0] as unknown as Task;
    dispatch({
      type: "ADD_TASK",
      payload: createdTask,
    });

    toast({
      title: "Success",
      description: `タスク "${task.title}" を中断しました`,
    });
  };

  return {
    handleDelete,
    handleTaskTimer,
    handleMoveToToday,
    handlePauseTask,
  };
};
