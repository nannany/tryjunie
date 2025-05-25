import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseTimeInputToISOString = (
  textInput: string,
  baseDateString: string,
): string | null => {
  try {
    // 時間形式を検出して対応（例：「13:45」や「13時45分」など）
    let hours: number;
    let minutes: number;

    if (textInput.includes(":")) {
      // 「13:45」形式
      const [h, m] = textInput.split(":");
      hours = parseInt(h);
      minutes = parseInt(m);
    } else if (textInput.includes("時")) {
      // 「13時45分」形式
      let parts = textInput.split("時");
      hours = parseInt(parts[0]);
      minutes = parts[1] ? parseInt(parts[1].replace("分", "")) : 0;
    } else if (textInput.length === 4 && /^\d+$/.test(textInput)) {
      // 「1730」形式
      hours = parseInt(textInput.substring(0, 2));
      minutes = parseInt(textInput.substring(2, 4));
    } else {
      // 数字だけの場合は時間として解釈（例：「13」→「13:00」）
      hours = parseInt(textInput);
      minutes = 0;
    }

    if (isNaN(hours) || isNaN(minutes)) {
      return null;
    }

    // 時刻が有効かチェック
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    // タスクの日付を使用して日時を設定
    const taskDate = new Date(baseDateString); // Changed from task.task_date
    const date = new Date(taskDate);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  } catch (e) {
    console.error("時刻の解析エラー:", e);
    return null;
  }
};
