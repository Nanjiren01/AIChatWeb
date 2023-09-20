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

# Clone the repository and install dependencies
echo "curl -o docker-compose.yml..."
curl -o docker-compose.yml https://raw.githubusercontent.com/Nanjiren01/AIChatWeb/main/docker-compose.yml

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

