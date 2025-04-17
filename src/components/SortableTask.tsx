import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GripVertical, Play, Square, CheckCircle2, Trash2, X } from 'lucide-react';
import React from 'react';

// Task型の定義
interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  estimated_minute: number | null;
  task_order: number | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  task_date: string;
}

// 編集中のフィールドの型
interface EditingField {
  taskId: string;
  field: 'title' | 'estimated_minute' | 'start_time' | 'end_time';
}

const SortableTask = ({ task, onEditStart, onDelete, onTaskTimer, editingField, editValue, handleEditChange, handleEditSave, handleKeyDown, setEditValue, setEditingField }: {
  task: Task;
  onEditStart: (taskId: string, field: 'title' | 'estimated_minute' | 'start_time' | 'end_time', value: string) => void;
  onDelete: (taskId: string) => void;
  onTaskTimer: (taskId: string, action: 'start' | 'stop' | 'complete') => void;
  editingField: EditingField | null;
  editValue: string;
  handleEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditSave: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  setEditValue: (value: string) => void;
  setEditingField: (field: EditingField | null) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 見積もり時間をフォーマット
  const formatEstimatedTime = (minutes: number | null) => {
    if (!minutes) return null;
    return `${minutes}m`;
  }

  // 日時をフォーマット
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 所要時間を計算（分単位）
  const calculateDuration = (start: string | null, end: string | null): number | null => {
    if (!start || !end) return null;
    const startTime = new Date(start);
    const endTime = new Date(end);
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  };

  // 所要時間をフォーマット
  const formatDuration = (duration: number | null): string => {
    if (duration === null) return '';
    if (duration < 60) return `${duration}分`;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`;
  };

  // テキスト入力を日時に変換
  const convertTextToDateTime = (text: string) => {
    try {
      // 時間形式を検出して対応（例：「13:45」や「13時45分」など）
      let hours: number;
      let minutes: number;
      
      if (text.includes(':')) {
        // 「13:45」形式
        const [h, m] = text.split(':');
        hours = parseInt(h);
        minutes = parseInt(m);
      } else if (text.includes('時')) {
        // 「13時45分」形式
        let parts = text.split('時');
        hours = parseInt(parts[0]);
        minutes = parts[1] ? parseInt(parts[1].replace('分', '')) : 0;
      } else {
        // 数字だけの場合は時間として解釈（例：「13」→「13:00」）
        hours = parseInt(text);
        minutes = 0;
      }
      
      if (isNaN(hours) || isNaN(minutes)) {
        return null;
      }

      // 時刻が有効かチェック
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
      }
      
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toISOString();
    } catch (e) {
      console.error('時刻の解析エラー:', e);
      return null;
    }
  };

  // キーボードショートカットの処理
  const handleTaskKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 編集中の場合はショートカットを無効化
    if (editingField?.taskId === task.id) return;

    switch (e.key.toLowerCase()) {
      case 's':
        if (!task.start_time) {
          e.preventDefault();
          onTaskTimer(task.id, 'start');
        }
        break;
      case 'e':
        if (task.start_time && !task.end_time) {
          e.preventDefault();
          onTaskTimer(task.id, 'stop');
        }
        break;
      case 'd':
        e.preventDefault();
        onDelete(task.id);
        break;
      case 'arrowup':
      case 'arrowdown':
        // 上下キーのデフォルト動作を防ぐ
        e.preventDefault();
        // 親コンポーネントにイベントを伝播させる
        e.stopPropagation();

        // 現在フォーカスされている要素を取得
        const currentFocus = document.activeElement;
        if (!currentFocus) return;

        // タスク要素を取得
        const taskElements = Array.from(document.querySelectorAll('[data-task-id]'));
        const currentIndex = taskElements.indexOf(currentFocus as HTMLElement);

        if (currentIndex === -1) return;

        // 上下キーに応じて次のタスクを選択
        let nextIndex;
        if (e.key.toLowerCase() === 'arrowup') {
          nextIndex = Math.max(0, currentIndex - 1);
        } else {
          nextIndex = Math.min(taskElements.length - 1, currentIndex + 1);
        }

        // 次のタスクにフォーカスを移動
        (taskElements[nextIndex] as HTMLElement).focus();
        break;
    }
  };

  // 開始時刻の編集処理
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  // 開始時刻の保存処理
  const handleStartTimeSave = () => {
    if (editValue && editValue.trim() !== '') {
      const dateTimeValue = convertTextToDateTime(editValue);
      if (dateTimeValue) {
        setEditValue(dateTimeValue);
      }
    }
    handleEditSave();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-md border p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onKeyDown={handleTaskKeyDown}
      data-task-id={task.id}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-4">
        <div className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        {!task.start_time ? (
          <Button
            size="icon"
            variant="outline"
            onClick={() => onTaskTimer(task.id, 'start')}
            className="h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-50"
          >
            <Play className="h-4 w-4" />
          </Button>
        ) : !task.end_time ? (
          <Button
            size="icon"
            variant="outline"
            onClick={() => onTaskTimer(task.id, 'stop')}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-gray-500"
            disabled
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-grow">
          {/* タイトルフィールド */}
          {editingField?.taskId === task.id && editingField?.field === 'title' ? (
            <Input
              value={editValue}
              onChange={handleEditChange}
              onBlur={handleEditSave}
              onKeyDown={handleKeyDown}
              className="font-medium mb-2"
              autoFocus
            />
          ) : (
            <p 
              className="font-medium mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              onClick={() => onEditStart(task.id, 'title', task.title)}
            >
              {task.title}
            </p>
          )}
          
          <div className="flex gap-3 text-sm text-muted-foreground">
            {/* 見積もり時間フィールド */}
            {editingField?.taskId === task.id && editingField?.field === 'estimated_minute' ? (
              <div className="flex items-center">
                <span>見積もり: </span>
                <Input
                  type="number"
                  min="0"
                  value={editValue}
                  onChange={handleEditChange}
                  onBlur={handleEditSave}
                  onKeyDown={handleKeyDown}
                  className="w-16 h-6 text-xs mx-1"
                  autoFocus
                />
                <span>分</span>
              </div>
            ) : (
              <p 
                className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={() => 
                  onEditStart(
                    task.id, 
                    'estimated_minute', 
                    task.estimated_minute ? task.estimated_minute.toString() : ''
                  )
                }
              >
                見積もり: {formatEstimatedTime(task.estimated_minute) || '0分 (クリックして設定)'}
              </p>
            )}

            {/* 開始時間フィールド */}
            {editingField?.taskId === task.id && editingField?.field === 'start_time' ? (
              <div className="flex items-center">
                <span>開始: </span>
                <Input
                  type="text"
                  placeholder="--:--"
                  value={editValue ? (editValue.includes('T') ? 
                    new Date(editValue).toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit' }) : 
                    editValue) : ''}
                  onChange={handleStartTimeChange}
                  onBlur={handleStartTimeSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleStartTimeSave();
                    } else if (e.key === 'Escape') {
                      setEditingField(null);
                    }
                  }}
                  className="w-24 h-6 text-xs mx-1"
                  autoFocus
                />
              </div>
            ) : (
              <p 
                className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={() => 
                  onEditStart(
                    task.id, 
                    'start_time', 
                    task.start_time || ''
                  )
                }
              >
                開始: {formatDateTime(task.start_time) || '(クリックして設定)'}
              </p>
            )}

            {/* 終了時間フィールド */}
            {editingField?.taskId === task.id && editingField?.field === 'end_time' ? (
              <div className="flex items-center">
                <span>終了: </span>
                <Input
                  type="text"
                  placeholder="--:--"
                  value={editValue ? (editValue.includes('T') ? 
                    new Date(editValue).toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit' }) : 
                    editValue) : ''}
                  onChange={(e) => {
                    setEditValue(e.target.value);
                  }}
                  onBlur={() => {
                    if (editValue && editValue.trim() !== '') {
                      const dateTimeValue = convertTextToDateTime(editValue);
                      if (dateTimeValue) {
                        setEditValue(dateTimeValue);
                      }
                    }
                    handleEditSave();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editValue && editValue.trim() !== '') {
                        const dateTimeValue = convertTextToDateTime(editValue);
                        if (dateTimeValue) {
                          setEditValue(dateTimeValue);
                        }
                      }
                      handleEditSave();
                    } else if (e.key === 'Escape') {
                      setEditingField(null);
                    }
                  }}
                  className="w-24 h-6 text-xs mx-1"
                  autoFocus
                />
              </div>
            ) : (
              <p 
                className={cn(
                  "cursor-pointer hover:bg-gray-50 p-1 rounded",
                  !task.start_time && "text-gray-400 cursor-not-allowed"
                )}
                onClick={() => {
                  if (task.start_time) {
                    onEditStart(
                      task.id, 
                      'end_time', 
                      task.end_time || ''
                    );
                  }
                }}
              >
                終了: {formatDateTime(task.end_time) || '(クリックして設定)'}
              </p>
            )}

            {/* 所要時間の表示 */}
            {task.start_time && task.end_time && (
              <p className="text-sm text-muted-foreground">
                所要時間: {formatDuration(calculateDuration(task.start_time, task.end_time))}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <Button 
          size="icon" 
          variant="outline"
          onClick={() => onDelete(task.id)}
          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SortableTask;