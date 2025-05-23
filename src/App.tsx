import { useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// -------------------------
// タスク型定義
// -------------------------
type Task = {
  id: number;         // 一意のID
  title: string;      // タスク名
  dueDate: string;    // 締切日 (yyyy-MM-dd)
  isDone: boolean;    // 完了フラグ
};

function App() {
  // -------------------------
  // 各種状態管理
  // -------------------------

  // タスク一覧(localStorage を使って初期値にする)
  const [tasks, setTasks] = useState<Task[]>(() => { 
    try {
      const stored = localStorage.getItem('tasks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [title, setTitle] = useState('');                     // 入力タスク名
  const [message, setMessage] = useState('');                 // メッセージ表示
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // カレンダー選択日
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // メッセージタイマー

  //今日の日付を yyyy-MM-dd 形式で表示
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });                 // 入力日付

  // -------------------------
  // メッセージ表示（3秒で消える）
  // -------------------------
  const showMessage = (msg: string) => {
    setMessage(msg);
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = setTimeout(() => setMessage(''), 3000);
  };

  // -------------------------
  // タスク追加処理
  // -------------------------
  const addTask = () => {
    if (!title || !dueDate) {
      showMessage('⚠ タスク名と日付を入力してください');
      return;
    }
    const newTask: Task = {
      id: Date.now(),
      title,
      dueDate,
      isDone: false,
    };
    setTasks([newTask, ...tasks]);
    setTitle('');
    setDueDate('');
    showMessage('✅ タスクを追加しました！');
  };

  // -------------------------
  // タスク削除処理（確認あり）
  // -------------------------
  const deleteTask = (id: number) => {
    if (window.confirm('本当に削除しますか？')) {
      setTasks(tasks.filter((task) => task.id !== id));
      showMessage('🚮 タスクを削除しました。');
    } else {
      showMessage('キャンセルされました');
    }
  };

  //タスクの保存（localStorageに保存）
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // -------------------------
  // タスク完了トグル（チェック切替）
  // -------------------------
  const toggleTaskDone = (id: number) => {
    const updated = tasks.map((task) =>
      task.id === id ? { ...task, isDone: !task.isDone } : task
    );
    setTasks(updated);
  };

  // -------------------------
  // 日付判定関数（同日 / 今週）
  // -------------------------
  const isSameDay = (d1: Date, d2: Date) =>
    d1.toDateString() === d2.toDateString();

  const isInThisWeek = (date: Date) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(now);
    end.setDate(now.getDate() + (6 - now.getDay()));
    return date >= start && date <= end && !isSameDay(date, now);
  };

  // -------------------------
  // タスク分類（今日・今週・その他・選択日）
  // -------------------------
  const today = new Date();
  const todayTasks = tasks.filter((task) => isSameDay(new Date(task.dueDate), today));
  const thisWeekTasks = tasks.filter((task) => isInThisWeek(new Date(task.dueDate)));
  const otherTasks = tasks.filter((task) =>
    !isSameDay(new Date(task.dueDate), today) && !isInThisWeek(new Date(task.dueDate))
  );
  const selectedDateTasks = tasks.filter((task) =>
    selectedDate ? isSameDay(new Date(task.dueDate), selectedDate) : false
  );

  // -------------------------
  // 共通のタスク表示コンポーネント
  // -------------------------
  const TaskList = ({ tasks }: { tasks: Task[] }) => (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="bg-white p-2 rounded shadow flex justify-between items-center"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={task.isDone}
              onChange={() => toggleTaskDone(task.id)}
            />
            <span className={task.isDone ? "line-through text-gray-400" : "text-sm break-words max-w-[140px] sm:max-w-none"}>
              {task.title}（{task.dueDate}）
            </span>
          </div>
          <button
            onClick={() => deleteTask(task.id)}
            className="text-xs text-red-500 hover:underline"
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ffe9c9] to-[#fdd3c4] flex justify-center pt-6 sm:pt-12 px-2">
      <div className="max-w-2xl w-full p-4 sm:p-8 bg-white rounded-lg shadow">
        {/* アプリタイトル */}
        <h1 className="text-2xl font-bold mb-6 text-center">📝 ToDoアプリ</h1>

        {/* 入力フォーム */}
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <input
              type="text"
              placeholder="タスク内容"
              className="border border-gray-300 rounded p-2 flex-grow text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="date"
              className="border border-gray-300 rounded p-2 w-full sm:w-auto text-sm"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <button
              onClick={addTask}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 sm:py-3 rounded text-sm w-full sm:w-[80px]"
            >
              追加
            </button>
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="mb-4 text-center text-sm text-red-600 font-semibold">
            {message}
          </div>
        )}

        {/* カレンダー */}
        <div className="flex flex-col items-center mb-6">
          <label className="text-sm font-semibold text-gray-700 mb-2">📆 日付を選択</label>
          <div className="w-full sm:w-auto">
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            className="w-full border px-3 py-2 rounded shadow"
          />
          </div>
        </div>

        {/* 選択した日のタスク */}
        <div className="bg-blue-100 p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-bold mb-2">📅 選択した日のタスク</h2>
          {selectedDateTasks.length > 0 ? (
            <TaskList tasks={selectedDateTasks} />
          ) : (
            <p className="text-sm text-gray-500">タスクはありません</p>
          )}
        </div>

        {/* カンバン風タスク表示（今日・今週・その他） */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
          {[{
            label: '📅 今日',
            tasks: todayTasks,
            bg: 'bg-red-100'
          }, {
            label: '🗓 今週',
            tasks: thisWeekTasks,
            bg: 'bg-green-100'
          }, {
            label: '📌 その他',
            tasks: otherTasks,
            bg: 'bg-gray-200'
          }].map(({ label, tasks, bg }, idx) => (
            <div key={idx} className={`${bg} p-4 rounded shadow`}>
              <h2 className="font-bold mb-2">{label}</h2>
              {tasks.length > 0 ? (
                <TaskList tasks={tasks} />
              ) : (
                <p className="text-sm text-gray-500">タスクはありません</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;