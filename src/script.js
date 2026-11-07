// ================= Inbox Intern =================
// Simple state machine:
// title -> waiting -> mail (email available) -> reading -> choosing -> result -> waiting ...
// Money below 0 -> fired. All emails handled -> shift complete.

const START_MONEY = 500;

// ---- Sample emails (add more here!) ----
// phishing: true = it's a scam. reward = $ for the right call, penalty = $ lost for the wrong call.
const EMAILS = [
  {
    from: "IT Help Desk <support@bytebage1-it.com>",
    subject: "URGENT: Password expires in 1 hour!",
    body: "Hi employee,\n\nYour email password will EXPIRE in 1 hour. Verify your login now to keep your account:\n\nhttp://bytebage1-login.co/verify\n\nFailure to act will result in account deletion.\n- IT Team",
    phishing: true,
    reward: 100,
    penalty: 250,
    explain: "The domain is 'bytebage1' (a number 1, not an L!), it uses a generic greeting, creates fake urgency and wants you to log in through a strange link. Real IT never threatens to delete your account.",
  },
  {
    from: "Maria Lopez <maria.lopez@bytebagel.com>",
    subject: "Team lunch Friday",
    body: "Hey team!\n\nWe're doing a team lunch this Friday at 12:30 in the break room to celebrate hitting our Q3 goals. No need to RSVP, just bring your appetite.\n\nThanks for all your hard work!\nMaria (Your Manager)",
    phishing: false,
    reward: 100,
    penalty: 150,
    explain: "It comes from the real company domain (bytebagel.com), from someone you know, has no links or attachments, and doesn't ask for anything sensitive.",
  },
  {
    from: "Dave Byte (CEO) <ceo.dave.byte@gmail.com>",
    subject: "Quick favor - confidential",
    body: "Are you at your desk? I need you to buy 5 x $100 gift cards for a client right now. Scratch off the codes and email them to me.\n\nKeep this between us. I'm in a meeting and can't talk.\n\nSent from my iPhone",
    phishing: true,
    reward: 150,
    penalty: 300,
    explain: "A CEO wouldn't use a personal Gmail, ask an intern for gift cards, or demand secrecy. Gift card requests are a classic scam. Always verify by calling the person directly.",
  },
  {
    from: "HR Team <hr@bytebagel.com>",
    subject: "Reminder: Benefits enrollment closes Nov 15",
    body: "Hi team,\n\nFriendly reminder that open enrollment for health benefits closes on November 15.\n\nPlease log in to the employee portal the way you normally do to review your options. Questions? Stop by HR in Room 204.\n\n- Byte & Bagel HR",
    phishing: false,
    reward: 100,
    penalty: 150,
    explain: "Company domain, a reasonable deadline, and it tells you to use the portal you already know instead of clicking a random link. You can even walk over to HR to check.",
  },
  {
    from: "Accounts <billing@quickpay-invoices.biz>",
    subject: "Invoice #88213 OVERDUE - Final Notice",
    body: "Dear Customer,\n\nYour payment of $4,870.00 is overdue. Open the attached invoice immediately to avoid legal action.\n\nAttachment: Invoice_88213.pdf.exe\n\nRegards,\nBilling Dept.",
    phishing: true,
    reward: 100,
    penalty: 250,
    explain: "Unknown sender, scary legal threats, and the attachment ends in '.exe'. That's a program, not a PDF! Opening it could install malware on the company network.",
  },
  {
    from: "IT Department <it@bytebagel.com>",
    subject: "Scheduled maintenance this Saturday",
    body: "Hello everyone,\n\nThe Wi-Fi and shared drives will be down for maintenance this Saturday from 8am to 11am. No action is needed on your part.\n\nQuestions? Reply here or visit the IT desk on floor 2.\n- IT Department",
    phishing: false,
    reward: 100,
    penalty: 150,
    explain: "Company domain, purely informational, no links, and no requests for passwords or money. Not every email is a trap!",
  },
  {
    from: "ShipExpress <notify@shipexpres-track.info>",
    subject: "Your package could not be delivered",
    body: "We attempted to deliver your package but no one was available.\n\nPay a $1.99 redelivery fee within 24 hours:\nhttp://shipexpres-track.info/pay\n\nOtherwise your package will be returned to sender.",
    phishing: true,
    reward: 100,
    penalty: 200,
    explain: "You weren't expecting a package, 'shipexpres' is misspelled, and the tiny fee is bait to steal your card details.",
  },
];

const TIPS = [
  "Tip: check the sender's address!",
  "Tip: urgency is a red flag.",
  "Tip: hover links before clicking.",
  "Tip: '.exe' is never a document.",
  "Tip: nobody needs gift cards urgently.",
];

