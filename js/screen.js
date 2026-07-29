/* =========================================================
   SCREEN RENDERING FUNCTIONS
========================================================= */

// Navigation
const screenIds = ['home','nocontact','journal','urge','progress','achievements','profile'];

function go(name) {
  screenIds.forEach(s => {
    document.getElementById('screen-' + s).classList.toggle('active', s === name);
  });
  
  document.querySelectorAll('.navbtn[data-tab]').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  
  if (name === 'home') renderHome();
  if (name === 'nocontact') renderNoContact();
  if (name === 'journal') renderJournal();
  if (name === 'urge') renderUrgeTimer();
  if (name === 'progress') renderProgress();
  if (name === 'achievements') renderAchievements();
  if (name === 'profile') renderProfile();
  
  document.getElementById('app').scrollTop = 0;
}

// Toast
let toastTimer = null;

function toast(msg, iconKey) {
  const t = document.getElementById('toast');
  const icon = iconKey ? ICONS[iconKey] : '';
  t.innerHTML = icon ? `<span class="toast-row"><span class="toast-icon">${icon}</span>${msg}</span>` : msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// Quick Add Sheet
function openAddSheet() { 
  haptic('tap');
  document.getElementById('addOverlay').classList.add('show'); 
}

function closeAddSheet() { 
  document.getElementById('addOverlay').classList.remove('show'); 
}

function addMissionPrompt() {
  haptic('tap');
  const txt = prompt('New mission:');
  if (txt && txt.trim()) {
    state.missions.push({id: Date.now(), text: txt.trim(), done: false});
    renderHome();
    saveState();
    toast('Mission added', 'check');
  }
}

// Home Screen
function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function noContactDaysNow() {
  return Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

function renderHome() {
  const firstName = getFirstName();
  const nameDisplay = firstName ? `, ${firstName}` : '';
  document.getElementById('homeGreeting').innerHTML = `${greetingWord()}${nameDisplay} <svg class="inline-ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h16"/><path d="M4 18l-1.6-9L8 12l4-7 4 7 5.6-3L20 18"/></svg>`;
  
  const days = noContactDaysNow();
  document.getElementById('homeStreakNum').innerHTML = `${days} <span>${days === 1 ? 'Day' : 'Days'}</span>`;

  const goal = 30;
  const frac = Math.min(days / goal, 1);
  const circumference = 213.6;
  document.getElementById('homeRing').style.strokeDashoffset = circumference * (1 - frac);

  const streakMsg = document.getElementById('homeStreakMsg');
  if (days === 0) {
    streakMsg.textContent = 'Your journey starts now.';
  } else if (firstName) {
    const messages = [
      `Keep going, ${firstName}.`,
      `You're doing great, ${firstName}!`,
      `${firstName}, you're unstoppable.`,
      `Stay strong, ${firstName}.`,
      `Day ${days} — proud of you, ${firstName}.`
    ];
    streakMsg.textContent = messages[Math.min(days - 1, messages.length - 1)];
  } else {
    streakMsg.textContent = `Day ${days} — keep going, king.`;
  }

  // Check for Day 7 milestone
  if (days === 7 && !state.day7Celebrated) {
    state.day7Celebrated = true;
    saveState();
    setTimeout(() => {
      spawnHomeConfetti();
      toast('🎉 7 Days! First week complete!', 'star');
    }, 500);
  }

  const card = document.getElementById('missionCard');
  card.innerHTML = '';
  
  if (state.missions.length === 0) {
    card.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"><path d="M22 11.1V12a10 10 0 11-5.9-9.1"/><path d="M22 4L12 14.01l-3-3"/></svg>
        </div>
        <div class="empty-title">No missions yet</div>
        <div class="empty-sub">Tap below to add your first daily mission</div>
      </div>
    `;
  } else {
    state.missions.forEach((m, i) => {
      const row = document.createElement('div');
      row.className = 'mission-row' + (m.done ? ' done' : '');
      row.style.position = 'relative';
      row.style.overflow = 'hidden';
      row.style.padding = '0';
      
      const deleteBg = document.createElement('div');
      deleteBg.style.cssText = `
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 80px;
        background: var(--red);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 0;
      `;
      deleteBg.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
          <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      `;
      
      const inner = document.createElement('div');
      inner.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 11px 4px;
        transition: transform 0.3s ease;
        position: relative;
        z-index: 1;
        background: var(--bg-elev);
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
      `;
      
      inner.innerHTML = `
        <div class="check ${m.done ? 'done' : ''}" style="flex-shrink:0;">${m.done ? CHECK_SVG : ''}</div>
        <div class="mission-text" style="flex:1;">${m.text}</div>
      `;
      
      let startX = 0;
      let currentX = 0;
      let isDragging = false;
      let isOpen = false;
      const deleteWidth = 80;
      
      inner.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        inner.style.transition = 'none';
      });
      
      inner.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        
        if (isOpen) {
          const newX = Math.min(Math.max(diff - deleteWidth, -deleteWidth), 0);
          inner.style.transform = `translateX(${newX}px)`;
        } else {
          const newX = Math.max(diff, -deleteWidth);
          inner.style.transform = `translateX(${newX}px)`;
        }
      });
      
      inner.addEventListener('touchend', () => {
        isDragging = false;
        inner.style.transition = 'transform 0.3s ease';
        
        const currentOffset = parseFloat(inner.style.transform.replace('translateX(', '').replace('px)', '') || 0);
        
        if (currentOffset < -deleteWidth / 2) {
          inner.style.transform = `translateX(-${deleteWidth}px)`;
          isOpen = true;
        } else {
          inner.style.transform = 'translateX(0px)';
          isOpen = false;
        }
      });
      
      inner.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        isDragging = true;
        inner.style.transition = 'none';
        e.preventDefault();
      });
      
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentX = e.clientX;
        const diff = currentX - startX;
        
        if (isOpen) {
          const newX = Math.min(Math.max(diff - deleteWidth, -deleteWidth), 0);
          inner.style.transform = `translateX(${newX}px)`;
        } else {
          const newX = Math.max(diff, -deleteWidth);
          inner.style.transform = `translateX(${newX}px)`;
        }
      });
      
      window.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        inner.style.transition = 'transform 0.3s ease';
        
        const currentOffset = parseFloat(inner.style.transform.replace('translateX(', '').replace('px)', '') || 0);
        
        if (currentOffset < -deleteWidth / 2) {
          inner.style.transform = `translateX(-${deleteWidth}px)`;
          isOpen = true;
        } else {
          inner.style.transform = 'translateX(0px)';
          isOpen = false;
        }
      });
      
      inner.addEventListener('click', (e) => {
        if (!isDragging && !isOpen) {
          haptic('success');
          m.done = !m.done;
          state.missionsCompletedTotal += m.done ? 1 : -1;
          renderHome();
          saveState();
        }
      });
      
      deleteBg.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteMission(m, row);
      });
      
      row.appendChild(deleteBg);
      row.appendChild(inner);
      card.appendChild(row);
    });
  }
  
  const addRow = document.createElement('div');
  addRow.className = 'add-mission-row';
  addRow.innerHTML = '+ Add a mission';
  addRow.onclick = addMissionPrompt;
  card.appendChild(addRow);

  const totalMissions = state.missions.length;
  const done = state.missions.filter(m => m.done).length;
  document.getElementById('missionCountLabel').textContent = `${done} of ${totalMissions} completed`;
  
  updateShareStreakCard();
  saveState();
}

// ============ DELETE WITH UNDO ============

function deleteMission(mission, rowElement) {
  haptic('delete');
  const deletedMission = {...mission};
  const wasDone = mission.done;
  const currentHeight = rowElement.offsetHeight;
  
  rowElement.style.transition = 'all 0.3s ease';
  rowElement.style.transform = 'translateX(-120%)';
  rowElement.style.opacity = '0';
  
  setTimeout(() => {
    rowElement.style.maxHeight = currentHeight + 'px';
    rowElement.style.marginTop = '0';
    rowElement.style.marginBottom = '0';
    
    setTimeout(() => {
      rowElement.style.maxHeight = '0px';
      rowElement.style.padding = '0px';
      rowElement.style.borderBottom = 'none';
    }, 50);
    
    setTimeout(() => {
      state.missions = state.missions.filter(m => m.id !== mission.id);
      if (wasDone) {
        state.missionsCompletedTotal = Math.max(0, state.missionsCompletedTotal - 1);
      }
      renderHome();
      saveState();
      showUndoToast(deletedMission, wasDone);
    }, 350);
  }, 100);
}

function showUndoToast(mission, wasDone) {
  const t = document.getElementById('toast');
  t.innerHTML = `
    <span class="toast-row">
      <span>Mission deleted</span>
      <button onclick="undoDelete(${mission.id}, '${mission.text.replace(/'/g, "\\'")}', ${wasDone}); event.stopPropagation();" 
        style="background:var(--purple); color:#fff; border:none; padding:6px 12px; border-radius:8px; font-weight:700; font-size:12px; cursor:pointer; margin-left:8px;">
        Undo
      </button>
    </span>
  `;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
}

function undoDelete(missionId, missionText, wasDone) {
  state.missions.push({id: missionId, text: missionText, done: wasDone});
  if (wasDone) state.missionsCompletedTotal++;
  renderHome();
  saveState();
  
  const t = document.getElementById('toast');
  t.innerHTML = `<span class="toast-row"><span class="toast-icon">${ICONS.check}</span>Mission restored</span>`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ============ DAY 7 CONFETTI ============

function spawnHomeConfetti() {
  const home = document.getElementById('screen-home');
  const colors = ['#7c5cff','#a78bfa','#4f6df5','#fbbf24','#34d399','#ff6b7a','#ffc04d'];
  
  for (let i = 0; i < 30; i++) {
    const dot = document.createElement('div');
    const fallDuration = 1.5 + Math.random() * 2;
    const rotation = Math.random() * 720;
    
    dot.style.cssText = `
      position: fixed;
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      left: ${Math.random() * 100}%;
      top: -20px;
      z-index: 200;
      pointer-events: none;
      animation: confettiFall ${fallDuration}s ease-out forwards;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    home.appendChild(dot);
    setTimeout(() => dot.remove(), (fallDuration + 0.5) * 1000);
  }
}

// ============ SHARE STREAK CARD ============

function updateShareStreakCard() {
  const days = noContactDaysNow();
  const card = document.getElementById('shareStreakCard');
  if (!card) return;
  
  if (days > 0) {
    card.style.display = 'block';
    const title = document.getElementById('shareStreakTitle');
    const sub = document.getElementById('shareStreakSub');
    
    if (days === 1) {
      title.textContent = 'Day 1 — The journey begins';
      sub.textContent = 'Share your first step';
    } else if (days === 7) {
      title.textContent = '🔥 1 Week Strong';
      sub.textContent = 'A whole week of growth';
    } else if (days === 30) {
      title.textContent = '🏆 30 Days Champion';
      sub.textContent = 'A new you has emerged';
    } else {
      title.textContent = `Day ${days} — Still going strong`;
      sub.textContent = 'Let the world know you\'re moving on';
    }
  } else {
    card.style.display = 'none';
  }
}

function shareStreak() {
  haptic('tap');
  const days = noContactDaysNow();
  const firstName = getFirstName();
  
  const messages = [
    `Day ${days} of No Contact. Not just moving on — moving up. 🚀 #MoveOnApp`,
    `${days} days of choosing myself. Best decision ever. 💜 #MoveOnApp`,
    `They said I couldn't do it. Day ${days}. Watch me. 👑 #MoveOnApp`,
  ];
  
  const text = firstName 
    ? `${firstName} — ${messages[days % messages.length]}`
    : messages[days % messages.length];
  
  if (navigator.share) {
    navigator.share({text}).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(() => {
      toast('Streak copied to clipboard', 'share');
    });
  }
}

// ============ NO CONTACT SCREEN ============

function renderNoContact() {
  const diffMs = Date.now() - startDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diffMs / (1000 * 60)) % 60);
  document.getElementById('ncBigDays').innerHTML = `${days} <small>${days === 1 ? 'Day' : 'Days'}</small>`;
  document.getElementById('ncSubTime').textContent = `${hours} Hours ${mins} Minutes`;
  
  const firstName = getFirstName();
  const ncFooter = document.querySelector('.nc-footer p');
  if (firstName) {
    ncFooter.textContent = `Every day without them is a day closer to your best life, ${firstName}.`;
  }
}

