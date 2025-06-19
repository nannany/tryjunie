import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";
import React from "react";
import { TaskTimerButton } from "./TaskTimerButton";
import { TaskTitleField } from "./TaskTitleField";
import { TaskEstimatedTimeField } from "./TaskEstimatedTimeField";
import { StartTimeField } from "./StartTimeField";
import { EndTimeField } from "./EndTimeField";
import { TaskCategoryField } from "./TaskCategoryField";
import { TaskMetaInfo } from "./TaskMetaInfo";
import { Task, Category } from "@/types/task";
import { EditingField } from "./types";

interface TaskEditActions {
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

interface TaskActions {
  handleDelete: (taskId: string) => void;
  handleTaskTimer: (
    taskId: string,
    action: "start" | "stop" | "complete",
  ) => void;
}

interface SortableTaskProps {
  task: Task;
  taskEdit: TaskEditActions;
  taskActions: TaskActions;
  lastTaskEndTime: string | null;
  categories: Category[];
}

const SortableTask = ({
  task,
  taskEdit,
  taskActions,
  lastTaskEndTime,
  categories,
}: SortableTaskProps) => {
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
  const selectedCategory = categories.find((cat) => cat.id === task.category_id);
  const categoryColor = selectedCategory?.color || "#6b7280";

  const taskEditProps = {
    task,
    editingField: taskEdit.editingField,
    editValue: taskEdit.editValue,
    onEditStart: taskEdit.handleEditStart,
    handleEditChange: taskEdit.handleEditChange,
    handleEditSave: taskEdit.handleEditSave,
    handleKeyDown: taskEdit.handleKeyDown,
    setEditValue: taskEdit.setEditValue,
    setEditingField: taskEdit.setEditingField,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeft: `4px solid ${categoryColor}`,
      }}
      className="flex items-center justify-between rounded-md border p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onKeyDown={handleTaskKeyDown}
      data-task-id={task.id}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-4">
        <div className="cursor-grab active:cursor-grabbing">
          <GripVertical 
            className="h-4 w-4" 
            style={{ color: categoryColor }}
          />
        </div>

        <TaskTimerButton
          task={task}
          onTaskTimer={taskActions.handleTaskTimer}
          categoryColor={categoryColor}
        />

        <div className="flex-grow">
          <TaskTitleField {...taskEditProps} categoryColor={categoryColor} />

          <div className="flex gap-3 text-sm text-muted-foreground">
            <TaskEstimatedTimeField {...taskEditProps} categoryColor={categoryColor} />

            <StartTimeField
              {...taskEditProps}
              lastTaskEndTime={lastTaskEndTime}
              categoryColor={categoryColor}
            />

            <EndTimeField {...taskEditProps} categoryColor={categoryColor} />

            <TaskCategoryField {...taskEditProps} categories={categories} />

            <TaskMetaInfo task={task} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
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
