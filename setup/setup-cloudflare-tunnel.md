# Fresh Restart — install `cloudflared`, run an ephemeral tunnel in `screen`, and get the `trycloudflare` URL

# Table of contents

1. Prerequisites
2. Install cloudflared
   * Debian/Ubuntu (apt)
   * RHEL/CentOS (rpm)
   * macOS (Homebrew)
   * Windows (chocolatey / manual)
   * Generic tarball
3. Run ephemeral tunnel in `screen` (the "Fresh Restart" recipe)
4. Commands to obtain the generated `trycloudflare` URL
5. Alternative: systemd service
6. Alternative: Docker
7. Recommended file permissions and log rotation
8. Troubleshooting & common errors
9. Security notes
10. Clean up / stop the tunnel

---

# 1. Prerequisites

* A machine with a shell (Linux/macOS recommended). The examples assume `bash`.
* `screen` installed (or `tmux` if you prefer).
* `cloudflared` binary (instructions below).
* Local service running on the port you want to expose (your examples use `http://localhost:8081`).
* Sufficient privileges to create files in `/tmp` and start background processes; `sudo` may be needed for installation or systemd.

Install `screen` on Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y screen
```

---

# 2. Install `cloudflared`

> Choose the method matching your OS. If you already have `cloudflared`, skip to section 3.

## Debian / Ubuntu (recommended: Cloudflare apt repo)

A generic safe approach (root or sudo):

```bash
# fetch and install the official cloudflared package (requires sudo)
curl -L -o cloudflared.deb "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
sudo dpkg -i cloudflared.deb
# fix dependencies if needed
sudo apt-get -f install -y
rm -f cloudflared.deb

# Verify:
cloudflared --version
```

> If your distribution provides `cloudflared` as a package in its repos, prefer the distro package manager. The above downloads the official release from GitHub.

## RHEL / CentOS / Fedora (rpm)

```bash
curl -L -o cloudflared.rpm "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.rpm"
sudo rpm -i cloudflared.rpm
rm -f cloudflared.rpm

# Verify:
cloudflared --version
```

## macOS (Homebrew)

```bash
brew install cloudflare/cloudflare/cloudflared
# verify
cloudflared --version
```

## Windows (choco) — PowerShell as Admin

```powershell
choco install cloudflared
# or download the exe from GitHub releases if not using choco
cloudflared --version
```

## Generic tarball (any Linux / arch)

```bash
# Download, make executable, move to /usr/local/bin
curl -L -o cloudflared.tgz "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.tgz"
tar xzf cloudflared.tgz
sudo mv cloudflared /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
rm cloudflared.tgz

cloudflared --version
```

---

# 3. Run the ephemeral tunnel in `screen` ("Fresh Restart" recipe)

This runs `cloudflared` in a detached `screen` session named `cloudflare-tunnel`, logs stdout/stderr to `/tmp/cloudflare-tunnel.log`, and lets `cloudflared` create an ephemeral `trycloudflare` URL which you can extract from the log.

**Commands (copy/paste):**

```bash
# stop any existing screen session named cloudflare-tunnel (if present)
screen -S cloudflare-tunnel -X quit || true

# small pause to let screen exit fully
sleep 2

# start a new detached screen session running cloudflared; adjust the local URL/port as needed
screen -dmS cloudflare-tunnel bash -c "cloudflared tunnel --url http://localhost:8081 2>&1 | tee /tmp/cloudflare-tunnel.log"

# give cloudflared a few seconds to start and emit the trycloudflare URL
sleep 10
```

**Notes:**

* Replace `http://localhost:8081` with any local service you want to expose (e.g. `http://127.0.0.1:3000`).
* `screen -dmS` starts a detached `screen` session. `bash -c "..."` runs a shell command inside the session.
* `tee /tmp/cloudflare-tunnel.log` records output so you can inspect logs and pull the ephemeral URL.

---

# 4. Get the ephemeral `trycloudflare` URL (extract from log)

After starting the tunnel, the ephemeral URL will be printed in the `cloudflared` output. Use `grep` to extract it:

```bash
# extract the last trycloudflare URL in the log
grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cloudflare-tunnel.log | tail -1
```

If you want to see all lines mentioning `trycloudflare`:

```bash
cat /tmp/cloudflare-tunnel.log | grep "trycloudflare.com"
```

If you prefer to watch the log in real time until the URL appears:

```bash
# watch the log; press Ctrl+C to stop
tail -f /tmp/cloudflare-tunnel.log
```

Example expected line in the log (your output will differ):

```
2025-10-13T12:34:56Z INF Serving tunnel from e4f3b6a2-... https://abcdef-1234.trycloudflare.com
```

