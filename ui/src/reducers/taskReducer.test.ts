import { describe, it, expect } from "vitest";
import { taskReducer } from "./taskReducer";
import { Task } from "@/types/task";

describe("taskReducer", () => {
  const mockTask1: Task = {
    id: "1",
    user_id: "user1",
    title: "Task 1",
    description: "",
    estimated_minute: 30,
    task_order: 1,
    start_time: null,
    end_time: null,
    category_id: null,
    created_at: "2024-01-01T00:00:00Z",
    task_date: "2024-01-01",
  };

  const mockTask2: Task = {
    id: "2",
    user_id: "user1",
    title: "Task 2",
    description: "",
    estimated_minute: 20,
    task_order: 2,
    start_time: null,
    end_time: null,
    category_id: null,
    created_at: "2024-01-01T00:00:00Z",
    task_date: "2024-01-01",
  };

  const mockTask3: Task = {
    id: "3",
    user_id: "user1",
    title: "Task 3",
    description: "",
    estimated_minute: 15,
    task_order: 3,
    start_time: null,
    end_time: null,
    category_id: null,
    created_at: "2024-01-01T00:00:00Z",
    task_date: "2024-01-01",
  };

  describe("UPDATE_TASK with start_time", () => {
    it("should re-sort tasks when a task's start_time is updated", () => {
      const initialState = [mockTask1, mockTask2, mockTask3];
      
      // Task2のstart_timeを設定
      const action = {
        type: "UPDATE_TASK" as const,
        payload: {
          id: "2",
          start_time: "2024-01-01T10:00:00Z",
        },
      };

      const newState = taskReducer(initialState, action);

      // Task2がstart_timeを持つため、最後に移動するはず
      expect(newState[0].id).toBe("1");
      expect(newState[1].id).toBe("3");
      expect(newState[2].id).toBe("2");
      expect(newState[2].start_time).toBe("2024-01-01T10:00:00Z");
    });

    it("should re-sort tasks when start_time is set to null", () => {
      const task1WithStart = { ...mockTask1, start_time: "2024-01-01T10:00:00Z" };
      const initialState = [mockTask2, mockTask3, task1WithStart];

      // Task1のstart_timeをnullに設定
      const action = {
        type: "UPDATE_TASK" as const,
        payload: {
          id: "1",
          start_time: null,
        },
      };

      const newState = taskReducer(initialState, action);

      // Task1がstart_time: nullになるため、task_orderに基づいて先頭に移動
      expect(newState[0].id).toBe("1");
      expect(newState[1].id).toBe("2");
      expect(newState[2].id).toBe("3");
      expect(newState[0].start_time).toBeNull();
    });

    it("should sort tasks by start_time when multiple tasks have start_time", () => {
      const task1WithStart = { ...mockTask1, start_time: "2024-01-01T12:00:00Z" };
      const task2WithStart = { ...mockTask2, start_time: "2024-01-01T10:00:00Z" };
      const initialState = [task1WithStart, task2WithStart, mockTask3];

      // Task3のstart_timeを設定（最も早い時刻）
      const action = {
        type: "UPDATE_TASK" as const,
        payload: {
          id: "3",
          start_time: "2024-01-01T09:00:00Z",
        },
      };

      const newState = taskReducer(initialState, action);

      // start_timeが早い順にソート: Task3(9:00) -> Task2(10:00) -> Task1(12:00)
      expect(newState[0].id).toBe("3");
      expect(newState[1].id).toBe("2");
      expect(newState[2].id).toBe("1");
    });

    it("should keep tasks without start_time at the beginning", () => {
      const task1WithStart = { ...mockTask1, start_time: "2024-01-01T10:00:00Z" };
      const initialState = [mockTask2, mockTask3, task1WithStart];

      // Task2のstart_timeを設定
      const action = {
        type: "UPDATE_TASK" as const,
        payload: {
          id: "2",
          start_time: "2024-01-01T11:00:00Z",
        },
      };

      const newState = taskReducer(initialState, action);

      // Task3（start_time: null）が先頭、その後start_timeの早い順
      expect(newState[0].id).toBe("3");
      expect(newState[1].id).toBe("1");
      expect(newState[2].id).toBe("2");
    });

    it("should sort by task_order when start_time is null", () => {
      const task1Order5 = { ...mockTask1, task_order: 5 };
      const task2Order3 = { ...mockTask2, task_order: 3 };
      const task3Order7 = { ...mockTask3, task_order: 7 };
      const initialState = [task1Order5, task2Order3, task3Order7];

      // Task1のstart_timeを設定
      const action = {
        type: "UPDATE_TASK" as const,
        payload: {
          id: "1",
          start_time: "2024-01-01T10:00:00Z",
        },
      };

      const newState = taskReducer(initialState, action);

      // start_timeがnullのものはtask_orderでソート: Task2(3) -> Task3(7)、その後Task1
      expect(newState[0].id).toBe("2");
      expect(newState[1].id).toBe("3");
      expect(newState[2].id).toBe("1");
    });
  });

  describe("UPDATE_TASK without start_time", () => {
    it("should not re-sort tasks when start_time is not updated", () => {
      const initialState = [mockTask1, mockTask2, mockTask3];

      const action = {
        type: "UPDATE_TASK" as const,
        payload: {
          id: "2",
          title: "Updated Task 2",
        },
      };

      const newState = taskReducer(initialState, action);

      // 順序は変わらないはず
      expect(newState[0].id).toBe("1");
      expect(newState[1].id).toBe("2");
      expect(newState[2].id).toBe("3");
      expect(newState[1].title).toBe("Updated Task 2");
    });
  });

  describe("Other actions", () => {
    it("should handle SET_TASKS", () => {
      const newState = taskReducer([], {
        type: "SET_TASKS",
        payload: [mockTask1, mockTask2],
      });

      expect(newState).toHaveLength(2);
      expect(newState[0].id).toBe("1");
      expect(newState[1].id).toBe("2");
    });

    it("should handle ADD_TASK", () => {
      const initialState = [mockTask1];
      const newState = taskReducer(initialState, {
        type: "ADD_TASK",
        payload: mockTask2,
      });

      expect(newState).toHaveLength(2);
      expect(newState[0].id).toBe("2"); // 新しいタスクは先頭に追加
      expect(newState[1].id).toBe("1");
    });

    it("should handle DELETE_TASK", () => {
      const initialState = [mockTask1, mockTask2, mockTask3];
      const newState = taskReducer(initialState, {
        type: "DELETE_TASK",
        payload: "2",
      });

      expect(newState).toHaveLength(2);
      expect(newState.find((t) => t.id === "2")).toBeUndefined();
    });

    it("should handle REORDER_TASKS", () => {
      const initialState = [mockTask1, mockTask2, mockTask3];
      const reorderedTasks = [mockTask3, mockTask1, mockTask2];

      const newState = taskReducer(initialState, {
        type: "REORDER_TASKS",
        payload: reorderedTasks,
      });

      expect(newState[0].id).toBe("3");
      expect(newState[1].id).toBe("1");
      expect(newState[2].id).toBe("2");
    });
  });
});
