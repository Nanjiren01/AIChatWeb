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

# 检查是否安装了 jq 并在必要时进行安装
if ! command -v jq >/dev/null; then
  echo "jq 未安装，正在安装..."
  yum install -y jq
fi

# 检查 /etc/docker/daemon.json 是否存在并进行修改
if [ -e /etc/docker/daemon.json ]; then
  echo "daemon.json 存在，正在更新..."
  jq '.["insecure-registries"] += ["https://harbor.nanjiren.online"]' /etc/docker/daemon.json > /tmp/daemon.json && mv /tmp/daemon.json /etc/docker/daemon.json
else
  echo "daemon.json 不存在，正在创建..."
  echo '{"insecure-registries": ["https://harbor.nanjiren.online"]}' > /etc/docker/daemon.json
fi

# 重启 Docker 守护进程
echo "正在重启 Docker 守护进程..."
systemctl restart docker

# 提示输入 AIChat Pro 私有仓库凭据
while true; do
  echo "请输入 AIChat Pro 授权账户用户名："
  read -p "授权账户用户名: " DOCKER_REGISTRY_USERNAME
  echo "请输入 AIChat Pro 授权账户密码："
  read -s -p "授权账户密码: " DOCKER_REGISTRY_PASSWORD

  # 登录 AIChat Pro 私有仓库
  echo ""
  echo "正在登录 Docker 私有仓库..."
  if docker login -u $DOCKER_REGISTRY_USERNAME -p $DOCKER_REGISTRY_PASSWORD https://harbor.nanjiren.online; then
    break
  else
    echo "AIChat Pro 授权失败，请重新输入您的账户和密码。"
  fi
done

# 克隆仓库并安装依赖
echo "正在下载 docker-compose.yml..."
curl -o docker-compose.yml https://raw.githubusercontent.com/Nanjiren01/AIChatWeb/pro/docker-compose.yml



echo "请输入超级管理员用户名。"
echo "仅支持字母和数字，长度应在6到20之间，且不能以数字开头。"
read -p "用户名: " SUPER_USERNAME
regex='^[A-Za-z][A-Za-z0-9]{5,19}$'
if [[ $SUPER_USERNAME =~ $regex ]]; then
    echo "超级管理员用户名有效。"
else
    echo "超级管理员用户名无效。"
    exit 1
fi

echo "请输入超级管理员密码。"
echo "仅支持字母和数字，长度应在6到20之间。"
echo "应用程序运行后，您可以在网页上更改密码。"
read -p "密码: " SUPER_PASSWORD
regex='^[A-Za-z0-9]{6,20}$'
if [[ $SUPER_PASSWORD =~ $regex ]]; then
    echo "超级管理员密码有效。"
else
    echo "超级管理员密码无效。"
    exit 1
fi


# Check current Web Secret in docker-compose.yml and prompt for updates
CURRENT_WEB_SECRET=$(grep 'WEB_SECRET:' docker-compose.yml | cut -d ':' -f2 | xargs)
echo "当前的 Web Secret 为: $CURRENT_WEB_SECRET"
read -p "您想更改 Web Secret 吗？(y/N):  " DECISION

if [[ "$DECISION" =~ ^[Yy]$ ]]; then
    attempt_count=0
    max_attempts=3
    regex='^[A-Za-z0-9#@$%^&*()_+]{8,}$'

    while [ $attempt_count -lt $max_attempts ]; do
        echo "请输入新的 Web Secret (尽量复杂，至少 8 个字符):"
        read -p "Web Secret: " NEW_WEB_SECRET

        if [[ $NEW_WEB_SECRET =~ $regex ]]; then
            # Update Web Secret for both admin and web services
            sed -i "s/WEB_SECRET:.*/WEB_SECRET: $NEW_WEB_SECRET/g" docker-compose.yml
            sed -i "s/SECRET:.*/SECRET: $NEW_WEB_SECRET/g" docker-compose.yml
            echo "Web Secret 已更新。"
            break
        else
            echo "Web Secret 无效，请重新输入。"
            attempt_count=$((attempt_count + 1))
        fi

        if [ $attempt_count -eq $max_attempts ]; then
            echo "尝试次数达到上限。正在退出脚本..."
            restore_original_docker_compose
            exit 1
        fi
    done
fi

# Check for STORE_TYPE and prompt for configuration
STORE_TYPE=$(grep 'STORE_TYPE:' "docker-compose-backup-$BACKUP_TIME.yml" | cut -d ':' -f2 | xargs)

echo "当前的 Store Type 为: ${STORE_TYPE:-local}"
read -p "请输入以选择存储类型（输入 'local' 或 'oss'）:" STORE_TYPE_CHOICE
STORE_TYPE=${STORE_TYPE_CHOICE:-$STORE_TYPE}

attempt_count=0
max_attempts=3

while [ $attempt_count -lt $max_attempts ]; do
    if [[ "$STORE_TYPE" == "local" || "$STORE_TYPE" == "oss" ]]; then
        break
    fi

    read -p "输入无效。请输入 'local' 或 'oss'。 (尝试次数 $((attempt_count + 1))/$max_attempts): " STORE_TYPE_CHOICE
    if [[ "$STORE_TYPE_CHOICE" == "local" || "$STORE_TYPE_CHOICE" == "oss" ]]; then
        STORE_TYPE=$STORE_TYPE_CHOICE
        break
    else
        echo "输入无效。请输入 'local' 或 'oss'。"
        attempt_count=$((attempt_count + 1))
    fi

    if [ $attempt_count -eq $max_attempts ]; then
        echo "尝试次数达到上限。正在退出脚本..."
        restore_original_docker_compose
        exit 1
    fi
