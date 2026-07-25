
const DAYS = window.KK_SYNAXARIUM_DATA || window.KK_SYNAXARIUM || [];
const MONTHS = ["","Tout","Baba","Hathor","Kiahk","Toba","Amshir","Baramhat","Baramouda","Bashans","Paona","Abib","Mesra","Nasie"];
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let currentDate = new Date();
let currentDay = null;
let currentStory = null;
let tab = "story";
let searchLimit = 30;
let deferredPrompt = null;

document.addEventListener("DOMContentLoaded", ()=>{
  bind();
  selectGregorianDate(new Date());
  renderCalendar();
  renderSaints();
  renderInstall("iphone");
  restoreSettings();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
});

function bind(){
  $$(".tabs button").forEach(b=>b.onclick=()=>{tab=b.dataset.tab; $$(".tabs button").forEach(x=>x.classList.toggle("active",x===b)); renderStoryPanel();});
  $("#prevMonth").onclick=()=>{currentDate=new Date(currentDate.getFullYear(),currentDate.getMonth()-1,1);renderCalendar()};
  $("#nextMonth").onclick=()=>{currentDate=new Date(currentDate.getFullYear(),currentDate.getMonth()+1,1);renderCalendar()};
  $("#saintSearch").oninput=()=>{searchLimit=30;renderSaints()};
  $("#loadMore").onclick=()=>{searchLimit+=30;renderSaints()};
  $("#searchHeader").onclick=()=>{location.hash="#saints";setTimeout(()=>$("#saintSearch").focus(),300)};
  $("#savedHeader").onclick=()=>{location.hash="#saints";$("#saintSearch").value="saved:";renderSaints()};
  $$("[data-open='reminder']").forEach(b=>b.onclick=()=>$("#reminderModal").showModal());
  $$("[data-close]").forEach(b=>b.onclick=()=>b.closest("dialog").close());
  $("#saveReminder").onclick=saveReminder;
  $("#waitlistForm").onsubmit=e=>{e.preventDefault();localStorage.setItem("kk_waitlist",$("#waitlistEmail").value);$("#waitlistStatus").textContent="You’re on the preview list. Connect an email service before launch.";e.target.reset()};
  $("#prayerForm").onsubmit=savePrayer;
  $$(".install-tabs button").forEach(b=>b.onclick=()=>{$$(".install-tabs button").forEach(x=>x.classList.toggle("active",x===b));renderInstall(b.dataset.device)});
  $("#installButton").onclick=installApp;
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e});
  $("#menuButton").onclick=()=>$("#sidebar").classList.toggle("mobile-open");
  $("#bottomMore").onclick=()=>location.hash="#install";
  $("#saveSaint").onclick=toggleSaved;
  $("#shareSaint").onclick=shareStory;
}

