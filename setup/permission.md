#### 1. Give user access to Docker

```
# Create the docker group (if it doesn’t already exist)
sudo groupadd docker

# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply the group change (log out and back in, or use:)
newgrp docker

```

#### 2. Give user access to Git

Usually Git doesn’t need special privileges.
But if your repository files are owned by `root` because you used `sudo git pull`, fix ownership:

```
sudo chown -R $USER:$USER ~/ballerina-online-playground
```
