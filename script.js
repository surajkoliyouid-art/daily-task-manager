// ==================== DOM Elements ====================
// Screens
const homeScreen = document.getElementById('homeScreen');
const taskScreen = document.getElementById('taskScreen');
const settingsScreen = document.getElementById('settingsScreen');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const fabAddBtn = document.getElementById('fabAddTaskBtn');
const centerAddBtn = document.getElementById('centerAddBtn');

// Task elements
const tasksList = document.getElementById('tasksList');
const todayTasksList = document.getElementById('todayTasksList');
const filterBtns = document.querySelectorAll('.filter-btn');
const emptyTaskMessage = document.getElementById('emptyTaskMessage');

// Stats elements
const completedCountEl = document.getElementById('completedCount');
const pendingCountEl = document.getElementById('pendingCount');
const todayCountEl = document.getElementById('todayCount');

// Greeting & Date
const greetingMessage = document.getElementById('greetingMessage');
const currentDateEl = document.getElementById('currentDate');

// Modal elements
const addTaskModal = document.getElementById('addTaskModal');
const modalTaskTitle = document.getElementById('modalTaskTitle');
const modalTaskTime = document.getElementById('modalTaskTime');
const modalTaskPriority = document.getElementById('modalTaskPriority');
const modalTaskDate = document.getElementById('modalTaskDate');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// Settings elements
const darkModeToggle = document.getElementById('darkModeToggle');
const notificationsToggle = document.getElementById('notificationsToggle');
const reminderTimeSelect = document.getElementById('reminderTimeSelect');
const languageSelect = document.getElementById('languageSelect');
const aboutPrivacyBtn = document.getElementById('aboutPrivacyBtn');
const notificationBadge = document.getElementById('notificationBadge');

// ==================== Data Structure ====================
let tasks = [];
let currentFilter = 'all'; // 'all', 'completed', 'pending'
let currentScreen = 'home';

// ==================== Helper Functions ====================
// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Check if a task is due today (based on its time/due date - using task date field)
// For simplicity, we'll use the task's date property. If no date, treat as not today.
function isTaskDueToday(task) {
    if (!task.date) return false;
    return task.date === getTodayDate();
}

// Update greeting based on time of day
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17 && hour < 22) greeting = 'Good Evening';
    else if (hour >= 22 || hour < 5) greeting = 'Good Night';
    greetingMessage.textContent = greeting;
}

// Update current date display
function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('en-US', options);
}

// Save tasks to localStorage
function saveTasksToLocalStorage() {
    localStorage.setItem('dailyTaskManager_tasks', JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadTasksFromLocalStorage() {
    const storedTasks = localStorage.getItem('dailyTaskManager_tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    } else {
        // Sample initial tasks for demonstration
        tasks = [
            {
                id: Date.now() + 1,
                text: 'Review project proposal',
                completed: false,
                time: '10:00',
                priority: 'High',
                date: getTodayDate()
            },
            {
                id: Date.now() + 2,
                text: 'Team meeting',
                completed: true,
                time: '14:30',
                priority: 'Medium',
                date: getTodayDate()
            },
            {
                id: Date.now() + 3,
                text: 'Design review',
                completed: false,
                time: '16:00',
                priority: 'Low',
                date: getTodayDate()
            }
        ];
        saveTasksToLocalStorage();
    }
}

// ==================== Stats Calculations ====================
function updateStats() {
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = tasks.filter(task => !task.completed).length;
    const todayTasks = tasks.filter(task => isTaskDueToday(task)).length;
    
    completedCountEl.textContent = completedTasks;
    pendingCountEl.textContent = pendingTasks;
    todayCountEl.textContent = todayTasks;
    
    // Update notification badge (pending tasks count)
    if (notificationBadge) {
        notificationBadge.textContent = pendingTasks > 0 ? pendingTasks : '';
        notificationBadge.style.display = pendingTasks > 0 ? 'flex' : 'none';
    }
}

// ==================== Render Functions ====================
// Render main tasks list (Task Screen) with current filter
function renderTasksList() {
    if (!tasksList) return;
    
    let filteredTasks = tasks;
    if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    } else if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(task => !task.completed);
    }
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '';
        if (emptyTaskMessage) emptyTaskMessage.style.display = 'flex';
        return;
    }
    
    if (emptyTaskMessage) emptyTaskMessage.style.display = 'none';
    
    tasksList.innerHTML = filteredTasks.map(task => `
        <li class="task-item ${task.completed ? 'completed-task' : ''}" data-task-id="${task.id}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task complete">
            <div class="task-info">
                <span class="task-title">${escapeHtml(task.text)}</span>
                <div class="task-meta">
                    ${task.time ? `<span class="task-time">⏰ ${task.time}</span>` : ''}
                    <span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
                </div>
            </div>
            <button class="delete-btn" aria-label="Delete task">🗑️</button>
        </li>
    `).join('');
    
    // Attach event listeners to new task items
    attachTaskItemEvents();
}

