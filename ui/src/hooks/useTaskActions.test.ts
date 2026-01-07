import { describe, it, expect } from "vitest";
import { taskReducer } from "@/reducers/taskReducer";
import { Task } from "@/types/task";

describe("Task Pause Functionality", () => {
  const mockRunningTask: Task = {
    id: "1",
    user_id: "user1",
    title: "タスク1",
    description: "説明",
    estimated_minute: 30,
    task_order: 1,
    start_time: "2024-01-01T10:00:00Z",
    end_time: null,
    category_id: "cat1",
    created_at: "2024-01-01T00:00:00Z",
    task_date: "2024-01-01",
  };

  const mockTask2: Task = {
    id: "2",
    user_id: "user1",
    title: "タスク2",
    description: "",
    estimated_minute: 20,
    task_order: 2,
    start_time: null,
    end_time: null,
    category_id: null,
    created_at: "2024-01-01T00:00:00Z",
    task_date: "2024-01-01",
  };

  describe("pause task behavior (completing task and creating new one)", () => {
    it("should complete a running task by setting end_time", () => {
      const initialState = [mockRunningTask, mockTask2];

      // タスクを完了させる（end_timeを設定）
      const action = {
        type: "UPDATE_TASK" as const,
        payload: {
          id: "1",
          end_time: "2024-01-01T11:00:00Z",
        },
      };

      const newState = taskReducer(initialState, action);

      // タスクが完了していることを確認
      const completedTask = newState.find((t) => t.id === "1");
      expect(completedTask?.end_time).toBe("2024-01-01T11:00:00Z");
    });

    it("should add a new task with same attributes after pausing", () => {
      const initialState = [mockTask2];

      // 同じ属性で新しいタスクを追加
      const newTask: Task = {
        id: "3",
        user_id: mockRunningTask.user_id,
        title: mockRunningTask.title,
        description: mockRunningTask.description,
        estimated_minute: mockRunningTask.estimated_minute,
        task_order: null,
        start_time: null,
        end_time: null,
        category_id: mockRunningTask.category_id,
        created_at: "2024-01-01T11:00:00Z",
        task_date: mockRunningTask.task_date,
      };

      const action = {
        type: "ADD_TASK" as const,
        payload: newTask,
      };

      const newState = taskReducer(initialState, action);

      // 新しいタスクが追加されたことを確認
      expect(newState).toHaveLength(2);
      const addedTask = newState.find((t) => t.id === "3");
      expect(addedTask).toBeDefined();
      expect(addedTask?.title).toBe(mockRunningTask.title);
      expect(addedTask?.estimated_minute).toBe(mockRunningTask.estimated_minute);
      expect(addedTask?.category_id).toBe(mockRunningTask.category_id);
      expect(addedTask?.start_time).toBeNull();
      expect(addedTask?.end_time).toBeNull();
    });

    it("should complete original task and add new task in sequence (simulating pause)", () => {
      const initialState = [mockRunningTask, mockTask2];

      // ステップ1: 実行中のタスクを完了
      const completeAction = {
        type: "UPDATE_TASK" as const,
        payload: {
          id: "1",
          end_time: "2024-01-01T11:00:00Z",
        },
      };

      const stateAfterComplete = taskReducer(initialState, completeAction);
      const completedTask = stateAfterComplete.find((t) => t.id === "1");
      expect(completedTask?.end_time).toBe("2024-01-01T11:00:00Z");

      // ステップ2: 同じ属性で新しいタスクを追加
      const newTask: Task = {
        id: "3",
        user_id: mockRunningTask.user_id,
        title: mockRunningTask.title,
        description: mockRunningTask.description,
        estimated_minute: mockRunningTask.estimated_minute,
        task_order: null,
        start_time: null,
        end_time: null,
        category_id: mockRunningTask.category_id,
        created_at: "2024-01-01T11:00:00Z",
        task_date: mockRunningTask.task_date,
      };

      const addAction = {
        type: "ADD_TASK" as const,
        payload: newTask,
      };

      const finalState = taskReducer(stateAfterComplete, addAction);

      // 最終的な状態を確認
      expect(finalState).toHaveLength(3);

      // 元のタスクが完了している
      const original = finalState.find((t) => t.id === "1");
      expect(original?.end_time).toBe("2024-01-01T11:00:00Z");

      // 新しいタスクが未開始状態で追加されている
      const newTaskInState = finalState.find((t) => t.id === "3");
      expect(newTaskInState).toBeDefined();
      expect(newTaskInState?.title).toBe(mockRunningTask.title);
      expect(newTaskInState?.start_time).toBeNull();
      expect(newTaskInState?.end_time).toBeNull();
    });
  });
});
