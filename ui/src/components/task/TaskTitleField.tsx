import { Input } from "@/components/ui/input";
import { TaskEditProps } from "./types";

interface TaskTitleFieldProps extends TaskEditProps {}

export const TaskTitleField = ({
  task,
  editingField,
  editValue,
  onEditStart,
  handleEditChange,
  handleEditSave,
  handleKeyDown,
}: TaskTitleFieldProps) => {
  const isEditing =
    editingField?.taskId === task.id && editingField?.field === "title";

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={handleEditChange}
        onBlur={handleEditSave}
        onKeyDown={handleKeyDown}
        className="font-medium mb-2"
        autoFocus
      />
    );
  }

  return (
    <p
      className="font-medium mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
      onClick={() => onEditStart(task.id, "title", task.title)}
    >
      {task.title}
    </p>
  );
};
