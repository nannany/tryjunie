/**
 * セキュアなランダムAPIキーを生成する
 * @param length キーの長さ（デフォルト：32文字）
 * @returns 生成されたAPIキー
 */
export const generateApiKey = (length = 32): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let result = "";
  bytes.forEach((byte) => {
    result += chars[byte % chars.length];
  });

  return result;
};

/**
 * 日付を日本語形式でフォーマットする
 * @param date フォーマットする日付
 * @returns フォーマットされた日付文字列
 */
export const formatJapaneseDate = (date: string | null): string => {
  if (!date) return "未使用";

  const d = new Date(date);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
};
