import { Button } from "@/components/ui/button";
import { Play, Square, CheckCircle2 } from "lucide-react";
import { Task } from "./types";

interface TaskTimerButtonProps {
  task: Task;
  onTaskTimer: (taskId: string, action: "start" | "stop" | "complete") => void;
  categoryColor?: string;
}

export const TaskTimerButton = ({
  task,
  onTaskTimer,
  categoryColor = "#6b7280",
}: TaskTimerButtonProps) => {
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
          backgroundColor: `${categoryColor}10`
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
          backgroundColor: `${categoryColor}10`
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
      className="h-8 w-8"
      style={{ 
        color: categoryColor,
        borderColor: categoryColor,
        backgroundColor: `${categoryColor}20`
      }}
      disabled
    >
      <CheckCircle2 className="h-4 w-4" />
    </Button>
  );
};
