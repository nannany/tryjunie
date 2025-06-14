import React, {
  Suspense,
  useEffect,
  useReducer,
  useState,
  startTransition,
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
import { Task } from "@/types/task";
import { taskReducer } from "@/reducers/taskReducer";
import { useTaskEdit } from "@/hooks/useTaskEdit";
import { useTaskActions } from "@/hooks/useTaskActions";

const supabase = createClient();


const TaskList = () => {
  const { user } = useSupabaseUser();

  const [tasks, dispatch] = useReducer(taskReducer, []);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );

  const { toast } = useToast();

  // フックを使用
  const taskEdit = useTaskEdit(dispatch);
  const taskActions = useTaskActions(dispatch);

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

  // ドラッグ&ドロップのセンサーを設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 5,
      },
    }),
  );

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
          dispatch({ type: "SET_TASKS", payload: data as Task[] });
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
        dispatch({ type: "ADD_TASK", payload: data[0] as Task });

        // 入力フィールドをリセット
        setNewTaskTitle("");
      }
    });
  };

  // キー入力イベントを処理
  const handleNewTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
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


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
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
            <Input
              placeholder="新しいタスク名を入力"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleNewTaskKeyDown}
              className="flex-1"
            />
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
                      <SortableTask
                        key={task.id}
                        task={task}
                        taskEdit={taskEdit}
                        taskActions={taskActions}
                        lastTaskEndTime={lastTaskEndTime}
                      />
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
  );
};

export default TaskList;