function selectGregorianDate(d){
  currentDate=new Date(d);
  const c=gregorianToCoptic(d.getFullYear(),d.getMonth()+1,d.getDate());
  currentDay=DAYS.find(x=>x.copticMonth===c.month&&x.copticDay===c.day)||DAYS[0];
  currentStory=currentDay?.stories?.[0]||null;
  $("#displayCopticDate").textContent=`${c.day} ${MONTHS[c.month]}`;
  $("#fullCopticDate").textContent=`${c.day} ${MONTHS[c.month]} ${c.year}`;
  $("#gregorianDate").textContent=d.toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"});
  renderCommemorations();
  renderStoryPanel();
  renderCalendar();
  if (currentStory) applyLicensedIcon(currentStory, $("#mainIcon"), $("#mainIconCredit"));
}
function renderCommemorations(){
  $("#commemorationList").innerHTML=(currentDay.stories||[]).map((s,i)=>`<li><button class="comm-button" data-i="${i}">${esc(s.title)}</button></li>`).join("");
  $$(".comm-button").forEach(b=>{b.style.cssText="border:0;background:none;padding:0;text-align:left;color:inherit";b.onclick=()=>{currentStory=currentDay.stories[+b.dataset.i];tab="story";$$(".tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab==="story"));renderStoryPanel()}});
}
function renderStoryPanel(){
  if(!currentStory){$("#storyContent").innerHTML="<p>No entry is available for this day.</p>";return}
  const reflection=makeReflection(currentStory.title);
  const apply=makeApplication(currentStory.title);
  const related=(currentDay.stories||[]).filter(s=>s.id!==currentStory.id);
  let html="";
  if(tab==="story"){
    html=`<h2>${esc(currentStory.title)}</h2>
      <p>${esc(currentStory.story)}</p>
      <div class="source-notice"><strong>About the complete account:</strong> This website keeps the commemoration tied to its correct Coptic date and source. The complete historical wording remains available at the source rather than being silently republished as Koptic Karen content.</div>
      <p><button data-read="${esc(currentStory.id)}">Open full entry</button></p>`;
  } else if(tab==="reflection"){
    html=`<h2>A contemporary reflection</h2><div class="reflection-box"><p>${reflection}</p></div><p>This reflection is original Koptic Karen devotional writing and is not part of the historical Synaxarium text.</p>`;
  } else if(tab==="apply"){
    html=`<h2>How to carry this today</h2><div class="reflection-box"><p>${apply}</p></div><h3>A small prayer</h3><p>Lord Jesus Christ, through the prayers of Your saints, teach me to choose faithfulness in the ordinary moments of this day. Amen.</p>`;
  } else {
    html=`<h2>Also commemorated today</h2>${related.length?related.map(s=>`<p><button data-related="${esc(s.id)}">${esc(s.title)}</button></p>`).join(""):"<p>This is the only entry currently listed for this day.</p>"}`;
  }
  $("#storyContent").innerHTML=html;
  $$("[data-read]").forEach(b=>b.onclick=()=>openStory(currentStory));
  $$("[data-related]").forEach(b=>b.onclick=()=>{currentStory=currentDay.stories.find(s=>s.id===b.dataset.related);tab="story";renderStoryPanel()});
}
function makeReflection(title){
  const t=title.toLowerCase();
  if(t.includes("martyr")) return "This witness asks a difficult modern question: what do we refuse to trade away when faith becomes inconvenient? Most of us will not face the same suffering, but we meet smaller moments of compromise every day. Holiness may begin with one honest choice made when nobody is applauding.";
  if(t.includes("departure")||t.includes("pope")||t.includes("bishop")) return "A faithful life is rarely built in one dramatic moment. It is shaped through years of prayer, repentance, service, and returning to God after weakness. This commemoration invites us to think less about being impressive and more about becoming dependable in love.";
  if(t.includes("consecration")||t.includes("church")) return "A consecrated place reminds us that ordinary things can be offered back to God. The same is true of our schedules, talents, rooms, friendships, and work. What would change today if one ordinary part of life became intentionally His?";
  if(t.includes("feast")||t.includes("cross")||t.includes("resurrection")) return "The Church does not remember holy events as distant history. She invites us to enter them again. Today’s feast asks us to let the truth we celebrate reshape our reactions, priorities, and hope.";
  return "The saints are not presented to make holiness feel unreachable. Their stories reveal what grace can do in real human lives. Today, notice the virtue at the center of this commemoration and practice one quiet expression of it.";
}
function makeApplication(title){
  const t=title.toLowerCase();
  if(t.includes("martyr")) return "Choose one place where fear has made you hide your faith or values. Respond with gentleness rather than aggression, but do not pretend to be someone else. Let courage look like honesty.";
  if(t.includes("departure")) return "Send a message of encouragement, complete one responsibility faithfully, and set aside five uninterrupted minutes for prayer. A holy life grows through small acts repeated with love.";
  if(t.includes("consecration")) return "Choose one space or part of your routine and dedicate it to God today. Clean it, remove one distraction, and use it for something that brings peace or serves another person.";
  return "Write down one virtue you notice in this story. Before the day ends, turn that virtue into one specific action small enough that you will actually do it.";
}
function openStory(story){
  currentStory=story;
  $("#modalDate").textContent=`${currentDay.copticDay} ${MONTHS[currentDay.copticMonth]}`;
  $("#modalTitle").textContent=story.title;
  $("#modalStory").innerHTML=`<p>${esc(story.story)}</p><div class="reflection-box"><strong>Bring it into today</strong><p>${makeApplication(story.title)}</p></div>`;
  $("#sourceLink").href=story.sourceUrl||currentDay.sourceUrl||"https://copticreader.org/app/";
  $("#saveSaint").textContent=isSaved(story.id)?"♥ Saved":"♡ Save";
  applyLicensedIcon(story, $("#modalSaintIcon"), $("#modalIconCredit"));
  $("#storyModal").showModal();
}
function renderCalendar(){
  const y=currentDate.getFullYear(),m=currentDate.getMonth();
  $("#calendarTitle").textContent=new Date(y,m,1).toLocaleDateString(undefined,{month:"long",year:"numeric"});
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  let html=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>`<div class="weekday">${x}</div>`).join("");
  html+="<div class='day-cell blank'></div>".repeat(first);
  const today=new Date();
  for(let day=1;day<=days;day++){
    const d=new Date(y,m,day),c=gregorianToCoptic(y,m+1,day),entry=DAYS.find(x=>x.copticMonth===c.month&&x.copticDay===c.day);
    const isToday=d.toDateString()===today.toDateString(), selected=d.toDateString()===currentDate.toDateString();
    const firstTitle=entry?.stories?.[0]?.title||"";
    html+=`<button class="day-cell ${isToday?"today":""} ${selected?"selected":""}" data-date="${d.toISOString()}"><strong>${day}</strong><small>${c.day} ${MONTHS[c.month]}</small><i>${esc(firstTitle)}</i></button>`;
  }
  $("#calendarGrid").innerHTML=html;
  $$(".day-cell[data-date]").forEach(b=>b.onclick=()=>selectGregorianDate(new Date(b.dataset.date)));
}
function allStories(){
  return DAYS.flatMap(d=>(d.stories||[]).map(s=>({...s,copticMonth:d.copticMonth,copticDay:d.copticDay,day:d})));
}
function renderSaints(){
  const q=$("#saintSearch").value.trim().toLowerCase();
  const saved=getSaved();
  let rows=allStories();
  if(q==="saved:") rows=rows.filter(s=>saved.includes(s.id));
  else if(q) rows=rows.filter(s=>`${s.title} ${s.story} ${MONTHS[s.copticMonth]} ${s.copticDay}`.toLowerCase().includes(q));
  $("#resultMeta").textContent=`${rows.length.toLocaleString()} commemorations found`;
  const visible=rows.slice(0,searchLimit);
  $("#saintsGrid").innerHTML=visible.map(s=>`<button class="saint-card" data-id="${esc(s.id)}"><span class="mini-icon">✣</span><span><small>${s.copticDay} ${MONTHS[s.copticMonth]}</small><h3>${esc(s.title)}</h3><p>${esc(s.story.slice(0,120))}${s.story.length>120?"…":""}</p></span></button>`).join("");
  $$(".saint-card").forEach(b=>b.onclick=()=>{const s=rows.find(x=>x.id===b.dataset.id);currentDay=s.day;openStory(s)});
  $("#loadMore").style.display=rows.length>searchLimit?"block":"none";
}
function toggleSaved(){
  if(!currentStory)return;
  let a=getSaved(),i=a.indexOf(currentStory.id);
  if(i>=0)a.splice(i,1);else a.push(currentStory.id);
  localStorage.setItem("kk_saved",JSON.stringify(a));
  $("#saveSaint").textContent=isSaved(currentStory.id)?"♥ Saved":"♡ Save";
  toast(isSaved(currentStory.id)?"Saved to your saints":"Removed from saved saints");
}
function getSaved(){try{return JSON.parse(localStorage.getItem("kk_saved")||"[]")}catch{return[]}}
function isSaved(id){return getSaved().includes(id)}
async function shareStory(){
  if(!currentStory)return;
  const text=`${currentStory.title} — ${currentStory.copticDay||currentDay.copticDay} ${MONTHS[currentDay.copticMonth]}`;
  if(navigator.share)await navigator.share({title:currentStory.title,text,url:location.href});
  else{await navigator.clipboard.writeText(text+" "+location.href);toast("Copied to clipboard")}
}
function saveReminder(){
  const t=$("#reminderTime").value;localStorage.setItem("kk_reminder",t);$("#reminderStatus").textContent=`Saved for ${formatTime(t)} on this device.`;
  if("Notification"in window)Notification.requestPermission();
}
function restoreSettings(){const t=localStorage.getItem("kk_reminder");if(t)$("#reminderTime").value=t}
function savePrayer(e){
  e.preventDefault();const text=$("#prayerText").value.trim();if(text.length<10)return;
  const a=JSON.parse(localStorage.getItem("kk_prayer_drafts")||"[]");a.push({text,category:$("#prayerCategory").value,date:new Date().toISOString()});localStorage.setItem("kk_prayer_drafts",JSON.stringify(a));
  $("#prayerStatus").textContent="Preview mode: your request is saved privately on this device. Connect the secure prayer backend before public launch.";e.target.reset();
}
function renderInstall(device){
  const steps=device==="iphone"?["Open this website in Safari.","Tap the Share button.","Choose Add to Home Screen.","Open Koptic Karen from the new icon."]:["Open this website in Chrome.","Tap the three-dot menu.","Choose Install app or Add to Home screen.","Confirm and open Koptic Karen."];
  $("#installSteps").innerHTML=steps.map(x=>`<li>${x}</li>`).join("");
}
async function installApp(){if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null}else toast("Use your browser’s Add to Home Screen option.")}
function gregorianToCoptic(year,month,day){
  const jd=gregorianToJD(year,month,day),epoch=1825029.5,n=Math.floor(jd)+.5;
  const cy=Math.floor((4*(n-epoch)+1463)/1461),cm=1+Math.floor((n-copticToJD(cy,1,1))/30),cd=Math.floor(n-copticToJD(cy,cm,1)+1);
  return{year:cy,month:cm,day:cd}
}
function gregorianToJD(y,m,d){if(m<=2){y--;m+=12}const a=Math.floor(y/100),b=2-a+Math.floor(a/4);return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+b-1524.5}
function copticToJD(y,m,d){return 1825029.5-1+365*(y-1)+Math.floor(y/4)+30*(m-1)+d}
function formatTime(v){const[h,m]=v.split(":");return new Date(2000,0,1,+h,+m).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}
function toast(t){const x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2500)}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
/* ===== Functional menu and daily reminders ===== */

document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.getElementById("menuButton");
  const closeMenuButton = document.getElementById("closeMenuButton");
  const menuOverlay = document.getElementById("menuOverlay");
  const slideMenu = document.getElementById("slideMenu");

  const reminderButton = document.getElementById("reminderButton");
  const menuReminderButton = document.getElementById(
    "menuReminderButton"
  );

  const reminderDialog = document.getElementById("reminderDialog");
  const closeReminderButton = document.getElementById(
    "closeReminderButton"
  );

  const reminderTime = document.getElementById(
    "dailyReminderTime"
  );

  const reminderTimezone = document.getElementById(
    "reminderTimezone"
  );

  const saveReminderButton = document.getElementById(
    "saveDailyReminder"
  );

  const testReminderButton = document.getElementById(
    "testDailyReminder"
  );

  const reminderStatus = document.getElementById(
    "dailyReminderStatus"
  );

 function openMenu() {
  if (!slideMenu || !menuOverlay) {
    return;
  }

  slideMenu.hidden = false;
  menuOverlay.hidden = false;

  requestAnimationFrame(() => {
    slideMenu.classList.add("open");
    menuOverlay.classList.add("open");
  });

  slideMenu.setAttribute("aria-hidden", "false");
  menuButton?.setAttribute("aria-expanded", "true");

  document.body.classList.add("menu-is-open");
}

 function closeMenu() {
  if (!slideMenu || !menuOverlay) {
    return;
  }

  slideMenu.classList.remove("open");
  menuOverlay.classList.remove("open");

  slideMenu.setAttribute("aria-hidden", "true");
  menuButton?.setAttribute("aria-expanded", "false");

  document.body.classList.remove("menu-is-open");

  setTimeout(() => {
    slideMenu.hidden = true;
    menuOverlay.hidden = true;
  }, 280);
}
  function openReminderDialog() {
    closeMenu();

    if (typeof reminderDialog?.showModal === "function") {
      reminderDialog.showModal();
    } else {
      reminderDialog?.setAttribute("open", "");
    }
  }

  function closeReminderDialog() {
    reminderDialog?.close();
  }

  menuButton?.addEventListener("click", openMenu);
  closeMenuButton?.addEventListener("click", closeMenu);
  menuOverlay?.addEventListener("click", closeMenu);

  document
    .querySelectorAll(".slide-menu-links a")
    .forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

  reminderButton?.addEventListener(
    "click",
    openReminderDialog
  );

  menuReminderButton?.addEventListener(
    "click",
    openReminderDialog
  );

  closeReminderButton?.addEventListener(
    "click",
    closeReminderDialog
  );

  reminderDialog?.addEventListener("click", (event) => {
    if (event.target === reminderDialog) {
      closeReminderDialog();
    }
  });

  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "Local timezone";

  if (reminderTimezone) {
    reminderTimezone.textContent = timezone;
  }

  const savedTime = localStorage.getItem(
    "kopticKarenReminderTime"
  );

  if (savedTime && reminderTime) {
    reminderTime.value = savedTime;
  }

  saveReminderButton?.addEventListener(
    "click",
    async () => {
      const selectedTime = reminderTime?.value;

      if (!selectedTime) {
        reminderStatus.textContent =
          "Please choose a reminder time.";

        return;
      }

      localStorage.setItem(
        "kopticKarenReminderTime",
        selectedTime
      );

      if (!("Notification" in window)) {
        reminderStatus.textContent =
          "This browser does not support notifications.";

        return;
      }

      try {
        const permission =
          await Notification.requestPermission();

        if (permission === "granted") {
          reminderStatus.textContent =
            `Reminder preference saved for ${
              formatReminderTime(selectedTime)
            }.`;

          localStorage.setItem(
            "kopticKarenNotificationsEnabled",
            "true"
          );
        } else {
          reminderStatus.textContent =
            "The time was saved, but notification permission was not granted.";
        }
      } catch (error) {
        console.error(error);

        reminderStatus.textContent =
          "The time was saved, but notifications could not be enabled.";
      }
    }
  );

  testReminderButton?.addEventListener(
    "click",
    async () => {
      if (!("Notification" in window)) {
        reminderStatus.textContent =
          "This browser does not support notifications.";

        return;
      }

      const permission =
        await Notification.requestPermission();

      if (permission !== "granted") {
        reminderStatus.textContent =
          "Please allow notifications before testing.";

        return;
      }

      try {
        const registration =
          await navigator.serviceWorker.ready;

        await registration.showNotification(
          "Today in the Synaxarium ✣",
          {
            body:
              document.querySelector(
                "#todaySaintName, #heroSaintName"
              )?.textContent ||
              "Open Koptic Karen to meet today’s saints.",

            icon: "assets/icon-192.png",
            badge: "assets/icon-192.png",

            data: {
              url: `${window.location.origin}${
                window.location.pathname
              }#today`
            }
          }
        );

        reminderStatus.textContent =
          "Test notification sent.";
      } catch (error) {
        console.error(error);

        reminderStatus.textContent =
          "The test could not be sent. Install the app and try again.";
      }
    }
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
});

function formatReminderTime(value) {
  const [hours, minutes] = value
    .split(":")
    .map(Number);

  return new Date(
    2000,
    0,
    1,
    hours,
    minutes
  ).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}
