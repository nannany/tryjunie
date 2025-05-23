import { Task, TaskAction } from '@/types/task';

// Task Reducer
export const taskReducer = (state: Task[], action: TaskAction): Task[] => {
  switch (action.type) {
    case 'SET_TASKS':
      return action.payload;
    case 'ADD_TASK':
      return [action.payload, ...state]; // Adds new task to the beginning
    case 'UPDATE_TASK':
      return state.map(task =>
        task.id === action.payload.id ? { ...task, ...action.payload } : task
      );
    case 'DELETE_TASK':
      return state.filter(task => task.id !== action.payload);
    case 'REORDER_TASKS':
      return action.payload;
    default:
      return state;
  }
};
