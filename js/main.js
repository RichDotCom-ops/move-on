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
