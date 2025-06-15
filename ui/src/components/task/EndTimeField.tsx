import React from "react";
import { Input } from "@/components/ui/input";
import { cn, parseTimeInputToISOString } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { TaskEditProps } from "./types";

interface EndTimeFieldProps extends TaskEditProps {}

export const EndTimeField = ({
  task,
  editingField,
  editValue,
  onEditStart,
  setEditValue,
  setEditingField,
  handleEditSave,
}: EndTimeFieldProps) => {
  const { toast } = useToast();

  const isEditing =
    editingField?.taskId === task.id && editingField?.field === "end_time";
  const fieldValue = task.end_time;

  // 日時をフォーマット
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
      ? new Date(editValue).toLocaleTimeString("ja-JP", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
      : editValue
    : "";

  if (isEditing) {
    return (
      <div className="flex items-center">
        <span>終了: </span>
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
          onEditStart(task.id, "end_time", fieldValue || "");
        }
      }}
    >
      終了: {formatDateTime(fieldValue) || `(クリックして設定)`}
    </p>
  );
};