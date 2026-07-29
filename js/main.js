/* =========================================================
   MAIN INITIALIZATION
========================================================= */

// SVG Icons Helper
function svgWrap(inner, size = 16, strokeWidth = 2, fillMode = 'none') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fillMode}" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

const ICONS = {
  bell: svgWrap('<path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>', 16),
  heart: svgWrap('<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.8z"/>', 16),
  share: svgWrap('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>', 16),
  check: svgWrap('<path d="M20 6L9 17l-5-5"/>', 16, 3),
  pencil: svgWrap('<path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>', 16),
  star: svgWrap('<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/>', 16, 2, 'currentColor'),
  lock: svgWrap('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>', 14),
};

const CHECK_SVG = ICONS.check;
const LOCK_SVG = ICONS.lock;

function moodFaceSVG(level, size = 20) {
  const mouths = {
    1: 'M8 16.2c1.5-2.2 6.5-2.2 8 0',
    2: 'M8 15.6c1.2-1.1 6.8-1.1 8 0',
    3: 'M8 15h8',
    4: 'M8 14c1.2 1.6 6.8 1.6 8 0',
    5: 'M7 13.2c1.9 3.2 7.2 3.2 10 0',
  };
  const eyes = {
    1: '<circle cx="9" cy="10" r="1.1"/><circle cx="15" cy="10" r="1.1"/><path d="M7.8 8.3l2.2 1M16.2 8.3l-2.2 1"/>',
    2: '<circle cx="9" cy="10" r="1.1"/><circle cx="15" cy="10" r="1.1"/>',
    3: '<circle cx="9" cy="10" r="1.1"/><circle cx="15" cy="10" r="1.1"/>',
    4: '<circle cx="9" cy="10" r="1.1"/><circle cx="15" cy="10" r="1.1"/>',
    5: '<path d="M7.8 9.6c.6-1 1.6-1 2.2 0M14 9.6c.6-1 1.6-1 2.2 0"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/>${eyes[level]}<path d="${mouths[level]}"/></svg>`;
}

// ============ HAPTIC FEEDBACK ============
function haptic(type = 'light') {
  if (navigator.vibrate) {
    switch(type) {
      case 'light': navigator.vibrate(10); break;
      case 'medium': navigator.vibrate(20); break;
      case 'heavy': navigator.vibrate(30); break;
      case 'success': navigator.vibrate([10, 30, 10]); break;
      case 'delete': navigator.vibrate([15, 10, 15]); break;
      case 'tap': navigator.vibrate(5); break;
    }
  }
}

// ============ iOS SWIPE-BACK GESTURE ============
let touchStartX = 0;
let touchStartY = 0;
let swipeHandled = false;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  swipeHandled = false;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (swipeHandled) return;
  
  const deltaX = e.touches[0].clientX - touchStartX;
  const deltaY = e.touches[0].clientY - touchStartY;
  
  if (deltaX > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 2 && touchStartX < 30) {
    swipeHandled = true;
    haptic('light');
    
    const currentScreen = document.querySelector('.screen.active');
    if (currentScreen && currentScreen.id !== 'screen-home') {
      go('home');
    }
  }
}, { passive: true });

// ============ PULL TO REFRESH ============
let pullStart = 0;
let pulling = false;
const pullThreshold = 80;

document.getElementById('app').addEventListener('touchstart', (e) => {
  if (document.getElementById('app').scrollTop === 0) {
    pullStart = e.touches[0].clientY;
    pulling = true;
  }
}, { passive: true });

document.getElementById('app').addEventListener('touchmove', (e) => {
  if (!pulling) return;
  
  const pullDistance = e.touches[0].clientY - pullStart;
  
  if (pullDistance > 0 && pullDistance < pullThreshold * 1.5) {
    const indicator = document.getElementById('pullIndicator');
    if (indicator) {
      const h = Math.min(pullDistance, pullThreshold);
      indicator.style.height = h + 'px';
      indicator.style.opacity = h / pullThreshold;
      indicator.textContent = pullDistance >= pullThreshold ? '↓ Release to refresh' : '↓ Pull to refresh';
    }
  }
}, { passive: true });

document.getElementById('app').addEventListener('touchend', () => {
  if (!pulling) return;
  pulling = false;
  
  const indicator = document.getElementById('pullIndicator');
  if (indicator) {
    const pullDistance = parseInt(indicator.style.height) || 0;
    
    if (pullDistance >= pullThreshold) {
      indicator.innerHTML = '<div class="loading-spinner" style="margin:10px auto;"></div>';
      indicator.style.height = '50px';
      indicator.style.opacity = '1';
      indicator.textContent = '';
      
      setTimeout(() => {
        indicator.style.height = '0px';
        indicator.style.opacity = '0';
        haptic('success');
        toast('Refreshed', 'check');
        
        const currentScreen = document.querySelector('.screen.active');
        if (currentScreen) {
          const screenName = currentScreen.id.replace('screen-', '');
          go(screenName);
        }
      }, 800);
    } else {
      indicator.style.height = '0px';
      indicator.style.opacity = '0';
    }
  }
}, { passive: true });