// ---- Elements ----
const $ = (id) => document.getElementById(id);
const el = {
  scene: $("scene"),
  inboxBtn: $("inboxBtn"),
  inboxStatus: $("inboxStatus"),
  badge: $("badge"),
  counter: $("counter"),
  quitBtn: $("quitBtn"),
  moneyPanel: $("moneyPanel"),
  money: $("money"),
  moneyFloat: $("moneyFloat"),
  dialog: $("dialog"),
  mailFrom: $("mailFrom"),
  mailSubject: $("mailSubject"),
  mailBody: $("mailBody"),
  dialogHint: $("dialogHint"),
  choices: $("choices"),
  trustBtn: $("trustBtn"),
  rejectBtn: $("rejectBtn"),
  result: $("result"),
  resultTitle: $("resultTitle"),
  resultAmount: $("resultAmount"),
  resultText: $("resultText"),
  titleScreen: $("titleScreen"),
  startBtn: $("startBtn"),
  overScreen: $("overScreen"),
  overTitle: $("overTitle"),
  overText: $("overText"),
  restartBtn: $("restartBtn"),
  tip: $("tip"),
};

// ---- Game state ----
let state = "title";
let money = START_MONEY;
let shownMoney = START_MONEY;
let queue = [];
let index = 0;
let correctCount = 0;
let current = null;
let round = 0;        // bumps on restart/quit so old timers do nothing
let typeTimer = null;
let typing = false;
let fullText = "";

// ---- Tiny 8-bit sounds (Web Audio, no files needed) ----
let audioCtx = null;
function beep(freq = 660, dur = 0.08, vol = 0.05, type = "square") {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) { /* sound is optional */ }
}
const jingle = (notes, gap = 90) => notes.forEach((f, i) => setTimeout(() => beep(f, 0.1), i * gap));

// ---- Helpers ----
const show = (node) => node.classList.remove("hidden");
const hide = (node) => node.classList.add("hidden");
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const formatMoney = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n));

function updateCounter() {
  el.counter.textContent = `MAIL ${index}/${queue.length}`;
}

function setMoneyClass() {
  el.moneyPanel.classList.toggle("warn", money < 250 && money >= 100);
  el.moneyPanel.classList.toggle("danger", money < 100);
}