// Render today's tasks on Home Dashboard
function renderTodayTasks() {
    if (!todayTasksList) return;
    
    const todayTasks = tasks.filter(task => isTaskDueToday(task) && !task.completed);
    
    if (todayTasks.length === 0) {
        todayTasksList.innerHTML = `
            <div class="empty-state">
                <span>🎉</span>
                <p>No pending tasks for today. Relax!</p>
            </div>
        `;
        return;
    }
    
    todayTasksList.innerHTML = todayTasks.map(task => `
        <li class="task-item" data-task-id="${task.id}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task complete">
            <div class="task-info">
                <span class="task-title">${escapeHtml(task.text)}</span>
                <div class="task-meta">
                    ${task.time ? `<span class="task-time">⏰ ${task.time}</span>` : ''}
                    <span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
                </div>
            </div>
            <button class="delete-btn" aria-label="Delete task">🗑️</button>
        </li>
    `).join('');
    
    // Attach events for today's tasks
    attachHomeTaskEvents();
}

// Helper to escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Attach events for task items (checkbox + delete)
function attachTaskItemEvents() {
    document.querySelectorAll('#tasksList .task-item').forEach(item => {
        const checkbox = item.querySelector('.task-checkbox');
        const deleteBtn = item.querySelector('.delete-btn');
        const taskId = parseInt(item.dataset.taskId);
        
        if (checkbox) {
            checkbox.removeEventListener('change', handleTaskCheck);
            checkbox.addEventListener('change', handleTaskCheck);
            checkbox._taskId = taskId;
        }
        
        if (deleteBtn) {
            deleteBtn.removeEventListener('click', handleTaskDelete);
            deleteBtn.addEventListener('click', handleTaskDelete);
            deleteBtn._taskId = taskId;
        }
    });
}

function handleTaskCheck(e) {
    const taskId = e.target._taskId;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = e.target.checked;
        saveTasksToLocalStorage();
        refreshAllDisplays();
    }
}

function handleTaskDelete(e) {
    const taskId = e.target._taskId;
    const taskElement = e.target.closest('.task-item');
    if (taskElement) {
        taskElement.classList.add('removing');
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== taskId);
            saveTasksToLocalStorage();
            refreshAllDisplays();
        }, 150);
    }
}

// Attach events for home screen tasks
function attachHomeTaskEvents() {
    document.querySelectorAll('#todayTasksList .task-item').forEach(item => {
        const checkbox = item.querySelector('.task-checkbox');
        const deleteBtn = item.querySelector('.delete-btn');
        const taskId = parseInt(item.dataset.taskId);
        
        if (checkbox) {
            checkbox.removeEventListener('change', handleHomeTaskCheck);
            checkbox.addEventListener('change', handleHomeTaskCheck);
            checkbox._taskId = taskId;
        }
        
        if (deleteBtn) {
            deleteBtn.removeEventListener('click', handleHomeTaskDelete);
            deleteBtn.addEventListener('click', handleHomeTaskDelete);
            deleteBtn._taskId = taskId;
        }
    });
}

function handleHomeTaskCheck(e) {
    const taskId = e.target._taskId;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = e.target.checked;
        saveTasksToLocalStorage();
        refreshAllDisplays();
    }
}

function handleHomeTaskDelete(e) {
    const taskId = e.target._taskId;
    const taskElement = e.target.closest('.task-item');
    if (taskElement) {
        taskElement.classList.add('removing');
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== taskId);
            saveTasksToLocalStorage();
            refreshAllDisplays();
        }, 150);
    }
}

// Refresh all UI components
function refreshAllDisplays() {
    updateStats();
    renderTasksList();
    renderTodayTasks();
}

// ==================== Add Task Modal Logic ====================
function openAddTaskModal() {
    modalTaskTitle.value = '';
    modalTaskTime.value = '';
    modalTaskPriority.value = 'Medium';
    modalTaskDate.value = getTodayDate();
    addTaskModal.classList.add('show');
}

function closeAddTaskModal() {
    addTaskModal.classList.remove('show');
}

function addNewTask() {
    const title = modalTaskTitle.value.trim();
    if (!title) {
        alert('Please enter a task title');
        return;
    }
    
    const newTask = {
        id: Date.now(),
        text: title,
        completed: false,
        time: modalTaskTime.value || '',
        priority: modalTaskPriority.value,
        date: modalTaskDate.value || getTodayDate()
    };
    
    tasks.unshift(newTask);
    saveTasksToLocalStorage();
    refreshAllDisplays();
    closeAddTaskModal();
}

