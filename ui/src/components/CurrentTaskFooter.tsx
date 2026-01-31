import { useEffect, useState } from "react";
import { Task, Category } from "@/types/task";
import { Square, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimeAsHHmm } from "@/lib/utils";

interface CurrentTaskFooterProps {
  currentTask: Task | null;
  categories: Category[];
  onTaskTimer: (taskId: string, action: "start" | "stop" | "complete") => void;
  onPauseTask: (task: Task) => void;
}

export const CurrentTaskFooter = ({
  currentTask,
  categories,
  onTaskTimer,
  onPauseTask,
}: CurrentTaskFooterProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);

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

  // 見積もり時間を超えた場合にサウンドを再生
  useEffect(() => {
    if (currentTask?.estimated_minute && elapsedTime > 0 && !hasPlayedSound) {
      const estimatedSeconds = currentTask.estimated_minute * 60;
      if (elapsedTime >= estimatedSeconds) {
        // サウンドを再生
        playNotificationSound();
        setHasPlayedSound(true);
      }
    }
  }, [currentTask?.estimated_minute, elapsedTime, hasPlayedSound]);

  // タスクが変更されたらサウンド再生フラグをリセット
  useEffect(() => {
    setHasPlayedSound(false);
  }, [currentTask?.id]);

  // 通知音を再生する関数
  const playNotificationSound = () => {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // 音の設定（周波数800Hz、正弦波）
      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      // 音量の設定（フェードイン・フェードアウト）
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        audioContext.currentTime + 0.1,
      );
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

      // 音を再生
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // 再生終了後にAudioContextをクローズ
      setTimeout(() => {
        audioContext.close();
      }, 600);
    } catch (error) {
      console.error("通知音の再生に失敗しました:", error);
    }
  };

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

  // 見積もり時間を超えたかどうかをチェック
  const isOverEstimated =
    currentTask.estimated_minute &&
    elapsedTime >= currentTask.estimated_minute * 60;
  const timeDisplayColor = isOverEstimated ? "#dc2626" : categoryColor;

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
              <span>開始: {formatTimeAsHHmm(currentTask.start_time!)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p
              className={`text-2xl font-mono font-bold ${isOverEstimated ? "animate-pulse" : ""}`}
              style={{ color: timeDisplayColor }}
            >
              {formatElapsedTime(elapsedTime)}
            </p>
            <p className="text-xs text-gray-500">
              経過時間
              {currentTask.estimated_minute && (
                <span className="ml-1">/ {currentTask.estimated_minute}分</span>
              )}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onPauseTask(currentTask)}
            className="hover:bg-orange-50"
            style={{
              color: "#ea580c",
              borderColor: "#ea580c",
            }}
          >
            <Pause className="h-4 w-4 mr-1" />
            中断
          </Button>

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