// Count the money display up/down for a nice effect
function animateMoney() {
  const from = shownMoney;
  const to = money;
  const start = performance.now();
  const dur = 600;
  function step(now) {
    const t = Math.min(1, (now - start) / dur);
    shownMoney = from + (to - from) * t;
    el.money.textContent = formatMoney(shownMoney);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
  setMoneyClass();
}

function floatMoney(delta) {
  const f = el.moneyFloat;
  f.textContent = (delta >= 0 ? "+" : "-") + "$" + Math.abs(delta);
  f.className = "money-float " + (delta >= 0 ? "plus" : "minus");
  void f.offsetWidth; // restart animation
  f.classList.add("show");
}

function setMood(mood) {
  el.scene.classList.remove("happy", "stressed");
  if (mood) el.scene.classList.add(mood);
}

function setInbox(hasMail) {
  el.inboxBtn.classList.toggle("has-mail", hasMail);
  el.badge.classList.toggle("hidden", !hasMail);
  el.inboxStatus.textContent = hasMail ? "1 NEW!" : "No mail";
}

// ---- Game flow ----
function startGame() {
  round++;
  money = START_MONEY;
  shownMoney = START_MONEY;
  el.money.textContent = formatMoney(money);
  setMoneyClass();
  queue = shuffle(EMAILS);
  index = 0;
  correctCount = 0;
  current = null;
  updateCounter();
  setMood(null);
  [el.titleScreen, el.overScreen, el.dialog, el.choices, el.result].forEach(hide);
  setInbox(false);
  jingle([523, 659, 784, 1047]);
  scheduleNextEmail(1200);
}

function scheduleNextEmail(delay) {
  state = "waiting";
  setInbox(false);
  const myRound = round;
  setTimeout(() => {
    if (myRound !== round || state !== "waiting") return;
    if (index >= queue.length) return endShift();
    current = queue[index];
    state = "mail";
    setInbox(true);
    jingle([880, 1175]);
  }, delay);
}

function openEmail() {
  if (state !== "mail") {
    // no mail yet: little shake feedback
    if (state === "waiting") {
      el.inboxBtn.classList.remove("nope");
      void el.inboxBtn.offsetWidth;
      el.inboxBtn.classList.add("nope");
      beep(180, 0.08);
    }
    return;
  }
  state = "reading";
  setInbox(false);
  el.inboxStatus.textContent = "Reading...";
  el.mailFrom.textContent = current.from;
  el.mailSubject.textContent = current.subject;
  show(el.dialog);
  el.dialogHint.classList.add("off");
  typeText(current.body);
  beep(1047, 0.06);
}

function typeText(text) {
  clearInterval(typeTimer);
  fullText = text;
  typing = true;
  let i = 0;
  el.mailBody.textContent = "";
  typeTimer = setInterval(() => {
    i++;
    el.mailBody.textContent = text.slice(0, i);
    if (i % 4 === 0) beep(1200, 0.02, 0.02);
    if (i >= text.length) finishTyping();
  }, 16);
}

function finishTyping() {
  clearInterval(typeTimer);
  typing = false;
  el.mailBody.textContent = fullText;
  el.dialogHint.classList.remove("off");
}

// Clicking the text box: skip typing, or move on to the choice
function advanceDialog() {
  if (state !== "reading") return;
  if (typing) return finishTyping();
  state = "choosing";
  el.dialogHint.classList.add("off");
  show(el.choices);
  beep(784, 0.06);
}

function choose(trusted) {
  if (state !== "choosing") return;
  state = "result";
  const correct = trusted !== current.phishing;
  const delta = correct ? current.reward : -current.penalty;
  money += delta;
  if (correct) correctCount++;

  let title;
  if (correct) title = current.phishing ? "NICE CATCH!" : "GOOD CALL!";
  else title = current.phishing ? "YOU GOT PHISHED!" : "FALSE ALARM!";

  const verdict = current.phishing ? "This was PHISHING. " : "This was LEGIT. ";
  el.resultTitle.textContent = title;
  el.resultAmount.textContent = (delta >= 0 ? "+$" : "-$") + Math.abs(delta);
  el.resultText.textContent = verdict + current.explain;
  el.result.classList.toggle("good", correct);
  el.result.classList.toggle("bad", !correct);

  hide(el.dialog);
  hide(el.choices);
  show(el.result);
  el.inboxStatus.textContent = "No mail";

  floatMoney(delta);
  animateMoney();
  setMood(correct ? "happy" : "stressed");
  if (correct) {
    jingle([659, 784, 1047]);
  } else {
    jingle([392, 330, 262], 120);
    el.moneyPanel.classList.remove("shake");
    void el.moneyPanel.offsetWidth;
    el.moneyPanel.classList.add("shake");
  }
}

function continueAfterResult() {
  if (state !== "result") return;
  hide(el.result);
  index++;
  updateCounter();
  el.tip.textContent = TIPS[index % TIPS.length];
  if (money < 0) return gameOver();
  setTimeout(() => setMood(null), 800);
  scheduleNextEmail(1500);
}

function gameOver() {
  state = "over";
  setInbox(false);
  el.overScreen.classList.add("fired");
  el.overTitle.innerHTML = "YOU'RE<br /><span>FIRED!</span>";
  el.overText.textContent = `The company dropped to ${formatMoney(money)}. You got ${correctCount} of ${index} emails right. Pack up your desk!`;
  el.restartBtn.textContent = "▶ TRY AGAIN";
  show(el.overScreen);
  jingle([523, 466, 392, 262], 180);
}

function endShift() {
  state = "over";
  setInbox(false);
  el.overScreen.classList.remove("fired");
  const rank = correctCount === queue.length ? "Security Superstar!" : correctCount >= queue.length - 2 ? "Solid Intern!" : "Barely Survived!";
  el.overTitle.innerHTML = "SHIFT<br /><span>COMPLETE!</span>";
  el.overText.textContent = `${rank} You got ${correctCount}/${queue.length} right and kept the company at ${formatMoney(money)}.`;
  el.restartBtn.textContent = "▶ PLAY AGAIN";
  show(el.overScreen);
  jingle([523, 659, 784, 1047, 1319]);
}

function quitToTitle() {
  round++;
  clearInterval(typeTimer);
  typing = false;
  state = "title";
  [el.dialog, el.choices, el.result, el.overScreen].forEach(hide);
  setInbox(false);
  setMood(null);
  show(el.titleScreen);
}

// ---- Input ----
el.startBtn.addEventListener("click", startGame);
el.restartBtn.addEventListener("click", startGame);
el.inboxBtn.addEventListener("click", openEmail);
el.dialog.addEventListener("click", advanceDialog);
el.trustBtn.addEventListener("click", () => choose(true));
el.rejectBtn.addEventListener("click", () => choose(false));
el.result.addEventListener("click", continueAfterResult);
el.quitBtn.addEventListener("click", quitToTitle);

// Keyboard: Enter/Space = A button, Y/N or 1/2 for choices
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "enter" || key === " ") {
    e.preventDefault();
    if (state === "title" || state === "over") startGame();
    else if (state === "mail") openEmail();
    else if (state === "reading") advanceDialog();
    else if (state === "result") continueAfterResult();
  } else if (state === "choosing" && (key === "y" || key === "1")) {
    choose(true);
  } else if (state === "choosing" && (key === "n" || key === "2")) {
    choose(false);
  }
});
