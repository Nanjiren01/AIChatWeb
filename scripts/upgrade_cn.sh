#!/bin/bash

# AIChat Pro Update 0.9.x to 0.11.x
# Copyright © 2024 GAI Group. All Rights Reserved.
# Latest: 2024/01/23
echo "*******************************************************************************"
echo "******                                                                   ******"
echo "******                                                                   ******"
echo "******               AIChat Pro Update 0.9.x to 0.11.x                   ******"
echo "******                                                                   ******"
echo "******                                                                   ******"
echo "******         Copyright © 2024 GAI Group. All Rights Reserved.          ******"
echo "******                                                                   ******"
echo "******                           2024/01/23                              ******"
echo "******                                                                   ******"
echo "******                                                                   ******"
echo "*******************************************************************************"

# Add a warning and confirmation before the update begins
echo "请注意：该程序用于AIChat专业版系统0.9.x版本升级到0.11.x版本，请确保官方宣布的AIChat专业版系统最新版是0.11.x，而不是比0.11.x还要新的版本，请及时关注官网https://nanjiren.online获取最新资讯。"
while true; do
    read -p "如您已经知悉上述内容，请输入y后回车开始更新，更新过程中会停止已经运行的AIChat专业版系统，否则请输入n后回车退出更新程序。 (y/n): " DECISION
    if [[ $DECISION =~ ^[Yy]$ ]]; then
        break
    elif [[ $DECISION =~ ^[Nn]$ ]]; then
        echo "更新程序已退出。"
        exit 1
    else
        echo "无效输入，请输入 'y' 或 'n'。"
    fi
done

# Stop the current docker-compose services
docker compose down

# Function to restore the original docker-compose.yml
restore_original_docker_compose() {
    echo "正在恢复原始的 docker-compose.yml 文件..."
    cp "docker-compose-backup-$BACKUP_TIME.yml" docker-compose.yml
}

# Install yq for YAML processing
REQUIRED_YQ_VERSION="4.40.5"

# 检查yq是否已安装
if [ -x "$(command -v yq)" ]; then
    # 获取当前yq版本
    CURRENT_YQ_VERSION=$(yq --version | awk '{print $3}')

    # 比较当前版本和所需版本
    if [ "$CURRENT_YQ_VERSION" != "$REQUIRED_YQ_VERSION" ]; then
        echo "Updating yq to the required version ($REQUIRED_YQ_VERSION)..."
        # 删除旧版本
        sudo rm $(which yq)
    else
        echo "yq is already at the required version ($REQUIRED_YQ_VERSION)."
        exit 0
    fi
else
    echo "yq is not installed. Installing now..."
fi

# 安装或更新yq到指定版本
# 确定操作系统架构
case $(uname -m) in
    x86_64) ARCH="amd64" ;;
    aarch64) ARCH="arm64" ;;
    *) echo "Unsupported architecture" >&2; exit 1 ;;
esac

# 下载并安装yq
sudo wget "https://github.com/mikefarah/yq/releases/download/v${REQUIRED_YQ_VERSION}/yq_linux_${ARCH}" -O /usr/local/bin/yq
sudo chmod +x /usr/local/bin/yq

echo "yq 已更新到 $REQUIRED_YQ_VERSION."


# Backup current docker-compose.yml with current timestamp
BACKUP_TIME=$(date +%Y%m%d%H%M%S)
echo "正在备份当前的 docker-compose.yml 到 docker-compose-backup-$BACKUP_TIME.yml..."
cp docker-compose.yml "docker-compose-backup-$BACKUP_TIME.yml"

# Clone the repository and get the latest docker-compose.yml
echo "正在更新 docker-compose.yml..."
curl -o docker-compose-new.yml https://raw.githubusercontent.com/Nanjiren01/AIChatWeb/pro/docker-compose.yml