If `grep -oP` is not available (some systems don't have GNU grep with `-P`), you can use `sed`:

```bash
sed -n 's/.*\(https:\/\/[a-z0-9-]\+\.trycloudflare\.com\).*/\1/p' /tmp/cloudflare-tunnel.log | tail -1
```

---

# 5. Alternative: run as a systemd service (recommended for production)

Create a systemd unit to run cloudflared on boot and automatically restart.

**Create unit file**`/etc/systemd/system/cloudflare-tunnel.service`:

```ini
[Unit]
Description=Cloudflare ephemeral tunnel
After=network.target

[Service]
Type=simple
User=nobody
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:8081
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/cloudflared.log
StandardError=append:/var/log/cloudflared.log

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cloudflare-tunnel.service
sudo journalctl -u cloudflare-tunnel -f
# or inspect /var/log/cloudflared.log
tail -n 200 /var/log/cloudflared.log
```

**Notes:**

* Adjust `ExecStart` path if `cloudflared` is in `/usr/bin/`.
* Use an appropriate `User=` (prefer a less-privileged user created for this service).
* The ephemeral URL will appear in the logs just like with the `screen` method.

---

# 6. Alternative: Docker

If you prefer Docker, run the official `cloudflare/cloudflared` image and map in any config or pass the `--url`:

```bash
docker run -d --name cloudflared \
  --restart unless-stopped \
  cloudflare/cloudflared:latest tunnel --url http://host.docker.internal:8081
```

For Linux hosts where `host.docker.internal` may not resolve, replace with the host IP (e.g., `--url http://172.17.0.1:8081`) or run cloudflared in host network mode (`--network host`) if acceptable.

Check container logs for the `trycloudflare` hostname:

```bash
docker logs -f cloudflared
```

---

# 7. Log rotation & permissions

* The example uses `/tmp/cloudflare-tunnel.log`. For persistent usage prefer `/var/log/cloudflared.log` and configure `logrotate`:
  * Create `/etc/logrotate.d/cloudflared` to rotate logs daily and keep a few copies.
* Ensure the service user has write access to the chosen log file.
* `/tmp` is cleared on reboot on many Linux distributions; ephemeral logs are fine for short-lived testing.

---

# 8. Troubleshooting & common errors

* **No `trycloudflare` URL appears**
  * Wait 10–30 seconds — cloudflared needs to establish the tunnel.
  * Check logs: `tail -n 200 /tmp/cloudflare-tunnel.log` or `journalctl -u cloudflare-tunnel -n 200`.
  * Ensure your local service is reachable at `http://localhost:8081`. From the same host run `curl -I http://localhost:8081`.
* **`screen` not installed**
  * Install with `sudo apt install screen` (Debian/Ubuntu) or `sudo yum install screen` (CentOS).
* **`grep -P` not supported**
  * Use the `sed` alternative shown earlier.
* **cloudflared exits with permission or auth errors**
  * An ephemeral `--url` tunnel doesn’t require Cloudflare account authentication: it creates a temporary `trycloudflare` hostname. If you try other `tunnel` subcommands that require a named/registered tunnel, you may need to login/register (`cloudflared tunnel login`).
* **Service is unreachable via trycloudflare URL**
  * Confirm local app is listening, firewall rules allow outbound TLS, and no proxy on the host is interfering.

---

# 9. Security notes

* The `trycloudflare` hosts are ephemeral: anyone with the URL can reach your exposed service while the tunnel exists. Treat the URL like a secret (do not post publicly).
* For production, register tunnels with Cloudflare Access or a named persistent tunnel and use authentication (mTLS / Cloudflare Access / origin rules).
* Do not expose admin interfaces without auth. Add IP allowlists, basic auth, or Cloudflare Access policies for sensitive services.
* Logs may contain sensitive info — secure them appropriately.

---

# 10. Cleanup / stop the tunnel

**If using `screen`:**

```bash
# kill the named screen session
screen -S cloudflare-tunnel -X quit || echo "no session"
# optionally delete the log
rm -f /tmp/cloudflare-tunnel.log
```

**If using systemd:**

```bash
sudo systemctl stop cloudflare-tunnel
sudo systemctl disable cloudflare-tunnel
```

**If using Docker:**

```bash
docker stop cloudflared && docker rm cloudflared
```

---

# Example full session (copy & run)

```bash
# stop any prior session, start new one, then print the URL
screen -S cloudflare-tunnel -X quit || true
sleep 2
screen -dmS cloudflare-tunnel bash -c "cloudflared tunnel --url http://localhost:8081 2>&1 | tee /tmp/cloudflare-tunnel.log"
sleep 10
grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cloudflare-tunnel.log | tail -1
# if grep -P not available:
# sed -n 's/.*\(https:\/\/[a-z0-9-]\+\.trycloudflare\.com\).*/\1/p' /tmp/cloudflare-tunnel.log | tail -1
```
