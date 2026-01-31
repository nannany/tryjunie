import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { Task } from "./types";
import { useTaskContext } from "@/contexts/TaskContext";

interface TaskEstimatedTimeFieldProps {
  task: Task;
  categoryColor?: string;
}

export const TaskEstimatedTimeField = ({
  task,
  categoryColor = "#6b7280",
}: TaskEstimatedTimeFieldProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { taskEdit } = useTaskContext();
  const {
    editingField,
    editValue,
    handleEditStart,
    handleEditChange,
    handleEditSave,
    setEditValue,
    setEditingField,
  } = taskEdit;

  const isEditing =
    editingField?.taskId === task.id &&
    editingField?.field === "estimated_minute";

  // 見積もり時間オプションの生成
  const getTimeOptions = () => {
    const options = [
      { value: "5", label: "5分" },
      { value: "10", label: "10分" },
      { value: "15", label: "15分" },
      { value: "30", label: "30分" },
      { value: "45", label: "45分" },
      { value: "60", label: "1時間" },
      { value: "120", label: "2時間" },
    ];
    return [...options];
  };

  // 時間オプション選択時の処理
  const handleTimeOptionSelect = (value: string) => {
    setPopoverOpen(false);
    setEditValue(value);
    handleEditSave(value);
  };

  // 見積もり時間をフォーマット
  const formatEstimatedTime = (minutes: number | null) => {
    if (!minutes) return null;
    return `${minutes}m`;
  };

  if (isEditing) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center cursor-pointer">
            <span style={{ color: categoryColor }}>見積もり: </span>
            <div className="relative flex items-center">
              <Input
                type="text"
                value={editValue}
                onChange={handleEditChange}
                onFocus={() => setPopoverOpen(true)}
                onBlur={(e) => {
                  const related = e.relatedTarget as HTMLElement;
                  if (related?.closest("[data-popover-content]")) return;
                  handleEditSave();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleEditSave();
                  } else if (e.key === "Escape") {
                    setEditingField(null);
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setPopoverOpen(true);
                  }
                }}
                className="w-16 h-6 text-xs mx-1 pr-7"
                autoFocus
              />
              <ChevronDown className="absolute right-2 h-4 w-4 opacity-50" />
            </div>
            <span style={{ color: categoryColor }}>分</span>
          </div>
        </PopoverTrigger>
        <PopoverContent data-popover-content className="w-48 p-0" align="start">
          <div className="grid">
            {getTimeOptions().map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                className="justify-start text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleTimeOptionSelect(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <button
      type="button"
      className="cursor-pointer hover:bg-gray-50 p-1 rounded text-left"
      onClick={() =>
        handleEditStart(
          task.id,
          "estimated_minute",
          task.estimated_minute ? task.estimated_minute.toString() : "",
        )
      }
    >
      <span style={{ color: categoryColor }}>見積もり: </span>
      <span style={{ color: categoryColor }}>
        {formatEstimatedTime(task.estimated_minute) || "0分 (クリックして設定)"}
      </span>
    </button>
  );
};
