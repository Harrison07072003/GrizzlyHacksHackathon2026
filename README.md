# Inbox Intern

Inbox Intern is a small, retro-inspired phishing-awareness game built for the
browser. Review emails, decide whether to trust or report them, and protect the
company's balance. Suspicious messages include realistic scams involving
account security, deliveries, payments, job offers, and urgent virus warnings.

## Getting Started

The game is a static website and does not require installing dependencies.

1. Clone or download this repository.
2. Open `src/index.html` in a modern web browser.
3. Choose **Normal Mode** or **Hard Mode** to start a shift.

If your browser restricts local files, serve the repository with any local
static-file server and open `src/index.html` through that server.

## How to Play

1. Choose whether to play Normal or Hard Mode.
2. When new mail arrives, open the inbox.
3. Read the sender, subject, and message. Look closely at addresses, links,
   requests for sensitive information, urgency, and other warning signs.
4. Click the message to finish its typewriter reveal or move on to the choices.
5. Select **Yes, Trust** for legitimate email or **No, Report** for phishing.
6. Review the explanation and score change, then continue to the next email.

The game ends immediately if the company balance drops below $0. Otherwise,
finish all rounds to complete the shift. Your final screen shows your score,
remaining balance, and performance result.

### Normal Mode

- 7 rounds: 6 randomly selected Normal emails followed by 1 Hard email.
- Starts with **$500**.
- No timer.

### Hard Mode

- 10 randomly selected Hard emails.
- Starts with **$300**.
- Each email has a **10-second timer** that starts after the full message has
  finished loading.
- If time runs out, the email is counted as incorrect and the game moves on.

Emails do not repeat within a shift. Correct and incorrect answers use the
reward and penalty assigned to each email; a missed Hard Mode question applies
that email's incorrect-answer penalty.

## Controls

- Click the inbox button to open arriving mail.
- Click the email to finish the text reveal or show the answer choices.
- Click **Yes, Trust** or **No, Report** to answer.
- Click the result panel to continue. Timed-out questions advance automatically.
- Click **Quit** to return to the mode selection screen.
- Keyboard: **Enter** or **Space** starts/restarts a game from the title or
  results, opens arriving mail, advances the message, or continues from a
  result; **Y** or **1** trusts; **N** or **2** reports.

## Project Structure

```text
src/
  index.html   Game screen and interface
  script.js    Email bank, game state, scoring, and timers
  style.css    Retro handheld styling and responsive layout
```

## Built With

- HTML
- CSS
- JavaScript
- Optional Google Fonts, with local monospace fallbacks
