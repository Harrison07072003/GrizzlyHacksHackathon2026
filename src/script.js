// ================= Inbox Intern =================
// Simple state machine:
// title -> waiting -> mail (email available) -> reading -> choosing -> result -> waiting ...
// After all rounds, a balance below 0 means fired; otherwise the shift is complete.

const NORMAL_START_MONEY = 500;
const HARD_START_MONEY = 300;
const HARD_TIME_LIMIT = 10;

// ---- Sample emails (add more here!) ----
// phishing: true = it's a scam. reward = $ for the right call, penalty = $ lost for the wrong call.
const EMAILS = [
  {
    from: "IT Help Desk <support@bytebage1-it.com>",
    subject: "URGENT: Password expires in 1 hour!",
    body: "Hi employee,\n\nYour email password will EXPIRE in 1 hour. Verify your login now to keep your account:\n\nhttp://bytebage1-login.co/verify\n\nFailure to act will result in account deletion.\n- IT Team",
    phishing: true,
    difficulty: "Normal",
    reward: 100,
    penalty: 250,
    explain: "The domain is 'bytebage1' (a number 1, not an L!), it uses a generic greeting, creates fake urgency and wants you to log in through a strange link. Real IT never threatens to delete your account.",
  },
  {
    from: "Maria Lopez <maria.lopez@bytebagel.com>",
    subject: "Team lunch Friday",
    body: "Hey team!\n\nWe're doing a team lunch this Friday at 12:30 in the break room to celebrate hitting our Q3 goals. No need to RSVP, just bring your appetite.\n\nThanks for all your hard work!\nMaria (Your Manager)",
    phishing: false,
    difficulty: "Normal",
    reward: 100,
    penalty: 150,
    explain: "It comes from the real company domain (bytebagel.com), from someone you know, has no links or attachments, and doesn't ask for anything sensitive.",
  },
  {
    from: "Dave Byte (CEO) <ceo.dave.byte@gmail.com>",
    subject: "Quick favor - confidential",
    body: "Are you at your desk? I need you to buy 5 x $100 gift cards for a client right now. Scratch off the codes and email them to me.\n\nKeep this between us. I'm in a meeting and can't talk.\n\nSent from my iPhone",
    phishing: true,
    difficulty: "Normal",
    reward: 150,
    penalty: 300,
    explain: "A CEO wouldn't use a personal Gmail, ask an intern for gift cards, or demand secrecy. Gift card requests are a classic scam. Always verify by calling the person directly.",
  },
  {
    from: "HR Team <hr@bytebagel.com>",
    subject: "Reminder: Benefits enrollment closes Nov 15",
    body: "Hi team,\n\nFriendly reminder that open enrollment for health benefits closes on November 15.\n\nPlease log in to the employee portal the way you normally do to review your options. Questions? Stop by HR in Room 204.\n\n- Byte & Bagel HR",
    phishing: false,
    difficulty: "Normal",
    reward: 100,
    penalty: 150,
    explain: "Company domain, a reasonable deadline, and it tells you to use the portal you already know instead of clicking a random link. You can even walk over to HR to check.",
  },
  {
    from: "Accounts <billing@quickpay-invoices.biz>",
    subject: "Invoice #88213 OVERDUE - Final Notice",
    body: "Dear Customer,\n\nYour payment of $4,870.00 is overdue. Open the attached invoice immediately to avoid legal action.\n\nAttachment: Invoice_88213.pdf.exe\n\nRegards,\nBilling Dept.",
    phishing: true,
    difficulty: "Normal",
    reward: 100,
    penalty: 250,
    explain: "Unknown sender, scary legal threats, and the attachment ends in '.exe'. That's a program, not a PDF! Opening it could install malware on the company network.",
  },
  {
    from: "IT Department <it@bytebagel.com>",
    subject: "Scheduled maintenance this Saturday",
    body: "Hello everyone,\n\nThe Wi-Fi and shared drives will be down for maintenance this Saturday from 8am to 11am. No action is needed on your part.\n\nQuestions? Reply here or visit the IT desk on floor 2.\n- IT Department",
    phishing: false,
    difficulty: "Normal",
    reward: 100,
    penalty: 150,
    explain: "Company domain, purely informational, no links, and no requests for passwords or money. Not every email is a trap!",
  },
  {
    from: "ShipExpress <notify@shipexpres-track.info>",
    subject: "Your package could not be delivered",
    body: "We attempted to deliver your package but no one was available.\n\nPay a $1.99 redelivery fee within 24 hours:\nhttp://shipexpres-track.info/pay\n\nOtherwise your package will be returned to sender.",
    phishing: true,
    difficulty: "Hard",
    reward: 100,
    penalty: 200,
    explain: "You weren't expecting a package, 'shipexpres' is misspelled, and the tiny fee is bait to steal your card details.",
  },
  {
    from: "Byte & Bagel Accounts <accounts@bytebagel.com>",
    subject: "Password reset requested",
    body: "Hi Sam,\n\nA password reset was requested for your Byte & Bagel account. If this was you, continue from the account settings page you normally use. If not, you can ignore this message and contact IT through the company directory.\n\nByte & Bagel Account Services",
    phishing: false,
    difficulty: "Normal",
    reward: 100,
    penalty: 150,
    explain: "The sender uses the company's real domain and doesn't include a login link or ask you to share a code. It recommends using the familiar account settings page.",
  },
  {
    from: "ParcelPost <updates@parcelpost.com>",
    subject: "Your order is on its way",
    body: "Hello Sam,\n\nYour order from the Byte & Bagel store has shipped. Your tracking number is PP-2048-7713. You can check delivery progress in the ParcelPost app or on the order page where you made your purchase.\n\nThanks for choosing ParcelPost.",
    phishing: false,
    difficulty: "Normal",
    reward: 100,
    penalty: 150,
    explain: "This expected shipping update provides a tracking number and points you to the app or order page you already use. It doesn't demand payment or credentials.",
  },
  {
    from: "Northstar Bank <alerts@northstarbank.com>",
    subject: "Your debit card purchase",
    body: "A purchase of $18.42 was made with your debit card ending in 0421 today at Corner Market.\n\nIf you recognize it, no action is needed. To review account activity, open the Northstar Bank app directly or call the number on your card.",
    phishing: false,
    difficulty: "Normal",
    reward: 100,
    penalty: 150,
    explain: "The alert is informational and directs you to the bank app or the number printed on your card instead of asking for a password or sending you to an unfamiliar link.",
  },
  {
    from: "The Byte & Bagel Bulletin <newsletter@bytebagel.com>",
    subject: "This week at Byte & Bagel",
    body: "Hello team,\n\nThe October bulletin is ready. This issue includes our volunteer day photos, the new cafe menu, and a welcome to our newest teammates. You can read it on the staff intranet whenever you have a moment.\n\nHave a great week!",
    phishing: false,
    difficulty: "Normal",
    reward: 100,
    penalty: 150,
    explain: "It comes from the company domain, has no pressure or sensitive request, and tells employees to find the newsletter on the usual intranet.",
  },
  {
    from: "ByteBagel Security <security@bytebagel-support.com>",
    subject: "Unusual sign-in — verify now",
    body: "We blocked a sign-in from a new device. Your account will be locked in 15 minutes unless you confirm your password:\nhttps://bytebagel-support.com/secure\n\nReply with the 6-digit code we send to finish verification.",
    phishing: true,
    difficulty: "Hard",
    reward: 150,
    penalty: 250,
    explain: "The sender's domain is bytebagel-support.com, not bytebagel.com. The threat of a 15-minute lockout and request to reply with a verification code are strong signs of credential theft.",
  },
  {
    from: "Windows Security Center <warning@device-health-check.net>",
    subject: "VIRUS FOUND — files will be erased",
    body: "CRITICAL WARNING: 7 viruses detected on your work computer!\n\nYour files will be permanently deleted in 5 minutes. Call our certified technician now at 1-800-555-0184 and leave your computer on. Do not contact your IT department while cleanup is running.",
    phishing: true,
    difficulty: "Hard",
    reward: 150,
    penalty: 300,
    explain: "This fear tactic comes from an unrelated domain, gives an implausibly short deadline, asks you to call an unsolicited number, and tells you to avoid your real IT team. Report it and contact IT through known channels.",
  },
  {
    from: "Identity Desk <reset@bytebagel-login.com>",
    subject: "Requested password reset — ticket BB-1842",
    body: "A password reset was requested for your account (ticket BB-1842).\n\nComplete it here within 30 minutes:\nhttps://bytebagel-login.com/reset/BB-1842\n\nIf you did not request this, use the same link to cancel the reset.",
    phishing: true,
    difficulty: "Hard",
    reward: 150,
    penalty: 250,
    explain: "The realistic ticket number is meant to build trust, but the domain bytebagel-login.com is not the company's bytebagel.com. Both the reset and cancellation route to the same untrusted site.",
  },
  {
    from: "ParcelPost Delivery <tracking@parcelpost.com.delivery-alerts.net>",
    subject: "Address confirmation needed",
    body: "ParcelPost could not deliver package PP-2048-7713.\n\nConfirm your address and pay a $2.15 handling charge:\nhttps://parcelpost.com.delivery-alerts.net/confirm\n\nThis package will be returned today if you do not respond.",
    phishing: true,
    difficulty: "Hard",
    reward: 150,
    penalty: 250,
    explain: "Although the address begins with parcelpost.com, the actual domain is delivery-alerts.net. The tiny fee and same-day threat are designed to capture card and address details.",
  },
  {
    from: "StreamBox Billing <billing@streambox-renewal.com>",
    subject: "Your annual plan renews tomorrow",
    body: "Your StreamBox Plus plan will renew for $289.99 tomorrow. To stop the charge, submit a refund request within 2 hours:\nhttps://streambox-renewal.com/cancel\n\nPlease do not contact your bank until the request is processed.",
    phishing: true,
    difficulty: "Hard",
    reward: 150,
    penalty: 250,
    explain: "The renewal domain is not StreamBox's official site. The unexpected high charge, tight refund deadline, and instruction not to contact your bank are meant to rush you into sharing payment details.",
  },
  {
    from: "Alicia Grant, Talent Team <alicia@brightpath-careers.org>",
    subject: "Remote assistant role — offer attached",
    body: "Congratulations! Your resume was selected for a $92/hour remote assistant role. No interview is needed. Reply with your full name, home address, bank name, and a photo ID so we can issue your first paycheck.\n\nWe have only one opening, so reply in the next hour.",
    phishing: true,
    difficulty: "Hard",
    reward: 150,
    penalty: 300,
    explain: "An unusually high salary, no interview, an unrelated recruiting domain, and requests for banking and identity data before hiring are serious red flags. Verify any offer with the employer independently.",
  },
  {
    from: "Northstar Fraud Team <fraud@northstarbank-alert.com>",
    subject: "Card frozen — confirm the small details",
    body: "We paused card ending 0421 after a $18.42 Corner Market purchase. To release it, sign in at https://northstarbank-alert.com/unfreeze before 6 PM.\n\nYour account reference is 0421. Do not call the number printed on your card; our team is handling this case.",
    phishing: true,
    difficulty: "Hard",
    reward: 150,
    penalty: 300,
    explain: "It repeats plausible purchase details, but the domain is northstarbank-alert.com rather than northstarbank.com. A real bank would not discourage you from calling the trusted number on your card.",
  },
  {
    from: "Dave Byte <dave.byte@bytebagel.co>",
    subject: "Payroll update before cutoff",
    body: "Hi, it's Dave. Payroll closes in 20 minutes and my usual account is locked. Please change my direct deposit to the account in the attached form and send me a screenshot when it's done. Keep this between us until payday.",
    phishing: true,
    difficulty: "Hard",
    reward: 150,
    penalty: 300,
    explain: "The sender uses bytebagel.co instead of bytebagel.com. A near-matching domain, payroll urgency, an attachment, and a secrecy request point to an impersonation attempt. Verify with Dave using a known contact method.",
  },
  {
    from: "Byte & Bagel IT <it@bytebage1.com>",
    subject: "MFA enrollment audit",
    body: "We are auditing multi-factor enrollment. Reply with the latest code from your authenticator app so we can confirm your account is active. This request is approved by your manager; no ticket is required.",
    phishing: true,
    difficulty: "Hard",
    reward: 150,
    penalty: 300,
    explain: "The sender uses the digit 1 in bytebage1.com instead of the letter l in bytebagel.com. IT should never ask for an authenticator code by email, and the claim of approval is not proof.",
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
  normalBtn: $("normalBtn"),
  hardBtn: $("hardBtn"),
  timer: $("timer"),
  overScreen: $("overScreen"),
  overTitle: $("overTitle"),
  overText: $("overText"),
  restartBtn: $("restartBtn"),
  tip: $("tip"),
};

// ---- Game state ----
let state = "title";
let selectedMode = "normal";
let money = NORMAL_START_MONEY;
let shownMoney = NORMAL_START_MONEY;
let queue = [];
let index = 0;
let correctCount = 0;
let current = null;
let round = 0;        // bumps on restart/quit so old timers do nothing
let typeTimer = null;
let timerInterval = null;
let resultTimer = null;
let timerDeadline = 0;
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
  const currentRound = queue.length ? Math.min(index + 1, queue.length) : 0;
  el.counter.textContent = `ROUND ${currentRound}/${queue.length}`;
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

function buildQuestionQueue(mode) {
  const normalQuestions = EMAILS.filter((email) => email.difficulty === "Normal");
  const hardQuestions = EMAILS.filter((email) => email.difficulty === "Hard");
  if (normalQuestions.length < 6 || hardQuestions.length < 10) {
    throw new Error("The email bank needs at least 6 Normal and 10 Hard emails.");
  }
  if (mode === "hard") return shuffle(hardQuestions).slice(0, 10);
  const normalSelection = shuffle(normalQuestions).slice(0, 6);
  const hardSelection = shuffle(hardQuestions).slice(0, 1);
  return [...normalSelection, ...hardSelection];
}

function stopQuestionTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  hide(el.timer);
}

