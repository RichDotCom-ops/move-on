/* =========================================================
   AUTHENTICATION SYSTEM - FIREBASE
========================================================= */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTgDGLlHc5pwynGb_knP9duEIdPviJxSc",
  authDomain: "stickie-y0aon.firebaseapp.com",
  projectId: "stickie-y0aon",
  storageBucket: "stickie-y0aon.firebasestorage.app",
  messagingSenderId: "967871540144",
  appId: "1:967871540144:web:ba34d0d6d229e54ea64475"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Enable persistence (offline support)
db.enablePersistence().catch((err) => {
  console.log('Offline persistence failed:', err.code);
});

// ============ AUTH STATE ============
let currentUser = null;

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    console.log('Logged in:', user.email || 'Apple user');
    hideLoginScreen();
    loadUserData().then(() => {
      go('home');
      if (typeof renderHome === 'function') renderHome();
    });
  } else {
    currentUser = null;
    showLoginScreen();
  }
});

// ============ LOGIN SCREEN ============
function showLoginScreen() {
  const app = document.getElementById('app');
  const nav = document.querySelector('.bottomnav');
  const login = document.getElementById('loginScreen');
  const onboarding = document.getElementById('onboarding');
  
  if (app) app.style.display = 'none';
  if (nav) nav.style.display = 'none';
  if (login) login.style.display = 'flex';
  if (onboarding) onboarding.classList.add('hidden');
}

function hideLoginScreen() {
  const app = document.getElementById('app');
  const nav = document.querySelector('.bottomnav');
  const login = document.getElementById('loginScreen');
  
  if (app) app.style.display = 'block';
  if (nav) nav.style.display = 'flex';
  if (login) login.style.display = 'none';
}

// ============ EMAIL SIGN UP ============
async function signUpWithEmail() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const name = document.getElementById('loginName').value.trim();
  
  if (!email || !password) {
    toast('Please enter email and password');
    return;
  }
  
  if (password.length < 6) {
    toast('Password must be at least 6 characters');
    return;
  }
  
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    
    // Save user profile to Firestore
    await db.collection('users').doc(result.user.uid).set({
      name: name || email.split('@')[0],
      email: email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      provider: 'email'
    });
    
    // Update display name
    await result.user.updateProfile({
      displayName: name || email.split('@')[0]
    });
    
    haptic('success');
    toast('Account created! Welcome 💜', 'star');
  } catch (error) {
    console.error('Sign up error:', error);
    if (error.code === 'auth/email-already-in-use') {
      toast('Account exists. Please sign in instead.');
    } else if (error.code === 'auth/weak-password') {
      toast('Password too weak. Use 6+ characters.');
    } else {
      toast(error.message);
    }
  }
}

// ============ EMAIL LOGIN ============
async function loginWithEmail() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    toast('Please enter email and password');
    return;
  }
  
  try {
    await auth.signInWithEmailAndPassword(email, password);
    haptic('success');
    toast('Welcome back! 💜', 'star');
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 'auth/user-not-found') {
      toast('No account found. Please sign up.');
    } else if (error.code === 'auth/wrong-password') {
      toast('Incorrect password.');
    } else {
      toast(error.message);
    }
  }
}

// ============ GOOGLE SIGN IN ============
async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  
  try {
    const result = await auth.signInWithPopup(provider);
    const isNew = result.additionalUserInfo?.isNewUser;
    
    if (isNew) {
      await db.collection('users').doc(result.user.uid).set({
        name: result.user.displayName || 'User',
        email: result.user.email || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        provider: 'google'
      });
    }
    
    haptic('success');
    toast('Welcome! 💜', 'star');
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    toast('Google Sign-In failed. Try email login.');
  }
}

// ============ SKIP LOGIN ============
function skipLogin() {
  hideLoginScreen();
  // Show onboarding for new users
  if (state && !state.hasCompletedOnboarding) {
    document.getElementById('onboarding').classList.remove('hidden');
  } else {
    go('home');
  }
  toast('Sign in later to save your data to the cloud', 'bell');
}

