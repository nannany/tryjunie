import { describe, it, expect } from "vitest";
import { formatTasksAsMarkdown } from "./formatTasksAsMarkdown";
import { Task } from "@/types/task";

describe("formatTasksAsMarkdown", () => {
  const mockTask1: Task = {
    id: "1",
    user_id: "user1",
    title: "未完了タスク1",
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
    title: "完了タスク",
    description: "",
    estimated_minute: 20,
    task_order: 2,
    start_time: "2024-01-01T10:00:00Z",
    end_time: "2024-01-01T10:30:00Z",
    category_id: null,
    created_at: "2024-01-01T00:00:00Z",
    task_date: "2024-01-01",
  };

  const mockTask3: Task = {
    id: "3",
    user_id: "user1",
    title: "未完了タスク2",
    description: "",
    estimated_minute: 15,
    task_order: 3,
    start_time: null,
    end_time: null,
    category_id: null,
    created_at: "2024-01-01T00:00:00Z",
    task_date: "2024-01-01",
  };

  it("should format tasks as markdown checkboxes", () => {
    const result = formatTasksAsMarkdown([mockTask1, mockTask2, mockTask3]);
    const expected = `- [ ] 未完了タスク1
- [x] 完了タスク
- [ ] 未完了タスク2`;
    expect(result).toBe(expected);
  });

  it("should return empty string for empty task list", () => {
    const result = formatTasksAsMarkdown([]);
    expect(result).toBe("");
  });

  it("should mark tasks with end_time as completed", () => {
    const result = formatTasksAsMarkdown([mockTask2]);
    expect(result).toBe("- [x] 完了タスク");
  });

  it("should mark tasks without end_time as incomplete", () => {
    const result = formatTasksAsMarkdown([mockTask1]);
    expect(result).toBe("- [ ] 未完了タスク1");
  });

  it("should handle single task", () => {
    const result = formatTasksAsMarkdown([mockTask1]);
    expect(result).toBe("- [ ] 未完了タスク1");
  });

  it("should handle tasks with special characters in title", () => {
    const specialTask: Task = {
      ...mockTask1,
      title: "タスク [重要] & 必須",
    };
    const result = formatTasksAsMarkdown([specialTask]);
    expect(result).toBe("- [ ] タスク [重要] & 必須");
  });
});