setInterval(() => {
  if (document.getElementById('screen-nocontact').classList.contains('active')) renderNoContact();
}, 30000);

// ============ JOURNAL SCREEN ============

function shiftMonth(delta) {
  state.calViewMonth += delta;
  if (state.calViewMonth < 0) { state.calViewMonth = 11; state.calViewYear--; }
  if (state.calViewMonth > 11) { state.calViewMonth = 0; state.calViewYear++; }
  renderCalendar();
}

function renderCalendar() {
  const y = state.calViewYear, m = state.calViewMonth;
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calMonthLabel').textContent = `${monthNames[m]} ${y}`;

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  ['S','M','T','W','T','F','S'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'dow'; el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDaysInMonth = new Date(y, m, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    const el = document.createElement('div');
    el.className = 'cal-day otherm';
    el.textContent = prevDaysInMonth - i;
    grid.appendChild(el);
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(y, m, d);
    const el = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = d;
    const k = dkey(dateObj);
    if (state.journal[k] && (state.journal[k].text || state.journal[k].mood)) {
      el.classList.add('hasentry');
    }
    if (dkey(today) === k) el.classList.add('today');
    if (dkey(state.selectedDate) === k) el.classList.add('selected');
    el.onclick = () => { haptic('tap'); state.selectedDate = dateObj; renderJournal(); };
    grid.appendChild(el);
  }
  
  const totalCells = firstDay + daysInMonth;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day otherm';
    el.textContent = i;
    grid.appendChild(el);
  }
}

