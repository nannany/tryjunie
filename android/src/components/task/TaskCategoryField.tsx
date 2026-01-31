import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Tag } from "lucide-react";
import { Task, Category } from "@/types/task";
import { useTaskContext } from "@/contexts/TaskContext";

interface TaskCategoryFieldProps {
  task: Task;
  categories: Category[];
}

export const TaskCategoryField = ({
  task,
  categories,
}: TaskCategoryFieldProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { taskEdit } = useTaskContext();
  const { editingField, handleEditStart, setEditValue, handleEditSave } =
    taskEdit;

  const isEditing =
    editingField?.taskId === task.id && editingField?.field === "category_id";
  const fieldValue = task.category_id;

  // 現在選択されているカテゴリを取得
  const selectedCategory = categories.find((cat) => cat.id === fieldValue);

  // カテゴリ選択時の処理
  const handleCategorySelect = (categoryId: string) => {
    setPopoverOpen(false);
    setEditValue(categoryId);

    // useTaskEditのhandleEditSaveを使用してグローバル状態も更新
    handleEditSave(categoryId);
  };

  // カテゴリの色を取得
  const getCategoryColor = (category: Category | undefined) => {
    return category?.color || "#6b7280";
  };

  // カテゴリアイコンの色スタイル
  const getCategoryIconStyle = (category: Category | undefined) => {
    const color = getCategoryColor(category);
    return { color };
  };

  // カテゴリテキストの色スタイル
  const getCategoryTextStyle = (category: Category | undefined) => {
    const color = getCategoryColor(category);
    return { color };
  };

  if (isEditing) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center cursor-pointer">
            <Tag
              className="h-4 w-4 mr-1"
              style={getCategoryIconStyle(selectedCategory)}
            />
            <span>カテゴリ: </span>
            <div className="relative flex items-center">
              <Button
                variant="outline"
                className="h-6 text-xs mx-1 pr-7 justify-start"
                style={getCategoryTextStyle(selectedCategory)}
              >
                {selectedCategory?.name || "未選択"}
              </Button>
              <ChevronDown className="absolute right-2 h-4 w-4 opacity-50" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent data-popover-content className="w-48 p-0" align="start">
          <div className="grid">
            <Button
              variant="ghost"
              className="justify-start text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleCategorySelect("")}
            >
              <Tag className="h-4 w-4 mr-2" style={{ color: "#6b7280" }} />
              未選択
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                className="justify-start text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleCategorySelect(category.id)}
                style={getCategoryTextStyle(category)}
              >
                <Tag
                  className="h-4 w-4 mr-2"
                  style={getCategoryIconStyle(category)}
                />
                {category.name}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <button
      type="button"
      className="cursor-pointer hover:bg-gray-50 p-1 rounded flex items-center text-left"
      onClick={() => {
        handleEditStart(task.id, "category_id", fieldValue || "");
      }}
    >
      <Tag
        className="h-4 w-4 mr-1"
        style={getCategoryIconStyle(selectedCategory)}
      />
      <span style={getCategoryTextStyle(selectedCategory)}>
        カテゴリ: {selectedCategory?.name || "(未選択)"}
      </span>
    </button>
  );
};
