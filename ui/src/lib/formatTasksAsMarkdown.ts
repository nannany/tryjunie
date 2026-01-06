import { Task } from "@/types/task";

/**
 * Format tasks as Markdown checkboxes
 * Completed tasks (with end_time) are marked as [x], others as [ ]
 */
export function formatTasksAsMarkdown(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "";
  }

  return tasks
    .map((task) => {
      const isCompleted = task.end_time !== null;
      const checkbox = isCompleted ? "[x]" : "[ ]";
      return `- ${checkbox} ${task.title}`;
    })
    .join("\n");
}
