import { Input } from "@/components/ui/input";
import { Task } from "@/types/task";
import { useTaskContext } from "@/contexts/TaskContext";

interface TaskTitleFieldProps {
  task: Task;
  categoryColor?: string;
}

export const TaskTitleField = ({
  task,
  categoryColor = "#374151",
}: TaskTitleFieldProps) => {
  // TaskContextから必要な値を取得
  const { taskEdit } = useTaskContext();
  const {
    editingField,
    editValue,
    handleEditStart,
    handleEditChange,
    handleEditSave,
    handleKeyDown,
  } = taskEdit;
  const isEditing =
    editingField?.taskId === task.id && editingField?.field === "title";

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={handleEditChange}
        onBlur={() => handleEditSave()}
        onKeyDown={handleKeyDown}
        className="font-medium mb-2"
        autoFocus
      />
    );
  }

  return (
    <p
      className="font-medium mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
      style={{ color: categoryColor }}
      onClick={() => handleEditStart(task.id, "title", task.title)}
    >
      {task.title}
    </p>
  );
};
