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
  jq '.["insecure-registries"] += ["https://harbor.nanjiren.online"]' /etc/docker/daemon.json > /tmp/daemon.json && mv /tmp/daemon.json /etc/docker/daemon.json
else
  echo "daemon.json does not exist, creating it..."
  echo '{"insecure-registries": ["https://harbor.nanjiren.online"]}' > /etc/docker/daemon.json
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
  if docker login -u $DOCKER_REGISTRY_USERNAME -p $DOCKER_REGISTRY_PASSWORD https://harbor.nanjiren.online; then
    break
  else
    echo "AIChat Pro authorization failed, please re-enter your account and password."
  fi
done

# Clone the repository and install dependencies
echo "curl -o docker-compose.yml..."
curl -o docker-compose.yml https://raw.githubusercontent.com/Nanjiren01/AIChatWeb/pro/docker-compose.yml


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

# Check current Web Secret in docker-compose.yml and prompt for change if needed
CURRENT_WEB_SECRET=$(grep 'WEB_SECRET:' docker-compose.yml | cut -d ':' -f2 | xargs)
echo "Current Web Secret is: $CURRENT_WEB_SECRET"
read -p "Do you want to change the Web Secret? (y/N): " DECISION

if [[ "$DECISION" =~ ^[Yy]$ ]]; then
    echo "Please input the new Web Secret (at least 8 characters):"
    read -p "Web Secret: " NEW_WEB_SECRET
    regex='^[A-Za-z0-9]{8,}$'
    if [[ $NEW_WEB_SECRET =~ $regex ]]; then
        sed -i "s/WEB_SECRET:.*/WEB_SECRET: $NEW_WEB_SECRET/g" docker-compose.yml
        echo "Web Secret updated."
    else
        echo "Invalid Web Secret. Keeping the current one."
    fi
fi

# Check for STORE_TYPE and prompt for configuration
STORE_TYPE=$(grep 'STORE_TYPE:' docker-compose.yml | cut -d ':' -f2 | xargs)

if [ -z "$STORE_TYPE" ]; then
    echo "Store type is not set. Please choose the store type by typing (local/oss):"
    read -p "Store Type: " STORE_TYPE_CHOICE
    STORE_TYPE=${STORE_TYPE_CHOICE:-local}
fi

attempt_count=0
max_attempts=3

while [ $attempt_count -lt $max_attempts ]; do
    read -p "Please choose the store type by typing 'local' or 'oss' (Attempt $((attempt_count + 1))/$max_attempts): " STORE_TYPE_CHOICE
    if [[ "$STORE_TYPE_CHOICE" == "local" ]] || [[ "$STORE_TYPE_CHOICE" == "oss" ]]; then
        STORE_TYPE=$STORE_TYPE_CHOICE
        break
    else
        echo "Invalid input. Please type 'local' or 'oss'."
        attempt_count=$((attempt_count + 1))
    fi

    if [ $attempt_count -eq $max_attempts ]; then
        echo "Maximum attempts reached. Exiting script."
        exit 1
    fi
done

if [[ "$STORE_TYPE" == "local" ]]; then
    # Handle local storage configuration
    EXISTING_LOCAL_PATH=$(grep 'LOCAL_PATH:' docker-compose.yml | cut -d ':' -f2 | xargs)
    echo "Using local storage. Current path is: ${EXISTING_LOCAL_PATH:-/app/aichat/images}"
    read -p "New local storage path (press enter to use existing/default): " NEW_LOCAL_PATH
    LOCAL_PATH=${NEW_LOCAL_PATH:-$EXISTING_LOCAL_PATH}
    sed -i "s#LOCAL_PATH:.*#LOCAL_PATH: $LOCAL_PATH#g" docker-compose.yml
else
    # Handle OSS storage configuration
    EXISTING_OSS_ENDPOINT=$(grep 'OSS_ENDPOINT:' docker-compose.yml | cut -d ':' -f2 | xargs)
    EXISTING_OSS_BUCKET_NAME=$(grep 'OSS_BUCKET_NAME:' docker-compose.yml | cut -d ':' -f2 | xargs)
    EXISTING_OSS_ACCESS_KEY_ID=$(grep 'OSS_ACCESS_KEY_ID:' docker-compose.yml | cut -d ':' -f2 | xargs)
    EXISTING_OSS_ACCESS_KEY_SECRET=$(grep 'OSS_ACCESS_KEY_SECRET:' docker-compose.yml | cut -d ':' -f2 | xargs)

    echo "Using OSS storage. Please input the OSS configurations."
    read -p "OSS Endpoint [${EXISTING_OSS_ENDPOINT}]: " OSS_ENDPOINT
    OSS_ENDPOINT=${OSS_ENDPOINT:-$EXISTING_OSS_ENDPOINT}
    read -p "OSS Bucket Name [${EXISTING_OSS_BUCKET_NAME}]: " OSS_BUCKET_NAME
    OSS_BUCKET_NAME=${OSS_BUCKET_NAME:-$EXISTING_OSS_BUCKET_NAME}
    read -p "OSS Access Key ID [${EXISTING_OSS_ACCESS_KEY_ID}]: " OSS_ACCESS_KEY_ID
    OSS_ACCESS_KEY_ID=${OSS_ACCESS_KEY_ID:-$EXISTING_OSS_ACCESS_KEY_ID}
    read -p "OSS Access Key Secret [${EXISTING_OSS_ACCESS_KEY_SECRET}]: " OSS_ACCESS_KEY_SECRET
    OSS_ACCESS_KEY_SECRET=${OSS_ACCESS_KEY_SECRET:-$EXISTING_OSS_ACCESS_KEY_SECRET}

    sed -i "s/STORE_TYPE:.*/STORE_TYPE: oss/g" docker-compose.yml
    sed -i "s/OSS_ENDPOINT:.*/OSS_ENDPOINT: $OSS_ENDPOINT/g" docker-compose.yml
    sed -i "s/OSS_BUCKET_NAME:.*/OSS_BUCKET_NAME: $OSS_BUCKET_NAME/g" docker-compose.yml
    sed -i "s/OSS_ACCESS_KEY_ID:.*/OSS_ACCESS_KEY_ID: $OSS_ACCESS_KEY_ID/g" docker-compose.yml
    sed -i "s/OSS_ACCESS_KEY_SECRET:.*/OSS_ACCESS_KEY_SECRET: $OSS_ACCESS_KEY_SECRET/g" docker-compose.yml
fi

sed -i "s/SUPERADMIN_USERNAME:.*/SUPERADMIN_USERNAME: $SUPER_USERNAME/g" docker-compose.yml
sed -i "s/SUPERADMIN_PASSWORD:.*/SUPERADMIN_PASSWORD: $SUPER_PASSWORD/g" docker-compose.yml
sed -i "s/WEB_SECRET:.*/WEB_SECRET: $WEB_SECRET/g" docker-compose.yml
sed -i "s/SECRET:.*/SECRET: $WEB_SECRET/g" docker-compose.yml
sed -i "s/LOG_LEVEL:.*/LOG_LEVEL: INFO/g" docker-compose.yml


# Pull and start the Docker containers
docker compose pull

docker compose up -d