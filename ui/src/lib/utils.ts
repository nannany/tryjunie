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
    // 4桁の数字形式のみを許可（例：「1715」）
    if (textInput.length !== 4 || !/^\d{4}$/.test(textInput)) {
      return null;
    }

    // 「1715」形式から時間と分を抽出
    const hours = parseInt(textInput.substring(0, 2));
    const minutes = parseInt(textInput.substring(2, 4));

    if (isNaN(hours) || isNaN(minutes)) {
      return null;
    }

    // 時刻が有効かチェック
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    // タスクの日付を使用して日時を設定
    const taskDate = new Date(baseDateString);
    const date = new Date(taskDate);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  } catch (e) {
    console.error("時刻の解析エラー:", e);
    return null;
  }
};

/**
 * 現在の日付を YYYY-MM-DD 形式で取得（JST）
 */
export const getTodayDateString = (): string => {
  const today = new Date()
    .toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
    .split(" ")[0];
  const [year, month, day] = today.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};
