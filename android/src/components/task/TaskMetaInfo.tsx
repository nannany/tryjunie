import { Task } from "./types";

interface TaskMetaInfoProps {
  task: Task;
  categoryColor?: string;
}

export const TaskMetaInfo = ({
  task,
  categoryColor = "#6b7280",
}: TaskMetaInfoProps) => {
  // 所要時間を計算（分単位）
  const calculateDuration = (
    start: string | null,
    end: string | null,
  ): number | null => {
    if (!start || !end) return null;
    const startTime = new Date(start);
    const endTime = new Date(end);
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  };

  // 所要時間をフォーマット
  const formatDuration = (duration: number | null): string => {
    if (duration === null) return "";
    if (duration < 60) return `${duration}分`;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`;
  };

  if (!task.start_time || !task.end_time) {
    return null;
  }

  return (
    <p className="text-sm p-1">
      <span style={{ color: categoryColor }}>所要時間: </span>
      <span style={{ color: categoryColor }}>
        {formatDuration(calculateDuration(task.start_time, task.end_time))}
      </span>
    </p>
  );
};