function renderJournal() {
  state.calViewYear = state.selectedDate.getFullYear();
  state.calViewMonth = state.selectedDate.getMonth();
  renderCalendar();

  const k = dkey(state.selectedDate);
  const isToday = dkey(today) === k;
  const label = state.selectedDate.toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
  document.getElementById('journalDateLabel').textContent = isToday ? `Today, ${label}` : label;

  const entry = state.journal[k] || {text:'', mood:null};
  
  const firstName = getFirstName();
  const placeholder = firstName 
    ? `How are you feeling today, ${firstName}? Write what's on your mind...`
    : "Write what's on your mind...";
  
  const journalText = document.getElementById('journalText');
  journalText.placeholder = placeholder;
  journalText.value = entry.text || '';

  const moodRow = document.getElementById('moodRow');
  moodRow.innerHTML = '';
  [1,2,3,4,5].forEach((val) => {
    const el = document.createElement('div');
    el.className = 'mood-opt' + (entry.mood === val ? ' selected' : '');
    el.innerHTML = moodFaceSVG(val, 22);
    el.onclick = () => {
      haptic('tap');
      state.journal[k] = state.journal[k] || {text:'', mood:null};
      state.journal[k].mood = val;
      renderJournal();
      saveState();
    };
    moodRow.appendChild(el);
  });
}

