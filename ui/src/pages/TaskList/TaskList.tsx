import React, {
  Suspense,
  useEffect,
  useReducer,
  useState,
  startTransition,
  useCallback,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/lib/supabase/hooks/useSupabaseUser";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTask } from "@/components/task";
import { Task, Category } from "@/types/task";
import { taskReducer } from "@/reducers/taskReducer";
import { useTaskEdit } from "@/hooks/useTaskEdit";
import { useTaskActions } from "@/hooks/useTaskActions";
import { CurrentTaskFooter } from "@/components/CurrentTaskFooter";
import { TaskProvider, TaskContextType } from "@/contexts/TaskContext";

const supabase = createClient();

const TaskList = () => {
  const { user } = useSupabaseUser();

  const [tasks, dispatch] = useReducer(taskReducer, []);
  const [categories, setCategories] = useState<Category[]>([]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [taskSuggestions, setTaskSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const debounceTimeoutRef = useRef<number | null>(null);

  const { toast } = useToast();

  // フックを使用
  const taskEdit = useTaskEdit(dispatch);
  const taskActions = useTaskActions(dispatch);

  // 過去のタスク名を検索
  const searchTaskNames = useCallback(
    async (query: string) => {
      if (!query.trim() || !user?.id) {
        setTaskSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("title")
        .eq("user_id", user.id)
        .ilike("title", `%${query}%`)
        .neq("title", query)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error searching task names:", error);
        return;
      }

      const uniqueTitles = Array.from(
        new Set(data?.map((task) => task.title as string) || []),
      );
      setTaskSuggestions(uniqueTitles);
      setShowSuggestions(uniqueTitles.length > 0);
    },
    [user?.id],
  );

  // デバウンス付きの検索
  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(() => {
        searchTaskNames(query);
      }, 300);
    },
    [searchTaskNames],
  );

  // 最終タスクの終了時間を取得
  // tasksのうち、最も終了時間が遅いタスクの終了時間を取得
  const lastTaskEndTime = tasks.reduce<string | null>((latest, task) => {
    if (task.end_time) {
      const endTime = new Date(task.end_time);
      const latestTime = latest !== null ? new Date(latest) : null;
      return latestTime && latestTime > endTime ? latest : task.end_time;
    }
    return latest;
  }, null);

  // 現在実行中のタスクを取得（start_timeがあってend_timeがないタスク）
  const currentRunningTask = tasks.find(
    (task) => task.start_time && !task.end_time,
  );

  // ドラッグ&ドロップのセンサーを設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 5,
      },
    }),
  );

  // カテゴリを取得
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
      } else if (data) {
        setCategories((data as unknown as Category[]) || []);
      }
    })();
  }, []);

  // タスクを取得
  useEffect(() => {
    if (selectedDate) {
      (async (date: Date) => {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq(
            "task_date",
            convertDateStringToDate(
              date
                .toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
                .split(" ")[0],
            ),
          )
          .order("start_time", { ascending: true, nullsFirst: true })
          .order("task_order", { ascending: true, nullsFirst: true });

        if (error) {
          console.error("Error fetching tasks:", error);
        } else if (data) {
          dispatch({
            type: "SET_TASKS",
            payload: (data as unknown as Task[]) || [],
          });
        }
      })(selectedDate);
    }
  }, [selectedDate]);

  // 完了予定時刻を計算
  const calculateEndTime = (minutes: number | null) => {
    if (!minutes) return null;
    const now = new Date();
    const endTime = new Date(now.getTime() + minutes * 60000);
    return endTime.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // 合計見積もり時間を計算
  const totalEstimatedMinutes = tasks.reduce((sum, task) => {
    // end_timeが設定されているタスクは除外
    if (task.end_time) return sum;
    return sum + (task.estimated_minute || 0);
  }, 0);

  // 2025/4/4 のような文字列をpostgresのdate型として扱える文字列(2025-04-04)に変換
  const convertDateStringToDate = (dateString: string) => {
    const [year, month, day] = dateString.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  // タスク繰り返し機能
  const handleRepeatTask = async (originalTask: Task) => {
    if (!selectedDate || !user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated or date not selected",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      // 同じ名前、同じカテゴリーで新しいタスクを作成
      const newTask = {
        title: originalTask.title,
        description: originalTask.description,
        user_id: user.id,
        estimated_minute: originalTask.estimated_minute,
        category_id: originalTask.category_id,
        task_date: convertDateStringToDate(
          selectedDate
            .toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
            .split(" ")[0],
        ),
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(newTask)
        .select();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to repeat task",
          variant: "destructive",
        });
        console.error("Error repeating task:", error);
      } else {
        const createdTask = (data?.[0] as unknown as Task) || ({} as Task);

        // 新しく作成したタスクをリストに追加
        dispatch({
          type: "ADD_TASK",
          payload: createdTask,
        });

        // 新しいタスクを自動的に開始
        taskActions.handleTaskTimer(createdTask.id, "start");

        toast({
          title: "Success",
          description: `タスク "${originalTask.title}" を繰り返し作成し、開始しました`,
        });
      }
    });
  };

  // クイックタスク追加
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: "Validation Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    // ユーザー情報を取得
    const userId = user?.id;

    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      // 新しいタスクを作成
      const newTask = {
        title: newTaskTitle,
        description: "",
        user_id: userId,
        estimated_minute: null,
        task_date: convertDateStringToDate(
          selectedDate
            .toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
            .split(" ")[0],
        ),
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(newTask)
        .select();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add task",
          variant: "destructive",
        });
        console.error("Error adding task:", error);
      } else {
        // 新しく追加されたタスクをリストの先頭に追加
        dispatch({
          type: "ADD_TASK",
          payload: (data?.[0] as unknown as Task) || ({} as Task),
        });

        // 入力フィールドをリセット
        setNewTaskTitle("");
      }
    });
  };

  // 提案を選択
  const selectSuggestion = async (suggestion: string) => {
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setNewTaskTitle("");

    // 提案されたタスク名で直接タスクを追加
    if (!selectedDate || !user?.id) return;

    startTransition(async () => {
      const newTask = {
        title: suggestion,
        description: "",
        user_id: user.id,
        estimated_minute: null,
        task_date: convertDateStringToDate(
          selectedDate
            .toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
            .split(" ")[0],
        ),
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(newTask)
        .select();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add task",
          variant: "destructive",
        });
        console.error("Error adding task:", error);
      } else {
        dispatch({
          type: "ADD_TASK",
          payload: (data?.[0] as unknown as Task) || ({} as Task),
        });
      }
    });
  };

  // キー入力イベントを処理
  const handleNewTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < taskSuggestions.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : taskSuggestions.length - 1,
        );
      } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(taskSuggestions[selectedSuggestionIndex]);
        } else {
          handleAddTask();
        }
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleAddTask();
    }
  };

  // 入力変更処理
  const handleTaskTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewTaskTitle(value);
    setSelectedSuggestionIndex(-1);
    debouncedSearch(value);
  };

  // ドラッグ&ドロップの処理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      dispatch({ type: "REORDER_TASKS", payload: newTasks });

      // over.id の taskを取得
      const overTask = tasks.find((task) => task.id === over.id);

      // データベースの順序を更新。 update_task_order 関数を呼び出す
      const { error } = await supabase.rpc("update_task_order", {
        p_id: active.id,
        p_user_id: overTask?.user_id,
        p_task_date: overTask?.task_date,
        p_task_order: overTask?.task_order,
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update task order",
          variant: "destructive",
        });
        console.error("Error updating task order:", error);
      }
    }
  };

  // TaskContextの値を準備
  const taskContextValue: TaskContextType = {
    tasks,
    categories,
    lastTaskEndTime,
    currentRunningTask: currentRunningTask || null,
    taskEdit,
    taskActions: {
      ...taskActions,
      handleRepeatTask,
    },
  };

  return (
    <TaskProvider value={taskContextValue}>
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div>
            {totalEstimatedMinutes > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {totalEstimatedMinutes > 0 && (
                  <span className="ml-2">
                    完了予定: {calculateEndTime(totalEstimatedMinutes)}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="text-right">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: ja })
                  ) : (
                    <span>日付を選択</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  locale={ja}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* クイックタスク追加フォーム */}
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  placeholder="新しいタスク名を入力"
                  value={newTaskTitle}
                  onChange={handleTaskTitleChange}
                  onKeyDown={handleNewTaskKeyDown}
                  className="w-full"
                  onBlur={() => {
                    // 少し遅延してから非表示にする（クリックイベントを処理するため）
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  onFocus={() => {
                    if (taskSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                />
                {showSuggestions && taskSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {taskSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion}
                        className={cn(
                          "px-3 py-2 cursor-pointer hover:bg-gray-100",
                          selectedSuggestionIndex === index &&
                            "bg-blue-50 text-blue-600",
                        )}
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                クイック追加
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>タスク一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <p className="text-center text-muted-foreground">
                  タスクを読み込み中...
                </p>
              }
            >
              <div className="space-y-4">
                {tasks.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={tasks.map((task) => task.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {tasks.map((task) => (
                        <SortableTask key={task.id} task={task} />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  <p className="text-center text-muted-foreground">
                    タスクが見つかりません
                  </p>
                )}
              </div>
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* 現在実行中のタスクフッター */}
      <CurrentTaskFooter
        currentTask={currentRunningTask || null}
        categories={categories}
        onTaskTimer={taskActions.handleTaskTimer}
      />
    </TaskProvider>
  );
};

export default TaskList;