function startQuestionTimer() {
  if (selectedMode !== "hard" || timerInterval) return;
  timerDeadline = Date.now() + HARD_TIME_LIMIT * 1000;
  el.timer.textContent = `TIME ${HARD_TIME_LIMIT}`;
  show(el.timer);
  timerInterval = setInterval(() => {
    const secondsLeft = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
    el.timer.textContent = `TIME ${secondsLeft}`;
    if (secondsLeft === 0) {
      stopQuestionTimer();
      choose(null, true);
    }
  }, 100);
}

// ---- Game flow ----
function startGame(mode = selectedMode) {
  round++;
  clearInterval(typeTimer);
  clearTimeout(resultTimer);
  stopQuestionTimer();
  selectedMode = mode;
  money = selectedMode === "hard" ? HARD_START_MONEY : NORMAL_START_MONEY;
  shownMoney = money;
  el.money.textContent = formatMoney(money);
  setMoneyClass();
  queue = buildQuestionQueue(selectedMode);
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
  startQuestionTimer();
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

function choose(trusted, timedOut = false) {
  if (timedOut ? !["mail", "reading", "choosing"].includes(state) : state !== "choosing") return;
  stopQuestionTimer();
  if (timedOut) {
    clearInterval(typeTimer);
    typing = false;
  }
  state = "result";
  const correct = !timedOut && trusted !== current.phishing;
  const delta = correct ? current.reward : -current.penalty;
  money += delta;
  if (correct) correctCount++;

  let title;
  if (timedOut) title = "TIME'S UP!";
  else if (correct) title = current.phishing ? "NICE CATCH!" : "GOOD CALL!";
  else title = current.phishing ? "YOU GOT PHISHED!" : "FALSE ALARM!";

  const verdict = current.phishing ? "This was PHISHING. " : "This was LEGIT. ";
  el.resultTitle.textContent = title;
  el.resultAmount.textContent = (delta >= 0 ? "+$" : "-$") + Math.abs(delta);
  el.resultText.textContent = (timedOut ? "No answer was submitted. " : "") + verdict + current.explain;
  el.result.classList.toggle("good", correct);
  el.result.classList.toggle("bad", !correct);

  hide(el.dialog);
  hide(el.choices);
  show(el.result);
  setInbox(false);

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
  if (timedOut) resultTimer = setTimeout(continueAfterResult, 1600);
}

function continueAfterResult() {
  if (state !== "result") return;
  clearTimeout(resultTimer);
  resultTimer = null;
  hide(el.result);
  index++;
  updateCounter();
  el.tip.textContent = TIPS[index % TIPS.length];
  if (money < 0) return gameOver();
  if (index >= queue.length) return endShift();
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
  el.overText.textContent = `${selectedMode === "hard" ? "Hard" : "Normal"} Mode complete. ${rank} Final score: ${correctCount}/${queue.length}. Remaining balance: ${formatMoney(money)}.`;
  el.restartBtn.textContent = "▶ PLAY AGAIN";
  show(el.overScreen);
  jingle([523, 659, 784, 1047, 1319]);
}

function quitToTitle() {
  round++;
  clearInterval(typeTimer);
  clearTimeout(resultTimer);
  stopQuestionTimer();
  typing = false;
  state = "title";
  [el.dialog, el.choices, el.result, el.overScreen].forEach(hide);
  setInbox(false);
  setMood(null);
  show(el.titleScreen);
}

// ---- Input ----
el.normalBtn.addEventListener("click", () => startGame("normal"));
el.hardBtn.addEventListener("click", () => startGame("hard"));
el.restartBtn.addEventListener("click", () => startGame(selectedMode));
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