// ============ CLOUD DATA SYNC ============
async function saveUserData() {
  if (!currentUser) return;
  
  if (typeof state === 'undefined' || !state) return;
  
  const dataToSave = {
    userName: state.userName || '',
    missions: state.missions || [],
    missionsCompletedTotal: state.missionsCompletedTotal || 0,
    journal: state.journal || {},
    urgesResisted: state.urgesResisted || 0,
    startDate: startDate ? startDate.toISOString() : new Date().toISOString(),
    streakFreezes: state.streakFreezes || 0,
    day7Celebrated: state.day7Celebrated || false,
    rewardsShown: state.rewardsShown || {},
    chatHistory: state.chatHistory || [],
    hasCompletedOnboarding: state.hasCompletedOnboarding || false,
    reminders: state.reminders || { daily: true, urge: true },
    lastVisit: new Date().toISOString()
  };
  
  try {
    await db.collection('users').doc(currentUser.uid).update({
      appData: dataToSave,
      lastActive: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.log('Cloud save failed, using local backup');
    localStorage.setItem('moveon_backup', JSON.stringify(dataToSave));
  }
}

async function loadUserData() {
  if (!currentUser) return;
  
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    
    if (doc.exists) {
      const userData = doc.data();
      
      // Set user name from profile
      if (userData.name && typeof state !== 'undefined') {
        state.userName = userData.name;
      }
      
      // Load app data
      if (userData.appData) {
        const cloudData = userData.appData;
        
        if (typeof state !== 'undefined') {
          state.userName = cloudData.userName || state.userName;
          state.missions = cloudData.missions || [];
          state.missionsCompletedTotal = cloudData.missionsCompletedTotal || 0;
          state.journal = cloudData.journal || {};
          state.urgesResisted = cloudData.urgesResisted || 0;
          state.streakFreezes = cloudData.streakFreezes || 0;
          state.day7Celebrated = cloudData.day7Celebrated || false;
          state.rewardsShown = cloudData.rewardsShown || {};
          state.chatHistory = cloudData.chatHistory || [];
          state.hasCompletedOnboarding = cloudData.hasCompletedOnboarding || false;
          state.reminders = cloudData.reminders || { daily: true, urge: true };
        }
        
        if (cloudData.startDate) {
          startDate = new Date(cloudData.startDate);
        }
      }
    }
  } catch (error) {
    console.log('Cloud load failed, using local data');
    const backup = localStorage.getItem('moveon_backup');
    if (backup && typeof state !== 'undefined') {
      try {
        const data = JSON.parse(backup);
        Object.assign(state, data);
      } catch(e) {}
    }
  }
}

// Auto-save to cloud every 30 seconds
setInterval(() => {
  if (currentUser && typeof state !== 'undefined') {
    saveUserData();
  }
}, 30000);

// Save on important actions
window.addEventListener('beforeunload', () => {
  if (currentUser && typeof state !== 'undefined') {
    saveUserData();
  }
});

// ============ LOGOUT ============
async function logout() {
  if (confirm('Are you sure you want to logout?\n\nYour data is saved to the cloud.')) {
    try {
      await saveUserData(); // Final save
      await auth.signOut();
      toast('Logged out successfully');
    } catch (error) {
      toast('Logout failed. Try again.');
    }
  }
}

// ============ ADD LOGOUT TO PROFILE ============
const origRenderProfile = typeof renderProfile === 'function' ? renderProfile : function(){};
renderProfile = function() {
  origRenderProfile();
  setTimeout(addLogoutButton, 100);
};

function addLogoutButton() {
  if (!currentUser) return;
  
  const profileScreen = document.getElementById('screen-profile');
  if (!profileScreen || !profileScreen.classList.contains('active')) return;
  
  const lastCard = profileScreen.querySelector('.card:last-of-type');
  if (!lastCard) return;
  
  const existing = document.getElementById('logoutCard');
  if (existing) existing.remove();
  
  const card = document.createElement('div');
  card.id = 'logoutCard';
  card.className = 'card';
  card.style.marginTop = '14px';
  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="logout()">
      <div style="font-size:28px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
      </div>
      <div style="flex:1;">
        <div style="font-size:14px;font-weight:700;color:#ff4444;">Logout</div>
        <div style="font-size:12px;color:var(--text-dim);">${currentUser.email || currentUser.displayName || 'Signed in'}</div>
      </div>
    </div>`;
  
  lastCard.after(card);
}
