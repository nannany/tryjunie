import React, { ReactNode } from "react";
import { TaskContext, TaskContextType } from "@/contexts/TaskContext";

// TaskProviderのプロパティ
interface TaskProviderProps {
  children: ReactNode;
  value: TaskContextType;
}

// TaskProvider コンポーネント
export const TaskProvider: React.FC<TaskProviderProps> = ({
  children,
  value,
}) => {
  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
