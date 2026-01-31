// Task型の定義
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  estimated_minute: number | null;
  task_order: number | null;
  start_time: string | null;
  end_time: string | null;
  category_id: string | null;
  created_at: string;
  task_date: string;
}

// Category型の定義
export interface Category {
  id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Action Types
export type SetTasksAction = {
  type: "SET_TASKS";
  payload: Task[];
};

export type AddTaskAction = {
  type: "ADD_TASK";
  payload: Task;
};

export type UpdateTaskAction = {
  type: "UPDATE_TASK";
  payload: Partial<Task> & { id: string }; // Requires id, and allows partial updates to other fields
};

export type DeleteTaskAction = {
  type: "DELETE_TASK";
  payload: string; // Task id
};

export type ReorderTasksAction = {
  type: "REORDER_TASKS";
  payload: Task[]; // The new ordered array of tasks
};

export type TaskAction =
  | SetTasksAction
  | AddTaskAction
  | UpdateTaskAction
  | DeleteTaskAction
  | ReorderTasksAction;
