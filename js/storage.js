const STORAGE_KEY = 'moveon_app_data';

function saveState() {
  if (typeof state === 'undefined') return;
  
  const dataToSave = {
    userName: state.userName,
    missions: state.missions,
    missionsCompletedTotal: state.missionsCompletedTotal,
    journal: state.journal,
    reminders: state.reminders,
    urgesResisted: state.urgesResisted,
    startDate: startDate ? startDate.toISOString() : new Date().toISOString(),
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    day7Celebrated: state.day7Celebrated || false,
    lastVisit: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch(e) {
      return null;
    }
  }
  return null;
}

// State initialization
const today = new Date();
const savedData = loadState();
let startDate;
let state;

function dkey(d) { 
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); 
}

function getFirstName() {
  if (!state || !state.userName) return '';
  return state.userName.split(' ')[0];
}

if (savedData && savedData.hasCompletedOnboarding) {
  startDate = new Date(savedData.startDate);
  state = {
    userName: savedData.userName || '',
    missions: savedData.missions || [],
    missionsCompletedTotal: savedData.missionsCompletedTotal || 0,
    journal: savedData.journal || {},
    calViewYear: today.getFullYear(),
    calViewMonth: today.getMonth(),
    selectedDate: new Date(today),
    reminders: savedData.reminders || { daily: true, urge: true, notifications: false },
    urgesResisted: savedData.urgesResisted || 0,
    hasCompletedOnboarding: true,
    day7Celebrated: savedData.day7Celebrated || false,
  };
} else {
  startDate = new Date();
  state = {
    userName: '',
    missions: [
      {id: 1, text: 'Welcome to Move On! 👋 Tap to complete', done: false},
      {id: 2, text: 'Add your first daily mission', done: false},
      {id: 3, text: 'Try the Urge Timer when you feel weak', done: false},
    ],
    missionsCompletedTotal: 0,
    journal: {},
    calViewYear: today.getFullYear(),
    calViewMonth: today.getMonth(),
    selectedDate: new Date(today),
    reminders: { daily: true, urge: true, notifications: false },
    urgesResisted: 0,
    hasCompletedOnboarding: false,
    day7Celebrated: false,
  };
}

// Auto-save
setInterval(() => {
  if (typeof state !== 'undefined') saveState();
}, 30000);

window.addEventListener('beforeunload', () => {
  if (typeof state !== 'undefined') saveState();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && typeof state !== 'undefined') saveState();
});
