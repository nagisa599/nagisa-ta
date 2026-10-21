const STORAGE_KEY = 'morning-app-tasks';
const GOAL_KEY = 'morning-app-goal';
const DEFAULT_GOALS = [
  '集中して1歩前へ進もう',
  '今日の一歩を丁寧に踏み出そう',
  '気持ちよく始めて、1時間の成長を作ろう',
  '自分を整えて、今日を前向きにスタートしよう'
];

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const taskProgress = document.getElementById('taskProgress');
const todayDate = document.getElementById('todayDate');
const goalText = document.getElementById('goalText');
const goalChangeBtn = document.getElementById('goalChangeBtn');

const timeDisplay = document.getElementById('timeDisplay');
const timerCircle = document.getElementById('timerCircle');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

let tasks = loadTasks();
let goal = loadGoal();

const timer = {
  duration: 25 * 60,
  remaining: 25 * 60,
  intervalId: null,
  isRunning: false,
  startedAt: null
};

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return [
      { id: crypto.randomUUID(), text: '10分間の瞑想', completed: false },
      { id: crypto.randomUUID(), text: '水分をとる', completed: false },
      { id: crypto.randomUUID(), text: '今日の予定を確認する', completed: false }
    ];
  }

  try {
    return JSON.parse(saved);
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadGoal() {
  const saved = localStorage.getItem(GOAL_KEY);
  if (saved) return saved;

  const randomGoal = DEFAULT_GOALS[Math.floor(Math.random() * DEFAULT_GOALS.length)];
  localStorage.setItem(GOAL_KEY, randomGoal);
  return randomGoal;
}

function saveGoal() {
  localStorage.setItem(GOAL_KEY, goal);
}

function renderDate() {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(now);

  todayDate.textContent = formatted;
}

function renderGoal() {
  goalText.textContent = goal;
}

function renderTasks() {
  taskList.innerHTML = '';

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item ${task.completed ? 'completed' : ''}`;

    const main = document.createElement('div');
    main.className = 'task-main';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const label = document.createElement('span');
    label.className = 'task-text';
    label.textContent = task.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('aria-label', '削除');
    deleteBtn.addEventListener('click', () => {
      tasks = tasks.filter((itemTask) => itemTask.id !== task.id);
      saveTasks();
      renderTasks();
    });

    main.appendChild(checkbox);
    main.appendChild(label);
    item.appendChild(main);
    item.appendChild(deleteBtn);
    taskList.appendChild(item);
  });

  const completedCount = tasks.filter((task) => task.completed).length;
  taskProgress.textContent = `${completedCount} / ${tasks.length}`;
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  tasks.unshift({
    id: crypto.randomUUID(),
    text: trimmed,
    completed: false
  });

  saveTasks();
  renderTasks();
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTask(taskInput.value);
  taskInput.value = '';
  taskInput.focus();
});

goalChangeBtn.addEventListener('click', () => {
  const nextGoal = prompt('今日の目標を入力してください', goal);
  if (nextGoal && nextGoal.trim()) {
    goal = nextGoal.trim();
    saveGoal();
    renderGoal();
  }
});

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateTimerDisplay() {
  const progressRatio = timer.remaining / timer.duration;
  const degrees = (1 - progressRatio) * 360;
  timerCircle.style.background = `conic-gradient(var(--primary) ${degrees}deg, #f8ead0 ${degrees}deg 360deg)`;
  timeDisplay.textContent = formatTime(timer.remaining);
}

function startTimer() {
  if (timer.isRunning) return;

  timer.isRunning = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;

  const elapsedSeconds = timer.duration - timer.remaining;
  timer.startedAt = Date.now() - elapsedSeconds * 1000;

  timer.intervalId = setInterval(() => {
    const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
    timer.remaining = Math.max(timer.duration - elapsed, 0);
    updateTimerDisplay();

    if (timer.remaining <= 0) {
      stopTimer(true);
      alert('集中タイム終了！今日もお疲れさまでした。');
    }
  }, 250);
}

function stopTimer(finished = false) {
  if (timer.isRunning) {
    const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
    timer.remaining = Math.max(timer.duration - elapsed, 0);
  }

  timer.isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;

  if (timer.intervalId) {
    clearInterval(timer.intervalId);
    timer.intervalId = null;
  }

  if (finished) {
    timer.remaining = 0;
    updateTimerDisplay();
  }
}

function resetTimer() {
  stopTimer();
  timer.remaining = timer.duration;
  updateTimerDisplay();
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', () => stopTimer(false));
resetBtn.addEventListener('click', resetTimer);

pauseBtn.disabled = true;
renderDate();
renderGoal();
renderTasks();
updateTimerDisplay();

if (tasks.length === 0) {
  taskProgress.textContent = '0 / 0';
}
