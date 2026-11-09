# Zoom Auto-Broadcaster & Video Scheduler

Yeh automation aapki Zoom meeting din mein **2 ya 3 dafa automatically start** karti hai, aapki **recorded video screen share + audio ke sath play** karti hai, participants ko **automatically admit** karti hai, aur video khatam hone ke baad **Zoom meeting automatically end** kar deti hai.

---

## Files Overview

- **`Start-ControlPanel.bat`** — Double-click karein Control Panel (GUI window) kholne ke liye.
- **`Start-MeetingNow.bat`** — Double-click karein foran Zoom meeting + video test karne ke liye.
- **`ZoomAutoBroadcaster-GUI.ps1`** — Graphical Control Panel jahan se aap link, video file, aur din ke 2/3 times set kar sakte hain.
- **`Run-ZoomMeeting.ps1`** — Main automation engine (Zoom launch, Auto-Admit loop, Screen Share with Computer Sound, Fullscreen Video Player, aur Auto-End Meeting).
- **`Register-ZoomSchedule.ps1`** — Windows Task Scheduler mein rozana ke 2 ya 3 times set karne ka script.
- **`config.json`** — Aapki saved settings.

---

## Step 1: Zoom App mein 2 Zaroori Settings (One-Time Setup)

Sab se best aur smooth result ke liye apne **Zoom Desktop App** mein yeh 2 settings aik dafa check kar lein:

1. **Waiting Room OFF rakhein (Recommended):**
   - Zoom mein apni Recurring Meeting ya Personal Meeting ID (PMI) ki settings mein **Waiting Room** ko **Uncheck (OFF)** kar dein aur **"Allow participants to join anytime"** ko **ON** kar dein.
   - *Note:* Agar Waiting Room kisi wajah se ON bhi reh jaye, toh hamara script har 3 seconds baad khud **"Admit All" / "Admit"** button click karta rehta hai.
2. **Audio Automatically Join:**
   - Zoom Desktop App -> **Settings (Gear Icon)** -> **Audio** -> **"Automatically join audio by computer when joining a meeting"** ko **Check (ON)** kar dein.

---

## Step 2: Control Panel se Setup karne ka Tareeqa

1. **`Start-ControlPanel.bat`** par double-click karein.
2. **Zoom Meeting Link:** Apna Zoom meeting link paste karein (ya Meeting ID aur Passcode likhein).
3. **Video File:** **`Browse...`** button par click kar ke apni recorded video (`.mp4`, `.mkv`, `.mov`, `.wmv`) select karein. App khud video ki exact duration (jitne minute/second ki video hai) detect kar legi.
4. **Daily Schedule (Time 1, Time 2, Time 3):**
   - 24-hour format mein apne 2 ya 3 times likhein (maslan `10:00`, `15:00`, `20:00`). Agar sirf 2 times chalana ho toh `Time 3` ka tick hata dein.
5. **`Save & Activate Daily Schedule`** par click karein:
   - Yeh Windows Task Scheduler mein aapke times save kar dega.
6. **`Test / Start Meeting Now`** par click kar ke aap abhi test bhi kar sakte hain!