done

if [[ "$STORE_TYPE" == "local" ]]; then
    # Handle local storage configuration
    EXISTING_LOCAL_PATH=$(grep 'LOCAL_PATH:' "docker-compose-backup-$BACKUP_TIME.yml" | cut -d ':' -f2 | xargs)
    echo "使用本地存储。当前路径为: ${EXISTING_LOCAL_PATH:-/app/aichat/images}"
    read -p "输入新的本地存储路径（按Enter键使用现有/默认值）:  " NEW_LOCAL_PATH
    LOCAL_PATH=${NEW_LOCAL_PATH:-$EXISTING_LOCAL_PATH}
    sed -i "s#LOCAL_PATH:.*#LOCAL_PATH: $LOCAL_PATH#g" docker-compose.yml
else
    # Handle OSS storage configuration
    EXISTING_OSS_ENDPOINT=$(grep 'OSS_ENDPOINT:' "docker-compose-backup-$BACKUP_TIME.yml" | tail -n1 | cut -d ':' -f2- | xargs)
    EXISTING_OSS_BUCKET_NAME=$(grep 'OSS_BUCKET_NAME:' "docker-compose-backup-$BACKUP_TIME.yml" | tail -n1 | cut -d ':' -f2- | xargs)
    EXISTING_OSS_ACCESS_KEY_ID=$(grep 'OSS_ACCESS_KEY_ID:' "docker-compose-backup-$BACKUP_TIME.yml" | tail -n1 | cut -d ':' -f2- | xargs)
    EXISTING_OSS_ACCESS_KEY_SECRET=$(grep 'OSS_ACCESS_KEY_SECRET:' "docker-compose-backup-$BACKUP_TIME.yml" | tail -n1 | cut -d ':' -f2- | xargs)

    echo "使用 OSS 存储。请输入新的 OSS 配置或直接按Enter键以使用现有值。"

    echo "当前 OSS Endpoint: $EXISTING_OSS_ENDPOINT"
    read -p "输入新的 OSS Endpoint 或直接按Enter键保留原有值: " OSS_ENDPOINT
    OSS_ENDPOINT=${OSS_ENDPOINT:-$EXISTING_OSS_ENDPOINT}

    echo "当前 OSS Bucket Name: $EXISTING_OSS_BUCKET_NAME"
    read -p "输入新的 OSS Bucket Name 或直接按Enter键保留原有值: " OSS_BUCKET_NAME
    OSS_BUCKET_NAME=${OSS_BUCKET_NAME:-$EXISTING_OSS_BUCKET_NAME}

    echo "当前 OSS Access Key ID: $EXISTING_OSS_ACCESS_KEY_ID"
    read -p "输入新的 OSS Access Key ID 或直接按Enter键保留原有值: " OSS_ACCESS_KEY_ID
    OSS_ACCESS_KEY_ID=${OSS_ACCESS_KEY_ID:-$EXISTING_OSS_ACCESS_KEY_ID}

    echo "当前 OSS Access Key Secret: $EXISTING_OSS_ACCESS_KEY_SECRET"
    read -p "输入新的 OSS Access Key Secret 或直接按Enter键保留原有值: " OSS_ACCESS_KEY_SECRET
    OSS_ACCESS_KEY_SECRET=${OSS_ACCESS_KEY_SECRET:-$EXISTING_OSS_ACCESS_KEY_SECRET}

    sed -i "s#STORE_TYPE:.*#STORE_TYPE: oss#g" docker-compose.yml
    sed -i "s#OSS_ENDPOINT:.*#OSS_ENDPOINT: $OSS_ENDPOINT#g" docker-compose.yml
    sed -i "s#OSS_BUCKET_NAME:.*#OSS_BUCKET_NAME: $OSS_BUCKET_NAME#g" docker-compose.yml
    sed -i "s#OSS_ACCESS_KEY_ID:.*#OSS_ACCESS_KEY_ID: $OSS_ACCESS_KEY_ID#g" docker-compose.yml
    sed -i "s#OSS_ACCESS_KEY_SECRET:.*#OSS_ACCESS_KEY_SECRET: $OSS_ACCESS_KEY_SECRET#g" docker-compose.yml

fi

sed -i "s/SUPERADMIN_USERNAME:.*/SUPERADMIN_USERNAME: $SUPER_USERNAME/g" docker-compose.yml
sed -i "s/SUPERADMIN_PASSWORD:.*/SUPERADMIN_PASSWORD: $SUPER_PASSWORD/g" docker-compose.yml
sed -i "s/WEB_SECRET:.*/WEB_SECRET: $WEB_SECRET/g" docker-compose.yml
sed -i "s/SECRET:.*/SECRET: $WEB_SECRET/g" docker-compose.yml
sed -i "s/LOG_LEVEL:.*/LOG_LEVEL: INFO/g" docker-compose.yml


# Pull and start the Docker containers
docker compose pull

docker compose up -d