function saveJournal() {
  haptic('medium');
  const k = dkey(state.selectedDate);
  const text = document.getElementById('journalText').value.trim();
  
  if (!state.journal[k]) {
    state.journal[k] = {text: '', mood: null};
  }
  state.journal[k].text = text;
  
  renderCalendar();
  saveState();
  
  const firstName = getFirstName();
  toast(firstName ? `Entry saved, ${firstName}` : 'Journal entry saved', 'pencil');
}

// ============ PROGRESS SCREEN ============

function renderProgress() {
  const days = noContactDaysNow();
  document.getElementById('pgDays').textContent = days;
  
  const jc = Object.values(state.journal).filter(e => 
    (e.text && e.text.trim()) || e.mood
  ).length;
  document.getElementById('pgJournals').textContent = jc;
  
  document.getElementById('pgMissions').textContent = state.missions.filter(m => m.done).length;

  const hasMoodData = Object.values(state.journal).some(e => e.mood);
  const chartWrap = document.querySelector('.chart-wrap');
  
  if (hasMoodData) {
    chartWrap.innerHTML = `
      <div class="chart-row">
        <div class="chart-yaxis">
          <span>${moodFaceSVG(5, 14)}</span>
          <span>${moodFaceSVG(4, 14)}</span>
          <span>${moodFaceSVG(3, 14)}</span>
          <span>${moodFaceSVG(2, 14)}</span>
          <span>${moodFaceSVG(1, 14)}</span>
        </div>
        <div class="chart-svg-box" id="chartBox"></div>
      </div>
    `;
    renderMoodChart();
  } else {
    chartWrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>
        </div>
        <div class="empty-title">No mood data yet</div>
        <div class="empty-sub">Start journaling to track your mood over time</div>
      </div>
    `;
  }

  renderMilestones(days);
}

function renderMoodChart() {
  const points = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const k = dkey(d);
    const entry = state.journal[k];
    points.push({
      label: d.getDate(), 
      mood: entry && entry.mood ? entry.mood : null
    });
  }
  
  const w = 240, h = 120, pad = 10;
  const validPoints = points.map((p, idx) => ({...p, idx})).filter(p => p.mood);
  
  if (validPoints.length === 0) return;
  
  const xStep = (w - 2 * pad) / (points.length - 1);
  const yFor = (mood) => h - pad - ((mood - 1) / 4) * (h - 2 * pad);

  let path = '';
  validPoints.forEach((p, i) => {
    const x = pad + p.idx * xStep;
    const y = yFor(p.mood);
    path += (i === 0 ? 'M' : 'L') + x + ',' + y + ' ';
  });

  let dots = '';
  validPoints.forEach(p => {
    const x = pad + p.idx * xStep;
    const y = yFor(p.mood);
    dots += `<circle cx="${x}" cy="${y}" r="4" fill="#7c5cff" stroke="#08080d" stroke-width="1.5"/>`;
  });

  const svg = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="120">
      <path d="${path}" fill="none" stroke="url(#ringGrad)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
    </svg>`;
  
  const chartBox = document.getElementById('chartBox');
  if (chartBox) {
    chartBox.innerHTML = svg;
  }
}

function renderMilestones(days) {
  const defs = [
    {d: 7, label: '7 Days', sub: 'First week complete!'},
    {d: 14, label: '14 Days', sub: 'Two weeks strong!'},
    {d: 21, label: '21 Days', sub: 'New habit forming!'},
    {d: 30, label: '30 Days', sub: "You're a champion!"},
    {d: 60, label: '60 Days', sub: 'Unstoppable!'},
    {d: 90, label: '90 Days', sub: 'New you unlocked!'},
  ];
  
  const card = document.getElementById('milestoneCard');
  card.innerHTML = '';
  
  defs.forEach(m => {
    const done = days >= m.d;
    const row = document.createElement('div');
    row.className = 'milestone-row';
    row.innerHTML = `
      <div class="milestone-icon ${done ? 'done' : 'locked'}">${done ? CHECK_SVG : LOCK_SVG}</div>
      <div style="flex:1;">
        <div class="milestone-title">${m.label}</div>
        <div class="milestone-sub">${done ? m.sub : (m.d - days) + ' days to go'}</div>
      </div>
      ${done ? '<div style="color:var(--green); font-size:18px;">🏆</div>' : ''}
    `;
    card.appendChild(row);
  });
}

// ============ ACHIEVEMENTS SCREEN ============

function renderAchievements() {
  const days = noContactDaysNow();
  document.getElementById('achDays').textContent = days;
  
  const firstName = getFirstName();
  if (days === 0) {
    document.getElementById('achTitle').textContent = 'Begin Your Journey';
    document.getElementById('achSub').innerHTML = 'Start your No Contact streak<br>to unlock achievements.';
  } else {
    document.getElementById('achTitle').textContent = firstName 
      ? `${firstName}, No Contact Champion` 
      : 'No Contact Champion';
    document.getElementById('achSub').innerHTML = firstName
      ? `You're building a better<br>future for yourself, ${firstName}.`
      : "You're building a better<br>future for yourself.";
  }
  
  if (days > 0) spawnConfetti();
}

function spawnConfetti() {
  const wrap = document.getElementById('achWrap');
  wrap.querySelectorAll('.confetti-dot').forEach(e => e.remove());
  
  const colors = ['#7c5cff','#a78bfa','#4f6df5','#fbbf24','#34d399'];
  
  for (let i = 0; i < 16; i++) {
    const dot = document.createElement('div');
    dot.className = 'confetti-dot';
    const size = 4 + Math.random() * 5;
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';
    dot.style.background = colors[i % colors.length];
    dot.style.left = (10 + Math.random() * 80) + '%';
    dot.style.top = (Math.random() * 60) + 'px';
    wrap.appendChild(dot);
  }
}

function shareAchievement() {
  haptic('tap');
  const days = noContactDaysNow();
  const firstName = getFirstName();
  const text = firstName 
    ? `${firstName} has been No Contact for ${days} days. Not just moving on — moving up. #MoveOnApp`
    : `I've been No Contact for ${days} days. Not just moving on — moving up. #MoveOnApp`;
  
  if (navigator.share) {
    navigator.share({text}).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(() => {
      toast('Achievement copied to clipboard', 'clipboard');
    }).catch(() => {
      toast('Achievement copied!', 'share');
    });
  }
}

// ============ PROFILE SCREEN ============

function renderProfile() {
  const firstName = getFirstName();
  const initial = firstName ? firstName.charAt(0).toUpperCase() : '?';
  const displayName = firstName || 'User';
  
  document.getElementById('profileAvatar').textContent = initial;
  document.getElementById('profileName').innerHTML = `${displayName} <svg class="inline-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h16"/><path d="M4 18l-1.6-9L8 12l4-7 4 7 5.6-3L20 18"/></svg>`;
  
  const days = noContactDaysNow();
  document.getElementById('prNcDays').textContent = days;
  
  const jc = Object.values(state.journal).filter(e => 
    (e.text && e.text.trim()) || e.mood
  ).length;
  document.getElementById('prJournals').textContent = jc;
  
  const totalMissions = state.missionsCompletedTotal + state.missions.filter(m => m.done).length;
  document.getElementById('prMissions').textContent = totalMissions;
  
  const milestonesHit = [7, 14, 21, 30, 60, 90].filter(d => days >= d).length;
  document.getElementById('prAch').textContent = milestonesHit;

  const statusEl = document.querySelector('.pstatus');
  if (days === 0) {
    statusEl.textContent = 'Starting the journey.';
  } else if (days < 7) {
    statusEl.textContent = 'First steps. Keep going.';
  } else if (days < 30) {
    statusEl.textContent = 'Building momentum.';
  } else {
    statusEl.textContent = 'Focused. Healing. Growing.';
  }

  document.getElementById('swDaily').classList.toggle('on', state.reminders.daily);
  document.getElementById('swUrge').classList.toggle('on', state.reminders.urge);
}

function toggleSwitch(id) {
  haptic('tap');
  if (id === 'swDaily') { 
    state.reminders.daily = !state.reminders.daily; 
  }
  if (id === 'swUrge') { 
    state.reminders.urge = !state.reminders.urge; 
  }
  saveState();
  renderProfile();
  toast('Settings updated', 'check');
}

// ============ URGE TIMER ============

let urgeSeconds = 120;
let urgeInterval = null;
const URGE_TOTAL = 120;
const URGE_CIRC = 603.2;

function renderUrgeTimer() {
  const mm = String(Math.floor(urgeSeconds / 60)).padStart(2, '0');
  const ss = String(urgeSeconds % 60).padStart(2, '0');
  document.getElementById('urgeTime').textContent = `${mm}:${ss}`;
  const frac = 1 - (urgeSeconds / URGE_TOTAL);
  document.getElementById('urgeRing').style.strokeDashoffset = URGE_CIRC * (1 - frac);
}

function toggleUrgeTimer() {
  haptic('tap');
  const btn = document.getElementById('urgeBtn');
  if (urgeInterval) {
    clearInterval(urgeInterval); 
    urgeInterval = null;
    btn.textContent = 'Resume';
    btn.classList.remove('primary');
    return;
  }
  
  if (urgeSeconds <= 0) { 
    urgeSeconds = URGE_TOTAL; 
  }
  
  btn.textContent = 'Pause';
  btn.classList.add('primary');
  
  urgeInterval = setInterval(() => {
    urgeSeconds--;
    renderUrgeTimer();
    
    if (urgeSeconds <= 0) {
      clearInterval(urgeInterval); 
      urgeInterval = null;
      state.urgesResisted++;
      saveState();
      
      btn.textContent = 'Start again';
      btn.classList.add('primary');
      
      const firstName = getFirstName();
      const capEl = document.getElementById('urgeTime').parentElement.querySelector('.cap');
      capEl.textContent = firstName 
        ? `You made it, ${firstName}. Proud of you.` 
        : "You made it. Proud of you.";
      
      toast('You resisted the urge! 💪', 'star');
    }
  }, 1000);
}

function handleDoElse(label) {
  haptic('tap');
  if (urgeInterval) { 
    clearInterval(urgeInterval); 
    urgeInterval = null; 
    const btn = document.getElementById('urgeBtn');
    btn.textContent = 'Start breathing'; 
    btn.classList.add('primary');
  }
  
  urgeSeconds = URGE_TOTAL; 
  renderUrgeTimer();
  state.urgesResisted++;
  saveState();
  
  toast(`Nice choice — logged "${label}" instead`, 'heart');
}
