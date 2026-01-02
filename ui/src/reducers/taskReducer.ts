import { Task, TaskAction } from "@/types/task";

// タスクをstart_time、task_orderの順でソート（データベースのクエリと同じロジック）
const sortTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    // start_time で比較（nullsFirst: nullが先頭）
    if (a.start_time === null && b.start_time === null) {
      // 両方nullの場合、task_orderで比較
      if (a.task_order === null && b.task_order === null) return 0;
      if (a.task_order === null) return -1;
      if (b.task_order === null) return 1;
      return a.task_order - b.task_order;
    }
    if (a.start_time === null) return -1;
    if (b.start_time === null) return 1;
    
    // start_timeで比較
    const timeCompare = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    if (timeCompare !== 0) return timeCompare;
    
    // start_timeが同じ場合、task_orderで比較
    if (a.task_order === null && b.task_order === null) return 0;
    if (a.task_order === null) return -1;
    if (b.task_order === null) return 1;
    return a.task_order - b.task_order;
  });
};

// Task Reducer
export const taskReducer = (state: Task[], action: TaskAction): Task[] => {
  switch (action.type) {
    case "SET_TASKS":
      return action.payload;
    case "ADD_TASK":
      return [action.payload, ...state]; // Adds new task to the beginning
    case "UPDATE_TASK": {
      const updatedTasks = state.map((task) =>
        task.id === action.payload.id ? { ...task, ...action.payload } : task,
      );
      // start_timeが更新された場合、タスクを再ソート
      if (action.payload.start_time !== undefined) {
        return sortTasks(updatedTasks);
      }
      return updatedTasks;
    }
    case "DELETE_TASK":
      return state.filter((task) => task.id !== action.payload);
    case "REORDER_TASKS":
      return action.payload;
    default:
      return state;
  }
};
