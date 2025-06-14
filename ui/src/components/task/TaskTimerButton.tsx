import { Button } from "@/components/ui/button";
import { Play, Square, CheckCircle2 } from "lucide-react";
import { Task } from "./types";

interface TaskTimerButtonProps {
  task: Task;
  onTaskTimer: (taskId: string, action: "start" | "stop" | "complete") => void;
}

export const TaskTimerButton = ({
  task,
  onTaskTimer,
}: TaskTimerButtonProps) => {
  if (!task.start_time) {
    return (
      <Button
        size="icon"
        variant="outline"
        onClick={() => onTaskTimer(task.id, "start")}
        className="h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-50"
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
        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Square className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      size="icon"
      variant="outline"
      className="h-8 w-8 text-gray-500"
      disabled
    >
      <CheckCircle2 className="h-4 w-4" />
    </Button>
  );
};
