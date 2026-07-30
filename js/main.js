/* =========================================================
   MAIN INITIALIZATION
========================================================= */

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
  const mouths = {1:'M8 16.2c1.5-2.2 6.5-2.2 8 0',2:'M8 15.6c1.2-1.1 6.8-1.1 8 0',3:'M8 15h8',4:'M8 14c1.2 1.6 6.8 1.6 8 0',5:'M7 13.2c1.9 3.2 7.2 3.2 10 0'};
  const eyes = {1:'<circle cx="9" cy="10" r="1.1"/><circle cx="15" cy="10" r="1.1"/><path d="M7.8 8.3l2.2 1M16.2 8.3l-2.2 1"/>',2:'<circle cx="9" cy="10" r="1.1"/><circle cx="15" cy="10" r="1.1"/>',3:'<circle cx="9" cy="10" r="1.1"/><circle cx="15" cy="10" r="1.1"/>',4:'<circle cx="9" cy="10" r="1.1"/><circle cx="15" cy="10" r="1.1"/>',5:'<path d="M7.8 9.6c.6-1 1.6-1 2.2 0M14 9.6c.6-1 1.6-1 2.2 0"/>'};
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/>${eyes[level]}<path d="${mouths[level]}"/></svg>`;
}

// ============ HAPTIC FEEDBACK ============
function haptic(type = 'light') {
  if (navigator.vibrate) {
    switch(type) {case 'light':navigator.vibrate(10);break;case 'medium':navigator.vibrate(20);break;case 'heavy':navigator.vibrate(30);break;case 'success':navigator.vibrate([10,30,10]);break;case 'delete':navigator.vibrate([15,10,15]);break;case 'tap':navigator.vibrate(5);break;}
  }
}

// ============ iOS SWIPE-BACK GESTURE ============
let touchStartX=0,touchStartY=0,swipeHandled=false;
document.addEventListener('touchstart',(e)=>{touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY;swipeHandled=false;},{passive:true});
document.addEventListener('touchmove',(e)=>{if(swipeHandled)return;const dx=e.touches[0].clientX-touchStartX,dy=e.touches[0].clientY-touchStartY;if(dx>60&&Math.abs(dx)>Math.abs(dy)*2&&touchStartX<30){swipeHandled=true;haptic('light');const s=document.querySelector('.screen.active');if(s&&s.id!=='screen-home')go('home');}},{passive:true});

// ============ PULL TO REFRESH ============
let pullStart=0,pulling=false,pullThreshold=80;
document.getElementById('app').addEventListener('touchstart',(e)=>{if(document.getElementById('app').scrollTop===0){pullStart=e.touches[0].clientY;pulling=true;}},{passive:true});
document.getElementById('app').addEventListener('touchmove',(e)=>{if(!pulling)return;const d=e.touches[0].clientY-pullStart;if(d>0&&d<pullThreshold*1.5){const ind=document.getElementById('pullIndicator');if(ind){const h=Math.min(d,pullThreshold);ind.style.height=h+'px';ind.style.opacity=h/pullThreshold;ind.textContent=d>=pullThreshold?'↓ Release to refresh':'↓ Pull to refresh';}}},{passive:true});
document.getElementById('app').addEventListener('touchend',()=>{if(!pulling)return;pulling=false;const ind=document.getElementById('pullIndicator');if(ind){const d=parseInt(ind.style.height)||0;if(d>=pullThreshold){ind.innerHTML='<div class="loading-spinner" style="margin:10px auto;"></div>';ind.style.height='50px';ind.style.opacity='1';setTimeout(()=>{ind.style.height='0px';ind.style.opacity='0';haptic('success');toast('Refreshed','check');const s=document.querySelector('.screen.active');if(s)go(s.id.replace('screen-',''));},800);}else{ind.style.height='0px';ind.style.opacity='0';}}},{passive:true});

// ============ PUSH NOTIFICATIONS ============
let notificationInterval=null;
function requestNotificationPermission(){if(!('Notification' in window)){toast('Notifications not supported');return;}if(Notification.permission==='granted'){scheduleDailyReminder();toast('Notifications already enabled!','bell');addNotificationButton();return;}if(Notification.permission==='denied'){toast('Notifications blocked.');return;}Notification.requestPermission().then(p=>{if(p==='granted'){scheduleDailyReminder();toast('Notifications enabled!','bell');haptic('success');addNotificationButton();}else{toast('No worries!');}});}
function scheduleDailyReminder(){if(!('Notification' in window)||Notification.permission!=='granted')return;if(notificationInterval)clearInterval(notificationInterval);const now=new Date(),st=new Date();st.setHours(9,0,0,0);if(now>st)st.setDate(st.getDate()+1);setTimeout(()=>{showLocalNotification();notificationInterval=setInterval(()=>showLocalNotification(),24*60*60*1000);},st-now);state.reminders.notifications=true;saveState();}
function showLocalNotification(){if(Notification.permission!=='granted')return;const m=['How are you feeling today?','Your streak is waiting for you!','Take a deep breath. You\'ve got this.','Time to check in!','Don\'t forget your daily missions!'];const msg=m[Math.floor(Math.random()*m.length)];const n=new Notification('Move On',{body:msg,icon:'/move-on/assets/icons/icon-192.png',vibrate:[100,50,100],tag:'moveon-daily',renotify:true});n.onclick=()=>{window.focus();n.close();};}
function addNotificationButton(){const ps=document.getElementById('screen-profile');if(!ps||!ps.classList.contains('active'))return;const rc=ps.querySelector('.card:last-of-type');if(!rc)return;const ex=document.getElementById('notificationCard');if(ex)ex.remove();const c=document.createElement('div');c.id='notificationCard';c.className='card';c.style.marginTop='14px';const pg='Notification' in window&&Notification.permission==='granted';c.innerHTML=`<div style="display:flex;align-items:center;gap:12px;"><div style="font-size:28px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg></div><div style="flex:1;"><div style="font-size:14px;font-weight:700;">Daily Reminders</div><div style="font-size:12px;color:var(--text-dim);">${pg?'Enabled':'Get motivated every day'}</div></div><button onclick="requestNotificationPermission()" style="background:${pg?'var(--bg-elev3)':'var(--text)'};border:1px solid var(--border);color:${pg?'var(--text)':'#000000'};padding:8px 14px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;">${pg?'On':'Enable'}</button></div>`;rc.after(c);}
const origRP=typeof renderProfile==='function'?renderProfile:function(){};
renderProfile=function(){origRP();setTimeout(addNotificationButton,100);};

