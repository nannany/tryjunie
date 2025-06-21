import { Button } from "@/components/ui/button";
import { Play, Square, CheckCircle2, RotateCcw } from "lucide-react";
import { Task } from "./types";
import { useState } from "react";

interface TaskTimerButtonProps {
  task: Task;
  onTaskTimer: (taskId: string, action: "start" | "stop" | "complete") => void;
  onRepeatTask?: (task: Task) => void;
  categoryColor?: string;
}

export const TaskTimerButton = ({
  task,
  onTaskTimer,
  onRepeatTask,
  categoryColor = "#6b7280",
}: TaskTimerButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  if (!task.start_time) {
    return (
      <Button
        size="icon"
        variant="outline"
        onClick={() => onTaskTimer(task.id, "start")}
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
        onClick={() => onTaskTimer(task.id, "stop")}
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
      disabled={!onRepeatTask}
      onClick={(e) => {
        if (onRepeatTask) {
          e.stopPropagation();
          onRepeatTask(task);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && onRepeatTask ? (
        <RotateCcw className="h-4 w-4" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
    </Button>
  );
};
