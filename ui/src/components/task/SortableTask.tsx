import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, CalendarCheck } from "lucide-react";
import React from "react";
import { TaskTimerButton } from "./TaskTimerButton";
import { TaskTitleField } from "./TaskTitleField";
import { TaskEstimatedTimeField } from "./TaskEstimatedTimeField";
import { StartTimeField } from "./StartTimeField";
import { EndTimeField } from "./EndTimeField";
import { TaskCategoryField } from "./TaskCategoryField";
import { TaskMetaInfo } from "./TaskMetaInfo";
import { Task } from "@/types/task";
import { useTaskContext } from "@/contexts/TaskContext";
import { getTodayDateString } from "@/lib/utils";

interface SortableTaskProps {
  task: Task;
}

const SortableTask = ({ task }: SortableTaskProps) => {
  // TaskContextから必要な値を取得
  const { taskEdit, taskActions, lastTaskEndTime, categories } =
    useTaskContext();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: task.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // キーボードショートカットの処理
  const handleTaskKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 編集中の場合はショートカットを無効化
    if (taskEdit.editingField?.taskId === task.id) return;

    switch (e.key.toLowerCase()) {
      case "s": {
        if (!task.start_time) {
          e.preventDefault();
          taskActions.handleTaskTimer(task.id, "start");
        }
        break;
      }
      case "e": {
        if (task.start_time && !task.end_time) {
          e.preventDefault();
          taskActions.handleTaskTimer(task.id, "stop");
        }
        break;
      }
      case "d": {
        e.preventDefault();
        taskActions.handleDelete(task.id);
        break;
      }
      case "arrowup":
      case "arrowdown": {
        // 上下キーのデフォルト動作を防ぐ
        e.preventDefault();
        // 親コンポーネントにイベントを伝播させる
        e.stopPropagation();

        // 現在フォーカスされている要素を取得
        const currentFocus = document.activeElement;
        if (!currentFocus) return;

        // タスク要素を取得
        const taskElements = Array.from(
          document.querySelectorAll("[data-task-id]"),
        );
        const currentIndex = taskElements.indexOf(currentFocus as HTMLElement);

        if (currentIndex === -1) return;

        // 上下キーに応じて次のタスクを選択
        let nextIndex;
        if (e.key.toLowerCase() === "arrowup") {
          nextIndex = Math.max(0, currentIndex - 1);
        } else {
          nextIndex = Math.min(taskElements.length - 1, currentIndex + 1);
        }

        // 次のタスクにフォーカスを移動
        (taskElements[nextIndex] as HTMLElement).focus();
        break;
      }
    }
  };

  // カテゴリの色を取得
  const selectedCategory = categories.find(
    (cat) => cat.id === task.category_id,
  );
  const categoryColor = selectedCategory?.color || "#6b7280";

  // 今日の日付を取得（JST）
  const todayFormatted = getTodayDateString();

  // タスクが今日のものかどうか
  const isToday = task.task_date === todayFormatted;

  // タスクが完了しているかどうか
  const isCompleted = !!task.end_time;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeft: `4px solid ${categoryColor}`,
      }}
      className={`flex items-center justify-between rounded-md border p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isCompleted ? "bg-gray-50 opacity-70" : ""
      }`}
      onKeyDown={handleTaskKeyDown}
      data-task-id={task.id}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-4">
        <div className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4" style={{ color: categoryColor }} />
        </div>

        <TaskTimerButton task={task} categoryColor={categoryColor} />

        <div className="flex-grow">
          <TaskTitleField
            task={task}
            categoryColor={categoryColor}
            isCompleted={isCompleted}
          />

          <div className="flex gap-3 text-sm text-muted-foreground">
            <TaskEstimatedTimeField task={task} categoryColor={categoryColor} />

            <StartTimeField
              task={task}
              lastTaskEndTime={lastTaskEndTime}
              categoryColor={categoryColor}
            />

            <EndTimeField task={task} categoryColor={categoryColor} />

            <TaskCategoryField task={task} categories={categories} />

            <TaskMetaInfo task={task} categoryColor={categoryColor} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {/* 今日に移動ボタン：完了していない＆今日以外のタスクに表示 */}
        {!isCompleted && !isToday && (
          <Button
            size="icon"
            variant="outline"
            onClick={() => taskActions.handleMoveToToday(task.id)}
            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
            title="今日に移動"
          >
            <CalendarCheck className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="outline"
          onClick={() => taskActions.handleDelete(task.id)}
          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SortableTask;
