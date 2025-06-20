import { useEffect, useState } from "react";
import { Task, Category } from "@/types/task";
import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CurrentTaskFooterProps {
  currentTask: Task | null;
  categories: Category[];
  onTaskTimer: (taskId: string, action: "start" | "stop" | "complete") => void;
}

export const CurrentTaskFooter = ({
  currentTask,
  categories,
  onTaskTimer,
}: CurrentTaskFooterProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);

  // 1秒ごとに現在時刻を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 経過時間を計算
  useEffect(() => {
    if (currentTask?.start_time) {
      const startTime = new Date(currentTask.start_time);
      const elapsed = Math.floor(
        (currentTime.getTime() - startTime.getTime()) / 1000,
      );
      setElapsedTime(elapsed);
    } else {
      setElapsedTime(0);
    }
  }, [currentTask?.start_time, currentTime]);

  // 経過時間をフォーマット
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentTask) {
    return null;
  }

  const category = categories.find((cat) => cat.id === currentTask.category_id);
  const categoryColor = category?.color || "#6b7280";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50"
      style={{ borderTopColor: categoryColor }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: categoryColor }}
          />
          <div>
            <p className="font-medium text-gray-900">{currentTask.title}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {category && (
                <span style={{ color: categoryColor }}>{category.name}</span>
              )}
              <span>•</span>
              <span>
                開始:{" "}
                {new Date(currentTask.start_time!).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p
              className="text-2xl font-mono font-bold"
              style={{ color: categoryColor }}
            >
              {formatElapsedTime(elapsedTime)}
            </p>
            <p className="text-xs text-gray-500">経過時間</p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onTaskTimer(currentTask.id, "stop")}
            className="hover:bg-red-50"
            style={{
              color: "#dc2626",
              borderColor: "#dc2626",
            }}
          >
            <Square className="h-4 w-4 mr-1" />
            停止
          </Button>
        </div>
      </div>
    </div>
  );
};
