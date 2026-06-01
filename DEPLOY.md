# Deploying Gandalf on a Raspberry Pi

Tested on Raspberry Pi 4 (2 GB+) running Raspberry Pi OS (64-bit, Bookworm).
A Pi 3B+ will work but is tighter on memory.

---

## 1. Install Node.js

Raspberry Pi OS ships with an old Node. Install a current LTS version:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # should print v20.x.x
```

---

## 2. Clone the repo

```bash
cd ~
git clone https://github.com/pewtle/Gandalf.git
cd Gandalf
```

---

## 3. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env if you want a different port (default: 3001)
npm install
```

---

## 4. Build the frontend

```bash
cd ../frontend
npm install
npm run build
# Outputs to frontend/dist/ — served automatically by the backend
```

---

## 5. Add photos

Drop `.jpg`, `.png`, or `.webp` files into the `photos/` directory.
The screensaver picks them up on next restart.

```bash
cp /path/to/your/photos/*.jpg ~/Gandalf/photos/
```

---

## 6. Run the backend as a systemd service (auto-start on boot)

Create the service file:

```bash
sudo nano /etc/systemd/system/gandalf.service
```

Paste:

```ini
[Unit]
Description=Gandalf wall display backend
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Gandalf/backend
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable gandalf
sudo systemctl start gandalf

# Check it's running
sudo systemctl status gandalf
```

---

## 7. Launch Chromium in kiosk mode on boot

Disable screen blanking and open the display full-screen when the desktop loads.

```bash
mkdir -p ~/.config/lxsession/LXDE-pi
nano ~/.config/lxsession/LXDE-pi/autostart
```

Paste:

```
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run http://localhost:3001
```

> The `xset` lines prevent the screen from going blank or turning off.

---

## 8. Reboot and verify

```bash
sudo reboot
```

Gandalf should appear full-screen after boot. The backend starts as a service
before the desktop loads, so the display is ready by the time Chromium opens.

---

## Useful commands

| Task | Command |
|---|---|
| View backend logs | `sudo journalctl -u gandalf -f` |
| Restart backend | `sudo systemctl restart gandalf` |
| Update to latest | `git pull && cd frontend && npm run build && sudo systemctl restart gandalf` |
| Check backend status | `sudo systemctl status gandalf` |

---

## Rotate the display (if needed)

If the monitor is mounted in portrait orientation, add to `/boot/firmware/config.txt`:

```
display_rotate=1   # 90° clockwise
# display_rotate=3 # 90° counter-clockwise
```

Then reboot.
