/* =========================================================
   ONBOARDING LOGIC
========================================================= */

const onbQuestions = [
  {
    title: "What brings you to Move On?",
    options: ["Getting over a breakup", "Building better habits", "Both — a fresh start"]
  },
  {
    title: "How long has it been since you cut contact?",
    options: ["Just started today", "A few days", "A few weeks", "Longer than a month"]
  },
  {
    title: "What's your biggest struggle right now?",
    options: ["The urge to text them", "Staying motivated", "Loneliness", "Overthinking everything"]
  },
  {
    title: "What do you want to focus on daily?",
    options: ["Staying No Contact", "Journaling my thoughts", "Building new habits", "All of the above"]
  }
];

let onbIndex = 0;
const onbAnswers = new Array(onbQuestions.length).fill(null);

function onbGoToName() {
  document.getElementById('onb-welcome').classList.remove('active');
  document.getElementById('onb-name').classList.add('active');
  
  const nameInput = document.getElementById('nameInput');
  const nameBtn = document.getElementById('nameNextBtn');
  
  nameInput.focus();
  
  nameInput.addEventListener('input', function() {
    nameBtn.disabled = this.value.trim().length === 0;
  });
  
  // Allow Enter key to submit
  nameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && this.value.trim().length > 0) {
      onbSaveName();
    }
  });
}

function onbSaveName() {
  const nameInput = document.getElementById('nameInput');
  const name = nameInput.value.trim();
  
  if (name) {
    state.userName = name;
    saveState();
    
    document.getElementById('onb-name').classList.remove('active');
    document.getElementById('onb-questions').classList.add('active');
    onbIndex = 0;
    renderOnbQuestion();
  }
}

function onbBackToWelcome() {
  document.getElementById('onb-name').classList.remove('active');
  document.getElementById('onb-welcome').classList.add('active');
}

function renderOnbQuestion() {
  const q = onbQuestions[onbIndex];
  document.getElementById('onbQTitle').textContent = q.title;

  const dotsWrap = document.getElementById('onbDots');
  dotsWrap.innerHTML = '';
  onbQuestions.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'onb-dot' + (i <= onbIndex ? ' filled' : '');
    dotsWrap.appendChild(d);
  });

  document.getElementById('onbBackBtn').classList.toggle('invisible', onbIndex === 0);

  const optWrap = document.getElementById('onbOptions');
  optWrap.innerHTML = '';
  q.options.forEach((opt, i) => {
    const el = document.createElement('div');
    el.className = 'onb-option' + (onbAnswers[onbIndex] === i ? ' selected' : '');
    el.innerHTML = `<span>${opt}</span><div class="ring">${CHECK_SVG}</div>`;
    el.onclick = () => {
      onbAnswers[onbIndex] = i;
      renderOnbQuestion();
    };
    optWrap.appendChild(el);
  });

  const nextBtn = document.getElementById('onbNextBtn');
  nextBtn.disabled = onbAnswers[onbIndex] === null;
  nextBtn.textContent = (onbIndex === onbQuestions.length - 1) ? 'Build my plan' : 'Continue';
}

function onbBack() {
  if (onbIndex === 0) {
    document.getElementById('onb-questions').classList.remove('active');
    document.getElementById('onb-name').classList.add('active');
    return;
  }
  onbIndex--;
  renderOnbQuestion();
}

function onbNext() {
  if (onbAnswers[onbIndex] === null) return;
  if (onbIndex < onbQuestions.length - 1) {
    onbIndex++;
    renderOnbQuestion();
  } else {
    onbStartBuilding();
  }
}

function onbStartBuilding() {
  document.getElementById('onb-questions').classList.remove('active');
  document.getElementById('onb-building').classList.add('active');

  const subs = [
    "Reading your answers...",
    "Setting your No Contact goal...",
    "Picking your daily missions...",
    "Personalizing your plan..."
  ];
  const subEl = document.getElementById('onbBuildingSub');
  const fill = document.getElementById('onbProgressFill');
  let pct = 0;
  let subIdx = 0;
  subEl.textContent = subs[0];
  
  const buildTimer = setInterval(() => {
    pct += 8 + Math.random() * 10;
    if (pct >= 100) {
      pct = 100;
      fill.style.width = '100%';
      clearInterval(buildTimer);
      setTimeout(onbFinish, 400);
      return;
    }
    fill.style.width = pct + '%';
    const newSubIdx = Math.min(subs.length - 1, Math.floor((pct / 100) * subs.length));
    if (newSubIdx !== subIdx) { 
      subIdx = newSubIdx; 
      subEl.textContent = subs[subIdx]; 
    }
  }, 260);
}

function onbFinish() {
  state.hasCompletedOnboarding = true;
  document.getElementById('onboarding').classList.add('hidden');
  saveState();
  go('home');
  const firstName = getFirstName();
  toast(firstName ? `Welcome, ${firstName}! Let's begin your journey` : 'Your custom plan is ready', 'star');
}