# Merge new and old docker-compose.yml, prioritizing old file values
yq eval-all 'select(fileIndex == 0) * select(fileIndex == 1)' docker-compose-new.yml docker-compose-backup-$BACKUP_TIME.yml > temp.yml

# Use sed to add empty lines before each service definition in the merged file
sed -i '/^[[:space:]]*$/d' temp.yml # Remove existing empty lines
sed -i '/^  [a-z].*:/i\\' temp.yml # Add an empty line before each service definition

# Move the merged content back to the original docker-compose.yml file
mv temp.yml docker-compose.yml


# Check if db service is used in the backup file
if awk '/depends_on:/ {found=1; next} found && /^\s*-\s*db/ {exit 1} /^\S/ {found=0}' "docker-compose-backup-$BACKUP_TIME.yml"; then
    echo "AIChat正在使用外部数据库。请确保在继续之前已备份您的数据库。"

    # Prompt user for confirmation
    read -p "您已备份外部数据库了吗？(y/N):" confirmation
    if [[ $confirmation =~ ^[Yy]$ ]] || [[ $confirmation =~ ^[Nn]$ ]] || [[ -z $confirmation ]]; then
        break
    else
        echo "无效输入，请输入 'y' 或 'n'。"
    fi

    echo "数据库已备份，继续执行后续操作..."

    # Comment out the '- db' line under 'depends_on' in 'admin' service
    sed -i '/admin:/,/environment:/ s/^\(.*- db\)/    #\1/' docker-compose.yml

    # Comment out the entire 'db' service configuration
    sed -i '/^  db:/,/^$/ s/^/#/' docker-compose.yml

else
    # Backup MySQL files
    backup_dir="./backups"
    backup_filename="mysql_data_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    mysql_data_dir="./mysql_data" 

    # Pack MySQL files
    mkdir -p "$backup_dir"
    tar -czvf "$backup_dir/$backup_filename" "$mysql_data_dir" || { 
        echo "内部数据库备份失败，如果你在使用外部数据库，请先删掉yml中的db部分依赖"; 
        restore_original_docker_compose
        exit 1; 
    }

    echo "MySQL 数据目录已压缩备份到 $backup_dir/$backup_filename"
fi

# Check current Web Secret in docker-compose.yml and prompt for updates
CURRENT_WEB_SECRET=$(grep 'WEB_SECRET:' docker-compose.yml | cut -d ':' -f2 | xargs)
echo "当前的 Web Secret 为: $CURRENT_WEB_SECRET"
while true; do
    read -p "您想更改 Web Secret 吗？(y/N):  " DECISION
    if [[ $DECISION =~ ^[Yy]$ ]] || [[ $DECISION =~ ^[Nn]$ ]] || [[ -z $DECISION ]]; then
        break
    else
        echo "无效输入，请输入 'y' 或 'n'。"
    fi
done

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

# modify old docker repo http to https
sed -i 's/harbor.nanjiren.online:8099/harbor.nanjiren.online/g' docker-compose.yml

while true; do
    echo "请到QQ群公告查看账户信息"
    echo "请输入 AIChat Pro 私有库账户用户名："
    read -p "用户名: " DOCKER_REGISTRY_USERNAME
    echo "请输入 AIChat Pro 私有库账户密码："
    read -s -p "密码: " DOCKER_REGISTRY_PASSWORD

    # 登录 AIChat Pro 私有仓库
    echo ""
    echo "正在登录 Docker 私有仓库..."

    echo $DOCKER_REGISTRY_PASSWORD | docker login -u $DOCKER_REGISTRY_USERNAME --password-stdin http://harbor.nanjiren.online
    if [ $? -eq 0 ]; then
        break
    else
        echo "AIChat Pro 登录失败，请到QQ群查看账户信息，重新输入账户和密码。"
    fi
done

if [ -f "docker-compose-new.yml" ]; then
    rm -rf docker-compose-new.yml
fi

# Start the updated docker-compose services
docker compose up -d

docker compose ps