// ============ STREAK FREEZE ============
if(!state.streakFreezes)state.streakFreezes=0;
function earnStreakFreeze(){state.streakFreezes=(state.streakFreezes||0)+1;saveState();toast('Streak Freeze earned! You have '+state.streakFreezes,'star');}
function useStreakFreeze(){if(!state.streakFreezes||state.streakFreezes<=0){toast('No streak freezes available.','lock');return false;}state.streakFreezes--;const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);startDate=yesterday;saveState();toast('Streak protected! '+state.streakFreezes+' freezes left','heart');haptic('success');renderHome();return true;}
function checkStreakFreeze(){const lastVisit=state.lastVisit?new Date(state.lastVisit):null;if(!lastVisit)return;const h=(new Date()-lastVisit)/(1000*60*60);if(h>24&&h<48&&state.streakFreezes>0){if(confirm('You missed a day! Use a Streak Freeze?\n\nYou have '+state.streakFreezes+' freezes.')){useStreakFreeze();}}}
const origAdd=typeof addMissionPrompt==='function'?addMissionPrompt:function(){};
addMissionPrompt=function(){origAdd();const done=state.missions.filter(m=>m.done).length;if(done>0&&done%5===0&&!state.freezeEarnedAt?.[done]){if(!state.freezeEarnedAt)state.freezeEarnedAt={};state.freezeEarnedAt[done]=true;earnStreakFreeze();}};

// ============ AI THERAPIST CHAT ============
if(!state.chatHistory)state.chatHistory=[];
function addChatMessage(text,sender){if(!state.chatHistory)state.chatHistory=[];state.chatHistory.push({text,sender,time:new Date().toISOString()});saveState();}
function renderChat(){const c=document.getElementById('chatMessages');if(!c)return;c.innerHTML='';if(!state.chatHistory||state.chatHistory.length===0){const fn=getFirstName(),name=fn?` ${fn}`:'';addChatMessage(`Hi${name}! I'm Ava, your AI therapist. I'm here to listen and support you. How are you feeling today?`,'therapist');}state.chatHistory.forEach(msg=>{const b=document.createElement('div');if(msg.sender==='user'){b.style.cssText='align-self:flex-end;background:#fff;color:#000;padding:12px 16px;border-radius:18px 18px 4px 18px;max-width:80%;font-size:14px;line-height:1.5;animation:fadein 0.3s ease;';}else{b.style.cssText='align-self:flex-start;background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);color:#fff;padding:12px 16px;border-radius:18px 18px 18px 4px;max-width:80%;font-size:14px;line-height:1.5;animation:fadein 0.3s ease;';}b.textContent=msg.text;c.appendChild(b);});c.scrollTop=c.scrollHeight;}
async function sendMessage(){const input=document.getElementById('chatInput');const text=input.value.trim();if(!text)return;haptic('tap');addChatMessage(text,'user');input.value='';input.disabled=true;renderChat();const container=document.getElementById('chatMessages'),typing=document.createElement('div');typing.id='typingIndicator';typing.style.cssText='align-self:flex-start;background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);color:#888;padding:12px 16px;border-radius:18px;font-size:13px;font-style:italic;';typing.textContent='Thinking...';container.appendChild(typing);container.scrollTop=container.scrollHeight;try{const messages=[{role:'system',content:'You are Ava, a warm AI therapist. Keep responses 2-4 sentences. Be empathetic.'},...state.chatHistory.slice(-20).map(msg=>({role:msg.sender==='user'?'user':'assistant',content:msg.text}))];const response=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer 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','HTTP-Referer':window.location.href,'X-Title':'Move On App'},body:JSON.stringify({model:'openai/gpt-oss-20b:free',messages,max_tokens:200,temperature:0.7})});const ind=document.getElementById('typingIndicator');if(ind)ind.remove();if(response.ok){const data=await response.json();addChatMessage(data.choices[0].message.content,'therapist');}else{throw new Error('API error');}}catch(error){const ind=document.getElementById('typingIndicator');if(ind)ind.remove();addChatMessage("I hear you. Tell me more about how you're feeling.",'therapist');}renderChat();input.disabled=false;input.focus();}
function clearChat(){if(confirm('Clear chat history?')){state.chatHistory=[];saveState();renderChat();haptic('medium');}}
document.addEventListener('keypress',function(e){if(e.key==='Enter'&&document.getElementById('screen-therapist')?.classList.contains('active')){sendMessage();}});

// ============ INITIALIZE APP ============
window.addEventListener('DOMContentLoaded',()=>{if(state&&state.hasCompletedOnboarding){document.getElementById('onboarding').classList.add('hidden');go('home');}});
if(typeof renderUrgeTimer==='function')renderUrgeTimer();
if(typeof renderHome==='function')renderHome();
setTimeout(()=>checkStreakFreeze(),500);
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/move-on/service-worker.js').then(r=>console.log('SW registered')).catch(e=>console.log('SW failed:',e));});}