// ============ PUSH NOTIFICATIONS ============

let notificationInterval = null;

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        toast('Notifications not supported on this device');
        return;
    }
    
    if (Notification.permission === 'granted') {
        scheduleDailyReminder();
        toast('Notifications already enabled! 🔔', 'bell');
        addNotificationButton();
        return;
    }
    
    if (Notification.permission === 'denied') {
        toast('Notifications blocked. Enable them in your browser settings.');
        return;
    }
    
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            scheduleDailyReminder();
            toast('Notifications enabled! We\'ll check in daily 💜', 'bell');
            haptic('success');
            addNotificationButton();
        } else {
            toast('No worries! You can enable them later in Profile');
        }
    });
}

function scheduleDailyReminder() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    if (notificationInterval) clearInterval(notificationInterval);
    
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(9, 0, 0, 0);
    
    if (now > scheduledTime) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeUntilNotification = scheduledTime - now;
    
    setTimeout(() => {
        showLocalNotification();
        notificationInterval = setInterval(() => {
            showLocalNotification();
        }, 24 * 60 * 60 * 1000);
    }, timeUntilNotification);
    
    state.reminders.notifications = true;
    saveState();
}

function showLocalNotification() {
    if (Notification.permission !== 'granted') return;
    
    const messages = [
        'How are you feeling today? Take a moment to journal 📝',
        'Your streak is waiting for you. Keep it going! 💪',
        'Day ' + (typeof noContactDaysNow === 'function' ? noContactDaysNow() : '') + '. You\'re doing amazing! 🌟',
        'Take a deep breath. You\'ve got this. 💜',
        'Time to check in. How\'s your No Contact journey?',
        'Don\'t forget your daily missions! Small wins matter ✨',
        'A new day, a fresh start. You\'re stronger than yesterday.',
        'Someone out there is proud of you today. Keep moving forward.',
    ];
    
    const msg = messages[Math.floor(Math.random() * messages.length)];
    
    const notification = new Notification('Move On', {
        body: msg,
        icon: '/move-on/assets/icons/icon-192.png',
        badge: '/move-on/assets/icons/icon-192.png',
        vibrate: [100, 50, 100],
        tag: 'moveon-daily',
        renotify: true
    });
    
    notification.onclick = () => {
        window.focus();
        notification.close();
    };
}

function addNotificationButton() {
    const profileScreen = document.getElementById('screen-profile');
    if (!profileScreen || !profileScreen.classList.contains('active')) return;
    
    const remindersCard = profileScreen.querySelector('.card:last-of-type');
    if (!remindersCard) return;
    
    const existing = document.getElementById('notificationCard');
    if (existing) existing.remove();
    
    const card = document.createElement('div');
    card.id = 'notificationCard';
    card.className = 'card';
    card.style.marginTop = '14px';
    
    const permissionGranted = 'Notification' in window && Notification.permission === 'granted';
    
    card.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
            <div style="font-size:28px;">🔔</div>
            <div style="flex:1;">
                <div style="font-size:14px; font-weight:700;">Daily Reminders</div>
                <div style="font-size:12px; color:var(--text-dim);">${permissionGranted ? 'Enabled — We\'ll check in daily' : 'Get motivated every day'}</div>
            </div>
            <button onclick="requestNotificationPermission()" style="background:${permissionGranted ? 'var(--bg-elev3)' : 'var(--text)'}; border:1px solid var(--border); color:${permissionGranted ? 'var(--text)' : '#000000'}; padding:8px 14px; border-radius:10px; font-size:12px; font-weight:600; cursor:pointer;">
                ${permissionGranted ? 'On' : 'Enable'}
            </button>
        </div>
    `;
    
    remindersCard.after(card);
}

// Override renderProfile to add notification button
const originalRenderProfile = typeof renderProfile === 'function' ? renderProfile : function(){};
renderProfile = function() {
    originalRenderProfile();
    setTimeout(addNotificationButton, 100);
};

// ============ INITIALIZE APP ============
window.addEventListener('DOMContentLoaded', () => {
  if (state && state.hasCompletedOnboarding) {
    document.getElementById('onboarding').classList.add('hidden');
    go('home');
  }
});

if (typeof renderUrgeTimer === 'function') {
  renderUrgeTimer();
}

if (typeof renderHome === 'function') {
  renderHome();
}

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/move-on/service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker failed:', err));
    });
}
