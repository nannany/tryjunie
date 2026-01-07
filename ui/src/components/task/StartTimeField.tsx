import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { parseTimeInputToISOString, formatTimeAsHHmm } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Task } from "./types";
import { useTaskContext } from "@/contexts/TaskContext";

interface StartTimeFieldProps {
  task: Task;
  lastTaskEndTime?: string | null;
  categoryColor?: string;
}

export const StartTimeField = ({
  task,
  lastTaskEndTime,
  categoryColor = "#6b7280",
}: StartTimeFieldProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();
  const { taskEdit } = useTaskContext();
  const {
    editingField,
    editValue,
    handleEditStart,
    setEditValue,
    setEditingField,
    handleEditSave,
  } = taskEdit;

  const isEditing =
    editingField?.taskId === task.id && editingField?.field === "start_time";
  const fieldValue = task.start_time;

  // 日時をフォーマット（HHmm形式）
  const formatDateTime = (dateString: string | null) => {
    return formatTimeAsHHmm(dateString);
  };

  // 開始時刻オプションの生成
  const getStartTimeOptions = () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60000);

    const formatTime = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}${minutes}`;
    };

    const options = [
      {
        value: now.toISOString(),
        label: `現在時刻 (${formatTime(now)})`,
      },
      {
        value: fiveMinutesAgo.toISOString(),
        label: `5分前 (${formatTime(fiveMinutesAgo)})`,
      },
      {
        value: tenMinutesAgo.toISOString(),
        label: `10分前 (${formatTime(tenMinutesAgo)})`,
      },
    ];

    if (lastTaskEndTime) {
      const endTime = new Date(lastTaskEndTime);
      options.push({
        value: lastTaskEndTime,
        label: `前のタスクの終了時間 (${formatTime(endTime)})`,
      });
    }

    return options;
  };

  // 時刻オプション選択時の処理
  const handleTimeSelect = (isoString: string) => {
    setPopoverOpen(false);
    setEditValue(isoString);
    // handleEditSaveを使用してDBと状態を同期
    handleEditSave(isoString);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleTimeSave = () => {
    let finalValue = editValue;

    // 入力値がある場合は時刻フォーマットに変換
    if (editValue && editValue.trim() !== "") {
      const dateTimeValue = parseTimeInputToISOString(
        editValue,
        task.task_date,
      );
      if (dateTimeValue) {
        finalValue = dateTimeValue;
        setEditValue(dateTimeValue);
      } else {
        // 変換に失敗した場合はエラーメッセージを表示
        toast({
          title: "入力エラー",
          description: "時刻は4桁の形式で入力してください（例：0930、1715）",
          variant: "destructive",
        });
        return; // 保存処理を中止
      }
    }

    // 変換された値を直接handleEditSaveに渡してグローバル状態を更新
    handleEditSave(finalValue);
  };

  const displayValue = editValue
    ? editValue.includes("T")
      ? formatTimeAsHHmm(editValue) || ""
      : editValue
    : "";

  if (isEditing) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center cursor-pointer">
            <span style={{ color: categoryColor }}>開始: </span>
            <div className="relative flex items-center">
              <Input
                type="text"
                placeholder="HHmm"
                value={displayValue}
                onChange={handleTimeChange}
                onFocus={() => setPopoverOpen(true)}
                onBlur={(e) => {
                  const related = e.relatedTarget as HTMLElement;
                  if (related?.closest("[data-popover-content]")) return;
                  handleTimeSave();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTimeSave();
                  } else if (e.key === "Escape") {
                    setEditingField(null);
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setPopoverOpen(true);
                  }
                }}
                className="w-24 h-6 text-xs mx-1 pr-7"
                autoFocus
              />
              <ChevronDown className="absolute right-2 h-4 w-4 opacity-50" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent data-popover-content className="w-48 p-0" align="start">
          <div className="grid">
            {getStartTimeOptions().map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                className="justify-start text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleTimeSelect(option.value)}
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
    <p
      className="cursor-pointer hover:bg-gray-50 p-1 rounded"
      onClick={() => {
        handleEditStart(task.id, "start_time", fieldValue || "");
      }}
    >
      <span style={{ color: categoryColor }}>開始: </span>
      <span style={{ color: categoryColor }}>
        {formatDateTime(fieldValue) || `(クリックして設定)`}
      </span>
    </p>
  );
};
