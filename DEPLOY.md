# Deploying Gandalf on a Raspberry Pi

The Pi runs as a headless server — no screen attached. A wall-mounted iPad or
tablet opens the display in its browser.

Tested on Raspberry Pi 4 running Raspberry Pi OS (64-bit, Bookworm).

---

## 1. Install Raspberry Pi OS

Use **Raspberry Pi Imager** to flash **Raspberry Pi OS (64-bit)**. In the
Imager's advanced settings:

- Set a hostname, e.g. `gandalf`
- Enable SSH
- Configure your Wi-Fi

The Pi will be reachable at `gandalf.local` on your network once booted.

---

## 2. SSH in and install Node.js

```bash
ssh YOUR_USERNAME@gandalf.local

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
node -v  # should print v20.x.x
```

---

## 3. Clone the repo

```bash
cd ~
git clone https://github.com/pewtle/Gandalf.git
cd Gandalf
```

---

## 4. Configure the backend

```bash
cd backend
cp .env.example .env
npm install
```

---

## 5. Build the frontend

```bash
cd ../frontend
npm install
npm run build
# Outputs to frontend/dist/ — served automatically by the backend
```

---

## 6. Add photos

Copy photos to the `photos/` directory (from another machine on the network
or via `scp`):

```bash
scp ~/Pictures/wall-photos/*.jpg YOUR_USERNAME@gandalf.local:~/Gandalf/photos/
```

---

## 7. Run the backend as a systemd service (auto-start on boot)

```bash
sudo nano /etc/systemd/system/gandalf.service
```

Paste:

```ini
[Unit]
Description=Gandalf wall display
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/Gandalf/backend
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable gandalf
sudo systemctl start gandalf

# Verify
sudo systemctl status gandalf
# Gandalf is now reachable at http://gandalf.local:3001
```

---

## 8. Set up the wall tablet

### iPad (recommended)

1. Open **Safari** and go to `http://gandalf.local:3001`
2. Tap the share icon → **Add to Home Screen** — this opens it as a full-screen
   web app with no browser chrome
3. Open the app from the home screen to verify it fills the display
4. To lock it so it can't be accidentally navigated away from:
   **Settings → Accessibility → Guided Access** → turn on, then triple-click
   the home/side button while in the app to start a session

### Android tablet

1. Open Chrome and go to `http://gandalf.local:3001`
2. Tap the menu → **Add to Home Screen**
3. To lock: **Settings → Security → Screen Pinning** (name varies by
   manufacturer) — pin the Gandalf app

---

## Useful commands

| Task | Command |
|---|---|
| View live logs | `sudo journalctl -u gandalf -f` |
| Restart backend | `sudo systemctl restart gandalf` |
| Update to latest | `git pull && cd frontend && npm run build && sudo systemctl restart gandalf` |
| Copy new photos | `scp photos/*.jpg YOUR_USERNAME@gandalf.local:~/Gandalf/photos/` |

---

## Display stays on

Tablets will dim and sleep by default. Prevent this:

- **iPad**: Settings → Display & Brightness → Auto-Lock → **Never**
- **Android**: Settings → Display → Screen timeout → **Never** (or use a
  kiosk/stay-awake app)
