import { Button } from "@/components/ui/button";
import { Play, Square, CheckCircle2, RotateCcw } from "lucide-react";
import { Task } from "./types";
import { useState } from "react";
import { useTaskContext } from "@/contexts/TaskContext";

interface TaskTimerButtonProps {
  task: Task;
  categoryColor?: string;
}

export const TaskTimerButton = ({
  task,
  categoryColor = "#6b7280",
}: TaskTimerButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // TaskContextから必要な関数を取得
  const { taskActions } = useTaskContext();
  const { handleTaskTimer, handleRepeatTask } = taskActions;
  if (!task.start_time) {
    return (
      <Button
        size="icon"
        variant="outline"
        onClick={() => handleTaskTimer(task.id, "start")}
        className="h-8 w-8 hover:bg-opacity-10"
        style={{
          color: categoryColor,
          borderColor: categoryColor,
          backgroundColor: `${categoryColor}10`,
        }}
      >
        <Play className="h-4 w-4" />
      </Button>
    );
  }

  if (!task.end_time) {
    return (
      <Button
        size="icon"
        variant="outline"
        onClick={() => handleTaskTimer(task.id, "stop")}
        className="h-8 w-8 hover:bg-opacity-10"
        style={{
          color: categoryColor,
          borderColor: categoryColor,
          backgroundColor: `${categoryColor}10`,
        }}
      >
        <Square className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      size="icon"
      variant="outline"
      className="h-8 w-8 hover:bg-opacity-10"
      style={{
        color: categoryColor,
        borderColor: categoryColor,
        backgroundColor: `${categoryColor}20`,
      }}
      disabled={!handleRepeatTask}
      onClick={(e) => {
        if (handleRepeatTask) {
          e.stopPropagation();
          handleRepeatTask(task);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
        <RotateCcw className="h-4 w-4" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
    </Button>
  );
};
