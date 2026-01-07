import React from "react";
import { Input } from "@/components/ui/input";
import { cn, parseTimeInputToISOString, formatTimeAsHHmm } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Task } from "./types";
import { useTaskContext } from "@/contexts/TaskContext";

interface EndTimeFieldProps {
  task: Task;
  categoryColor?: string;
}

export const EndTimeField = ({
  task,
  categoryColor = "#6b7280",
}: EndTimeFieldProps) => {
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
    editingField?.taskId === task.id && editingField?.field === "end_time";
  const fieldValue = task.end_time;

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
      <div className="flex items-center">
        <span style={{ color: categoryColor }}>終了: </span>
        <Input
          type="text"
          placeholder="HHmm"
          value={displayValue}
          onChange={handleTimeChange}
          onBlur={handleTimeSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleTimeSave();
            } else if (e.key === "Escape") {
              setEditingField(null);
            }
          }}
          className="w-24 h-6 text-xs mx-1"
          autoFocus
        />
      </div>
    );
  }

  const isDisabled = !task.start_time;

  return (
    <p
      className={cn(
        "cursor-pointer hover:bg-gray-50 p-1 rounded",
        isDisabled && "text-gray-400 cursor-not-allowed",
      )}
      onClick={() => {
        if (!isDisabled) {
          handleEditStart(task.id, "end_time", fieldValue || "");
        }
      }}
    >
      <span style={{ color: isDisabled ? "#9ca3af" : categoryColor }}>
        終了:{" "}
      </span>
      <span style={{ color: isDisabled ? "#9ca3af" : categoryColor }}>
        {formatTimeAsHHmm(fieldValue) || `(クリックして設定)`}
      </span>
    </p>
  );
};
