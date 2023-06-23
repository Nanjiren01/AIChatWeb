#!/bin/bash

# Check if running on a supported system
case "$(uname -s)" in
  Linux)
    echo "Running on Linux"
    ;;
  Darwin)
    echo "This script only works on Linux, not Mac OS."
    exit 1
    ;;
  *)
    echo "Unsupported operating system."
    exit 1
    ;;
esac

# check whether installed docker & compose

# Check if needed dependencies are installed and install if necessary
if ! command -v docker >/dev/null; then
  case "$(uname -s)" in
    Linux)
      echo "curl -o install-docker-v20.10.21.sh..."
      curl -o install-docker-v20.10.21.sh https://releases.rancher.com/install-docker/20.10.21.sh
      chmod +x install-docker-v20.10.21.sh
      ./install-docker-v20.10.21.sh

      # auto start on boot
      systemctl enable docker
      ;;
    Darwin)
      # /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
      # brew install node git yarn
      ;;
  esac
fi

systemctl start docker

# Check if jq is installed and install if necessary
if ! command -v jq >/dev/null; then
  echo "jq is not installed, installing now..."
  yum install -y jq
fi

# Check if /etc/docker/daemon.json exists and modify it
if [ -e /etc/docker/daemon.json ]; then
  echo "daemon.json exists, updating it..."
  jq '.["insecure-registries"] += ["harbor.nanjiren.online:8099"]' /etc/docker/daemon.json > /tmp/daemon.json && mv /tmp/daemon.json /etc/docker/daemon.json
else
  echo "daemon.json does not exist, creating it..."
  echo '{"insecure-registries": ["harbor.nanjiren.online:8099"]}' > /etc/docker/daemon.json
fi

# Restart Docker daemon
echo "Restarting Docker daemon..."
systemctl restart docker

# Prompt for AIChat Pro private registry credentials
while true; do
  echo "Please input AIChat Pro authorized account username:"
  read -p "Username: " DOCKER_REGISTRY_USERNAME
  echo "Please input AIChat Pro authorized account password:"
  read -s -p "Password: " DOCKER_REGISTRY_PASSWORD

  # Log in to the AIChat Pro private registry
  echo ""
  echo "Logging in to Docker private registry..."
  if docker login -u $DOCKER_REGISTRY_USERNAME -p $DOCKER_REGISTRY_PASSWORD http://harbor.nanjiren.online:8099; then
    break
  else
    echo "AIChat Pro authorization failed, please re-enter your account and password."
  fi
done

# Clone the repository and install dependencies
echo "curl -o docker-compose.yml..."
curl -o docker-compose.yml https://raw.githubusercontent.com/Nanjiren01/AIChatWeb/main/docker-compose.yml

# Replace the image repository with the private registry
if sed -i 's/nanjiren01\/aichat-/harbor.nanjiren.online:8099\/aichat\/aichat-/g' docker-compose.yml; then
echo "Successfully converted to AIChat Pro private registry."
else
echo "Error converting to AIChat Pro private registry."
exit 1
fi

echo "Please input the super admin username. "
echo "Only letters and numbers are supported, the length should between 6 and 20, and they cannot start with a number."
read -p "Username: " SUPER_USERNAME
regex='^[A-Za-z][A-Za-z0-9]{5,19}$'
if [[ $SUPER_USERNAME =~ $regex ]]; then
    echo "Super Admin Username is valid."
else
    echo "Super Admin Username is invalid."
    exit 1
fi

echo "Please input the super admin password. "
echo "Only letters and numbers are supported, and the length should between 6 and 20. "
echo "You can change it on the web page after the Application running"
read -p "Password: " SUPER_PASSWORD
regex='^[A-Za-z0-9]{6,20}$'
if [[ $SUPER_PASSWORD =~ $regex ]]; then
    echo "Super Admin Password is valid."
else
    echo "Super Admin Password is invalid."
    exit 1
fi

sed -i "s/SUPERADMIN_USERNAME:.*/SUPERADMIN_USERNAME: $SUPER_USERNAME/g" docker-compose.yml
sed -i "s/SUPERADMIN_PASSWORD:.*/SUPERADMIN_PASSWORD: $SUPER_PASSWORD/g" docker-compose.yml

docker compose pull

docker compose up -d