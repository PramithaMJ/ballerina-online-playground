Fresh Restart

step 1

```
screen -X -S cloudflare-tunnel quit
```

sleep 2

```
screen -dmS cloudflare-tunnel bash -c "cloudflared tunnel --url http://localhost:8081 2>&1 | tee /tmp/cloudflare-tunnel.log"
```

sleep 10

```
grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cloudflare-tunnel.log | tail -1
```

```

cat /tmp/cloudflare-tunnel.log | grep "trycloudflare.com"
```

--

screen -dmS cloudflare-tunnel bash -c "cloudflared tunnel --url http://localhost:8081 2>&1 | tee /tmp/cloudflare-tunnel.log"

grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cloudflare-tunnel.log | tail -1