// ==================== Navigation (SPA) ====================
function switchScreen(screen) {
    currentScreen = screen;
    
    // Hide all screens
    if (homeScreen) homeScreen.classList.remove('active-screen');
    if (taskScreen) taskScreen.classList.remove('active-screen');
    if (settingsScreen) settingsScreen.classList.remove('active-screen');
    
    // Show selected screen
    if (screen === 'home') {
        if (homeScreen) homeScreen.classList.add('active-screen');
        renderTodayTasks();
        updateGreeting();
    } else if (screen === 'tasks') {
        if (taskScreen) taskScreen.classList.add('active-screen');
        renderTasksList();
    } else if (screen === 'settings') {
        if (settingsScreen) settingsScreen.classList.add('active-screen');
    }
    
    // Update active nav state
    navItems.forEach(nav => {
        const navScreen = nav.dataset.nav;
        if ((screen === 'home' && navScreen === 'home') ||
            (screen === 'tasks' && navScreen === 'tasks') ||
            (screen === 'settings' && navScreen === 'settings')) {
            nav.classList.add('active');
        } else if (navScreen !== 'add') {
            nav.classList.remove('active');
        }
    });
    
    updateStats();
}

// ==================== Filter Logic ====================
function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderTasksList();
}

// ==================== Dark Mode ====================
function initDarkMode() {
    const savedDarkMode = localStorage.getItem('dailyTaskManager_darkMode');
    const isDark = savedDarkMode === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = false;
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('dailyTaskManager_darkMode', isDark);
    if (darkModeToggle) darkModeToggle.checked = isDark;
}

// ==================== Settings Handlers ====================
function initSettings() {
    // Load saved settings
    const savedNotifications = localStorage.getItem('dailyTaskManager_notifications');
    if (savedNotifications !== null && notificationsToggle) {
        notificationsToggle.checked = savedNotifications === 'true';
    }
    
    const savedReminder = localStorage.getItem('dailyTaskManager_reminderTime');
    if (savedReminder && reminderTimeSelect) {
        reminderTimeSelect.value = savedReminder;
    }
    
    const savedLanguage = localStorage.getItem('dailyTaskManager_language');
    if (savedLanguage && languageSelect) {
        languageSelect.value = savedLanguage;
    }
    
    // Save settings on change
    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', (e) => {
            localStorage.setItem('dailyTaskManager_notifications', e.target.checked);
            if (e.target.checked) {
                console.log('Notifications enabled (demo)');
            }
        });
    }
    
    if (reminderTimeSelect) {
        reminderTimeSelect.addEventListener('change', (e) => {
            localStorage.setItem('dailyTaskManager_reminderTime', e.target.value);
        });
    }
    
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            localStorage.setItem('dailyTaskManager_language', e.target.value);
            alert(`Language changed to ${e.target.options[e.target.selectedIndex].text} (demo)`);
        });
    }
    
    if (aboutPrivacyBtn) {
        aboutPrivacyBtn.addEventListener('click', () => {
            alert('Daily Task Manager v2.0\nPrivacy: All data stored locally on your device.');
        });
    }
}

// ==================== Event Listeners ====================
function bindEvents() {
    // Navigation
    navItems.forEach(nav => {
        nav.addEventListener('click', (e) => {
            const screen = nav.dataset.nav;
            if (screen === 'add') {
                openAddTaskModal();
            } else if (screen === 'home') {
                switchScreen('home');
            } else if (screen === 'tasks') {
                switchScreen('tasks');
            } else if (screen === 'settings') {
                switchScreen('settings');
            }
        });
    });
    
    // Floating add buttons
    if (fabAddBtn) fabAddBtn.addEventListener('click', openAddTaskModal);
    if (centerAddBtn) centerAddBtn.addEventListener('click', openAddTaskModal);
    
    // Modal controls
    if (saveTaskBtn) saveTaskBtn.addEventListener('click', addNewTask);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeAddTaskModal);
    
    // Close modal when clicking outside
    if (addTaskModal) {
        addTaskModal.addEventListener('click', (e) => {
            if (e.target === addTaskModal) closeAddTaskModal();
        });
    }
    
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setFilter(btn.dataset.filter);
        });
    });
    
    // Dark mode toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleDarkMode);
    }
}

// ==================== Initialization ====================
function init() {
    loadTasksFromLocalStorage();
    initDarkMode();
    initSettings();
    updateGreeting();
    updateDateDisplay();
    updateStats();
    renderTodayTasks();
    renderTasksList();
    bindEvents();
    switchScreen('home');
    
    // Set default filter active state
    setFilter('all');
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
