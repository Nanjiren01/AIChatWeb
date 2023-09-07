#!/bin/bash

echo "请选择语言 / Please select your language:"
echo "1. 中文 / Chinese"
echo "2. 英文 / English"
read -p "输入相应序号后回车 / Enter after typing the corresponding number: " LANGUAGE

case $LANGUAGE in
  1)
    echo "您选择了中文。"

    # AIChat Pro Setup
    # Copyright © 2023 AIChat. All Rights Reserved.
    # Latest: 2023/09/02
    echo "*******************************************************************************"
    echo "******                                                                   ******"
    echo "******                                                                   ******"
    echo "******                 AIChat专业版一键安装/更新程序                       ******"
    echo "******                                                                   ******"
    echo "******                                                                   ******"
    echo "******           Copyright © 2023 AIChat. All Rights Reserved.           ******"
    echo "******                                                                   ******"
    echo "******                     最后更新: 2023/09/02                           ******"
    echo "******                                                                   ******"
    echo "******                                                                   ******"
    echo "*******************************************************************************"
    
    # Check if running on a supported system
    case "$(uname -s)" in
      Linux)
        echo "在Linux上运行"
        ;;
      Darwin)
        echo "此脚本只能在Linux上运行，不能再MacOS上运行"
        exit 1
        ;;
      *)
        echo "不支持的操作系统，请选择Linux操作系统"
        exit 1
        ;;
    esac
    
    # Check if docker-compose.yml exists
    if [ -e docker-compose.yml ]; then
      echo "docker-compose.yml 已存在"
      echo "警告：确定后正在运行的AIChat系统将会立即停止"
      read -p "你是否想更新到最新的AIChat专业版系统？ (按Y确定/按N退出) " UPDATE_COMPOSE
      if [[ $UPDATE_COMPOSE == "Y" || $UPDATE_COMPOSE == "y" ]]; then
    
        # Stop AIChat System
        docker compose down
    
        if [ -e docker-compose.yml.bak.old ]; then
          echo "docker-compose.yml.bak.old 已存在"
          cp -f docker-compose.yml.bak.old docker-compose.yml
          cp -r mysql_data mysql_data_bak_old
          echo "原版本的配置文件docker-compose.yml及数据库mysql_data已备份，重命名为docker-compose.yml.bak.old和mysql_data_bak_old" 
        else
          # backup yml and mysql_data
          cp docker-compose.yml docker-compose.yml.bak.old
          cp -r mysql_data mysql_data_bak_old
          echo "原版本的配置文件docker-compose.yml及数据库mysql_data已备份，重命名为docker-compose.yml.bak.old和mysql_data_bak_old"   
        fi
    
        # Add new depend on
        sed -i '12i\      - util' docker-compose.yml
    
        # Add new env var
        sed -i '/admin:/,/ports:/ {
          /environment:/ {
            a\      OSS_ACCESS_KEY_SECRET: 
            a\      OSS_ACCESS_KEY_ID: 
            a\      OSS_BUCKET_NAME: 
            a\      OSS_ENDPOINT: 
            a\      STORE_TYPE: 
            a\      UTIL_ENDPOINT: 
            a\      LICENSE_SK: 
            a\      LICENSE_SUBJECT: 
          }
        }' docker-compose.yml
      
        # Add new util server
        cat <<EOT >> docker-compose.yml

  util:
    image: harbor.nanjiren.online:8099/aichat/aichat-util:latest
    container_name: aichat-util
    restart: always
    network_mode: host
    environment:
      PORT: 7788
      TZ: Asia/Shanghai
EOT
    
        # Setup AIChat Pro Authorized Repository Account
        echo "#############################################################################"
        echo "####################### 配置AIChat专业版授权私有库账户 ########################"
        echo "#############################################################################"
        while true; do
          echo "请输入AIChat专业版授权私有库的授权用户名："
          read -p "授权用户名： " DOCKER_REGISTRY_USERNAME
          echo "请输入AIChat专业版授权私有库的授权密码："
          read -s -p "授权密码： " DOCKER_REGISTRY_PASSWORD
      
          # Log in to the AIChat Pro private repository
          echo ""
          echo "正在登录到AIChat专业版的Docker私有仓库..."
          if docker login -u $DOCKER_REGISTRY_USERNAME -p $DOCKER_REGISTRY_PASSWORD http://harbor.nanjiren.online:8099; then
            break
          else
            echo "AIChat专业版私有库登录失败，请重新输入您的账户和密码。"
          fi
        done
      
        echo "*************************************"
        echo "** 成功设置AIChat专业版授权仓库账户。 **"
        echo "*************************************"
      
        echo ""
        echo ""
      
        # Setup AIChat Pro License
        echo "###################################################################"
        echo "###################### 配置AIChat专业版许可证 ######################"
        echo "###################################################################"
        while true; do
            read -p "请输入许可证的QQ邮箱：" LICENSE_SUBJECT
            if [[ -n $LICENSE_SUBJECT ]]; then
                if [[ $LICENSE_SUBJECT =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
                    echo "输入的许可证QQ邮箱有效"
                    break
                else
                    echo "无效的邮箱格式，请重试！"
                fi
            else
                echo "许可证邮箱不能为空，请重试！"
            fi
        done
      
        while true; do
            read -p "请输入许可证的SK码：" LICENSE_SK
            if [[ -n $LICENSE_SK ]]; then
                echo "输入的许可证SK码有效"
                break
            else
                echo "许可证SK码不能为空，请重试！"
            fi
        done
      
        sed -i "s/LICENSE_SUBJECT:.*/LICENSE_SUBJECT: $LICENSE_SUBJECT/g" docker-compose.yml
        sed -i "s/LICENSE_SK:.*/LICENSE_SK: $LICENSE_SK/g" docker-compose.yml
      
        echo "**********************"
        echo "** 许可证信息配置成功 **"
        echo "**********************"
      
        echo ""
        echo ""
      
        # Prompt for configuring OSS
        echo "###################################################################"
        echo "#################### 配置AIChat专业版对象存储 #######################"
        echo "###################################################################"
        echo "你想进行配置吗？（可选） (按Y开始/按N跳过)"
        read -p "Choice: " CONFIGURE_OSS
      
        if [[ $CONFIGURE_OSS == "Y" || $CONFIGURE_OSS == "y" ]]; then
          while true; do
            read -p "请输入对象存储的OSS_ENDPOINT： " OSS_ENDPOINT
            if [[ -n $OSS_ENDPOINT ]]; then
              echo "输入在OSS_ENDPOINT有效"
              break
            else
              echo "OSS_ENDPOINT不能为空，请重试！"
            fi
          done
      
          OSS_ENDPOINT2=$OSS_ENDPOINT  
      
          # Replace all '/' with '\/'
          OSS_ENDPOINT=${OSS_ENDPOINT//\//\\/}
      
          while true; do
            read -p "请输入对象存储的OSS_BUCKET_NAME： " OSS_BUCKET_NAME
            if [[ -n $OSS_BUCKET_NAME ]]; then
              echo "输入在OSS_BUCKET_NAME有效"
              break
            else
              echo "OSS_BUCKET_NAME不能为空，请重试！"
            fi
          done
      
          while true; do
            read -p "请输入对象存储的OSS_ACCESS_KEY_ID： " OSS_ACCESS_KEY_ID
            if [[ -n $OSS_ACCESS_KEY_ID ]]; then
              echo "输入在OSS_ACCESS_KEY_ID有效"
              break
            else
              echo "OSS_ACCESS_KEY_ID不能为空，请重试！"
            fi
          done
      
          while true; do
            read -p "请输入对象存储的OSS_ACCESS_KEY_SECRET： " OSS_ACCESS_KEY_SECRET
            if [[ -n $OSS_ACCESS_KEY_SECRET ]]; then
              echo "输入在OSS_ACCESS_KEY_SECRET有效"
              break
            else
              echo "OSS_ACCESS_KEY_SECRET不能为空，请重试！"
            fi
          done
      
          sed -i "s/STORE_TYPE:.*/STORE_TYPE: oss/" docker-compose.yml
          sed -i "s/OSS_ENDPOINT:.*/OSS_ENDPOINT: $OSS_ENDPOINT/g" docker-compose.yml
          sed -i "s/OSS_BUCKET_NAME:.*/OSS_BUCKET_NAME: $OSS_BUCKET_NAME/g" docker-compose.yml
          sed -i "s/OSS_ACCESS_KEY_ID:.*/OSS_ACCESS_KEY_ID: $OSS_ACCESS_KEY_ID/g" docker-compose.yml
          sed -i "s/OSS_ACCESS_KEY_SECRET:.*/OSS_ACCESS_KEY_SECRET: $OSS_ACCESS_KEY_SECRET/g" docker-compose.yml
      
          echo "************************"
          echo "** 对象存储信息配置成功 **"
          echo "************************"
        fi
      
        echo ""
        echo ""
      
        # Get Gateway IP address
        GATEWAY_IP=$(docker network inspect bridge --format='{{(index .IPAM.Config 0).Gateway}}')
      
        # Update UTIL_ENDPOINT in docker-compose.yml
        sed -i "s/UTIL_ENDPOINT:.*/UTIL_ENDPOINT: http:\/\/$GATEWAY_IP:7788/g" docker-compose.yml
      
        # Display the user input configuration
        echo "======================================================================"
        echo "============================== 配置总结 ==============================="
        echo "======================================================================"
        echo "AIChat专业版许可证信息："
        echo "许可证QQ邮箱： $LICENSE_SUBJECT"
        echo "许可证SK码： $LICENSE_SK"
        echo ""
        echo "AIChat专业版对象存储信息："
        if [[ $CONFIGURE_OSS == "Y" || $CONFIGURE_OSS == "y" ]]; then
          echo "OSS_Endpoint: $OSS_ENDPOINT2"
          echo "OSS_Bucket_Name: $OSS_BUCKET_NAME"
          echo "OSS_Access_Key_ID: $OSS_ACCESS_KEY_ID"
          echo "OSS_Access_Key_Secret: $OSS_ACCESS_KEY_SECRET"
        else
          echo "对象存储未进行配置"
        fi
        echo ""
        echo "UTIL_ENDPOINT: $GATEWAY_IP"
        echo "======================================================================"
      
        # Prompt for confirmation
        echo "请检查上述配置是否正确，如果确认无误，请按 Enter 继续，或按 Ctrl+C 取消。"
        read
      
        # Pull the latest images
        docker compose pull
      
        docker compose up -d
      
        docker ps
      else
        echo "取消更新"
        exit 0
      fi
    else
      echo "docker-compose.yml不存在，准备安装最新的AIChat专业版系统..."
    
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
        echo "jq没有安装，现在将进行安装..."
        yum install -y jq
      fi
    
      # Check if /etc/docker/daemon.json exists and modify it
      if [ -e /etc/docker/daemon.json ]; then
        echo "daemon.json已存在，将进行更新..."
        jq '.["insecure-registries"] += ["harbor.nanjiren.online:8099"]' /etc/docker/daemon.json > /tmp/daemon.json && mv /tmp/daemon.json /etc/docker/daemon.json
      else
        echo "daemon.json不存在，将进行创建..."
        echo '{"insecure-registries": ["harbor.nanjiren.online:8099"]}' > /etc/docker/daemon.json
      fi
    
      # Restart Docker daemon
      echo "重启Docker daemon..."
      systemctl restart docker
    
      echo ""
      echo ""
    
      # Clone the repository and install dependencies
      echo "curl -o docker-compose.yml..."
      curl -o docker-compose.yml https://raw.githubusercontent.com/Nanjiren01/AIChatWeb/pro/docker-compose.yml
    
      # Setup AIChat Pro Authorized Repository Account
      echo "#############################################################################"
      echo "####################### 配置AIChat专业版授权私有库账户 ########################"
      echo "#############################################################################"
      while true; do
        echo "请输入AIChat专业版授权私有库的授权用户名："
        read -p "授权用户名： " DOCKER_REGISTRY_USERNAME
        echo "请输入AIChat专业版授权私有库的授权密码："
        read -s -p "授权密码： " DOCKER_REGISTRY_PASSWORD
    
        # Log in to the AIChat Pro private repository
        echo ""
        echo "正在登录到AIChat专业版的Docker私有仓库..."
        if docker login -u $DOCKER_REGISTRY_USERNAME -p $DOCKER_REGISTRY_PASSWORD http://harbor.nanjiren.online:8099; then
          break
        else
          echo "AIChat专业版私有库登录失败，请重新输入您的账户和密码。"
        fi
      done
    
      echo "*************************************"
      echo "** 成功设置AIChat专业版授权仓库账户。 **"
      echo "*************************************"
    
      echo ""
      echo ""
    
      # Setup AIChat Pro License
      echo "###################################################################"
      echo "###################### 配置AIChat专业版许可证 ######################"
      echo "###################################################################"
      while true; do
          read -p "请输入许可证的QQ邮箱：" LICENSE_SUBJECT
          if [[ -n $LICENSE_SUBJECT ]]; then
              if [[ $LICENSE_SUBJECT =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
                  echo "输入的许可证QQ邮箱有效"
                  break
              else
                  echo "无效的邮箱格式，请重试！"
              fi
          else
              echo "许可证邮箱不能为空，请重试！"
          fi
      done
    
      while true; do
          read -p "请输入许可证的SK码：" LICENSE_SK
          if [[ -n $LICENSE_SK ]]; then
              echo "输入的许可证SK码有效"
              break
          else
              echo "许可证SK码不能为空，请重试！"
          fi
      done
    
      sed -i "s/LICENSE_SUBJECT:.*/LICENSE_SUBJECT: $LICENSE_SUBJECT/g" docker-compose.yml
      sed -i "s/LICENSE_SK:.*/LICENSE_SK: $LICENSE_SK/g" docker-compose.yml
    
      echo "**********************"
      echo "** 许可证信息配置成功 **"
      echo "**********************"
    
      echo ""
      echo ""
    
      # Setup AIChat super admin account
      echo "###################################################################"
      echo "######################## 配置超级管理员 ############################"
      echo "###################################################################"
      while true; do
          echo "仅支持字母和数字，长度应在6到20之间，并且不能以数字开头。"
          read -p "请输出超级用户的账户名称： " SUPER_USERNAME
          regex='^[A-Za-z][A-Za-z0-9]{5,19}'
          if [[ $SUPER_USERNAME =~ $regex ]]; then
              echo "超级管理员账户名称有效"
              break
          else
              echo "超级管理员账户名称无效，请重试！"
          fi
      done
    
      while true; do
          echo "仅支持字母和数字，长度应在6到20之间。您可以在应用程序运行后在管理后台上进行更改。"
          read -p "请输出超级用户的账户密码：" SUPER_PASSWORD
          regex='^[A-Za-z0-9]{6,20}'
          if [[ $SUPER_PASSWORD =~ $regex ]]; then
              echo "超级管理员账户密码有效"
              break
          else
              echo "超级管理员账户密码无效，请重试！"
          fi
      done
    
      sed -i "s/SUPERADMIN_USERNAME:.*/SUPERADMIN_USERNAME: $SUPER_USERNAME/g" docker-compose.yml
      sed -i "s/SUPERADMIN_PASSWORD:.*/SUPERADMIN_PASSWORD: $SUPER_PASSWORD/g" docker-compose.yml
    
      echo "***************************"
      echo "** 超级管理员信息配置成功. **"
      echo "***************************"
    
      echo ""
      echo ""
    
      # Prompt for configuring OSS
      echo "###################################################################"
      echo "#################### 配置AIChat专业版对象存储 #######################"
      echo "###################################################################"
      echo "你想进行配置吗？（可选） (按Y开始/按N跳过)"
      read -p "Choice: " CONFIGURE_OSS
      
      if [[ $CONFIGURE_OSS == "Y" || $CONFIGURE_OSS == "y" ]]; then
        while true; do
          read -p "请输入对象存储的OSS_ENDPOINT： " OSS_ENDPOINT
          if [[ -n $OSS_ENDPOINT ]]; then
            echo "输入在OSS_ENDPOINT有效"
            break
          else
            echo "OSS_ENDPOINT不能为空，请重试！"
          fi
        done
      
        OSS_ENDPOINT2=$OSS_ENDPOINT  
      
        # Replace all '/' with '\/'
        OSS_ENDPOINT=${OSS_ENDPOINT//\//\\/}
      
        while true; do
          read -p "请输入对象存储的OSS_BUCKET_NAME： " OSS_BUCKET_NAME
          if [[ -n $OSS_BUCKET_NAME ]]; then
            echo "输入在OSS_BUCKET_NAME有效"
            break
          else
            echo "OSS_BUCKET_NAME不能为空，请重试！"
          fi
        done
      
        while true; do
          read -p "请输入对象存储的OSS_ACCESS_KEY_ID： " OSS_ACCESS_KEY_ID
          if [[ -n $OSS_ACCESS_KEY_ID ]]; then
            echo "输入在OSS_ACCESS_KEY_ID有效"
            break
          else
            echo "OSS_ACCESS_KEY_ID不能为空，请重试！"
          fi
        done
      
        while true; do
          read -p "请输入对象存储的OSS_ACCESS_KEY_SECRET： " OSS_ACCESS_KEY_SECRET
          if [[ -n $OSS_ACCESS_KEY_SECRET ]]; then
            echo "输入在OSS_ACCESS_KEY_SECRET有效"
            break
          else
            echo "OSS_ACCESS_KEY_SECRET不能为空，请重试！"
          fi
        done
      
        sed -i "s/STORE_TYPE:.*/STORE_TYPE: oss/" docker-compose.yml
        sed -i "s/OSS_ENDPOINT:.*/OSS_ENDPOINT: $OSS_ENDPOINT/g" docker-compose.yml
        sed -i "s/OSS_BUCKET_NAME:.*/OSS_BUCKET_NAME: $OSS_BUCKET_NAME/g" docker-compose.yml
        sed -i "s/OSS_ACCESS_KEY_ID:.*/OSS_ACCESS_KEY_ID: $OSS_ACCESS_KEY_ID/g" docker-compose.yml
        sed -i "s/OSS_ACCESS_KEY_SECRET:.*/OSS_ACCESS_KEY_SECRET: $OSS_ACCESS_KEY_SECRET/g" docker-compose.yml
      
        echo "************************"
        echo "** 对象存储信息配置成功 **"
        echo "************************"
      fi
    
      echo ""
      echo ""
    
      # Get Gateway IP address
      GATEWAY_IP=$(docker network inspect bridge --format='{{(index .IPAM.Config 0).Gateway}}')
    
      # Update UTIL_ENDPOINT in docker-compose.yml
      sed -i "s/UTIL_ENDPOINT:.*/UTIL_ENDPOINT: http:\/\/$GATEWAY_IP:7788/g" docker-compose.yml
    
      # Display the user input configuration
      echo "======================================================================"
      echo "============================== 配置总结 ==============================="
      echo "======================================================================"
      echo "AIChat专业版许可证信息："
      echo "许可证QQ邮箱： $LICENSE_SUBJECT"
      echo "许可证SK码： $LICENSE_SK"
      echo ""
      echo "超级管理员信息："
      echo "账户名称： $SUPER_USERNAME"
      echo "密码： $SUPER_PASSWORD"
      echo ""
      echo "AIChat专业版对象存储信息："
      if [[ $CONFIGURE_OSS == "Y" || $CONFIGURE_OSS == "y" ]]; then
        echo "OSS_Endpoint: $OSS_ENDPOINT2"
        echo "OSS_Bucket_Name: $OSS_BUCKET_NAME"
        echo "OSS_Access_Key_ID: $OSS_ACCESS_KEY_ID"
        echo "OSS_Access_Key_Secret: $OSS_ACCESS_KEY_SECRET"
      else
        echo "对象存储未进行配置"
      fi
      echo ""
      echo "UTIL_ENDPOINT: $GATEWAY_IP"
      echo "======================================================================"
      
      # Prompt for confirmation
      echo "请检查上述配置是否正确，如果确认无误，请按 Enter 继续，或按 Ctrl+C 取消。"
      read
      
      # Pull the latest images
      docker compose pull
      
      docker compose up -d
      
      docker ps
    fi
    ;;
  2)
    echo "You have selected English."

    # AIChat Pro Setup
    # Copyright © 2023 AIChat. All Rights Reserved.
    # Latest: 2023/09/02
    echo "*******************************************************************************"
    echo "******                                                                   ******"
    echo "******                                                                   ******"
    echo "******        The setup program for AIChat Professional Edition          ******"
    echo "******                                                                   ******"
    echo "******                                                                   ******"
    echo "******           Copyright © 2023 AIChat. All Rights Reserved.           ******"
    echo "******                                                                   ******"
    echo "******                     Latest: 2023/09/02                            ******"
    echo "******                                                                   ******"
    echo "******                                                                   ******"
    echo "*******************************************************************************"
    
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
    
    # Check if docker-compose.yml exists
    if [ -e docker-compose.yml ]; then
      echo "docker-compose.yml exists."
      echo "Warning: The AIChat system that is currently running will stop immediately after confirmation."
      read -p "Do you want to update AIChat latest system? (Y/N) " UPDATE_COMPOSE
      if [[ $UPDATE_COMPOSE == "Y" || $UPDATE_COMPOSE == "y" ]]; then
    
        # Stop AIChat System
        docker compose down
    
        if [ -e docker-compose.yml.bak.old ]; then
          echo "docker-compose.yml.bak.old exists, restoring it..."
          cp -f docker-compose.yml.bak.old docker-compose.yml
          cp -r mysql_data mysql_data_bak_old
          echo "The original version of the configuration file docker-compose.yml and the database mysql_data have been backed up and renamed as docker-compose.yml.bak.old and mysql_data_bak_old." 
        else
          # backup yml and mysql_data
          cp docker-compose.yml docker-compose.yml.bak.old
          cp -r mysql_data mysql_data_bak_old  
          echo "The original version of the configuration file docker-compose.yml and the database mysql_data have been backed up and renamed as docker-compose.yml.bak.old and mysql_data_bak_old."
        fi
    
        # Add new depend on
        sed -i '12i\      - util' docker-compose.yml
    
        # Add new env var
        sed -i '/admin:/,/ports:/ {
          /environment:/ {
            a\      OSS_ACCESS_KEY_SECRET: 
            a\      OSS_ACCESS_KEY_ID: 
            a\      OSS_BUCKET_NAME: 
            a\      OSS_ENDPOINT: 
            a\      STORE_TYPE: 
            a\      UTIL_ENDPOINT: 
            a\      LICENSE_SK: 
            a\      LICENSE_SUBJECT: 
          }
        }' docker-compose.yml
      
        # Add new util server
        cat <<EOT >> docker-compose.yml

  util:
    image: harbor.nanjiren.online:8099/aichat/aichat-util:latest
    container_name: aichat-util
    restart: always
    network_mode: host
    environment:
      PORT: 7788
      TZ: Asia/Shanghai
EOT
    
        # Setup AIChat Pro Authorized Repository Account
        echo "#############################################################################"
        echo "############# Setup AIChat Pro Authorized Repository Account ################"
        echo "#############################################################################"
        while true; do
          echo "Please input AIChat Pro authorized account username:"
          read -p "Username: " DOCKER_REGISTRY_USERNAME
          echo "Please input AIChat Pro authorized account password:"
          read -s -p "Password: " DOCKER_REGISTRY_PASSWORD
      
          # Log in to the AIChat Pro private repository
          echo ""
          echo "Logging in to AIChat Pro Docker Private Repository..."
          if docker login -u $DOCKER_REGISTRY_USERNAME -p $DOCKER_REGISTRY_PASSWORD http://harbor.nanjiren.online:8099; then
            break
          else
            echo "AIChat Pro authorization failed, please re-enter your account and password."
          fi
        done
      
        echo "******************************************************************"
        echo "** Setup AIChat Pro Authorized Repository Account successfully. **"
        echo "******************************************************************"
      
        echo ""
        echo ""
      
        # Setup AIChat Pro License
        echo "###################################################################"
        echo "#################### Setup AIChat Pro License #####################"
        echo "###################################################################"
        while true; do
            read -p "Please input the license email: " LICENSE_SUBJECT
            if [[ -n $LICENSE_SUBJECT ]]; then
                if [[ $LICENSE_SUBJECT =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
                    echo "License email is valid."
                    break
                else
                    echo "Invalid email format. Please try again."
                fi
            else
                echo "License email cannot be empty. Please try again."
            fi
        done
      
        while true; do
            read -p "Please input the license SK: " LICENSE_SK
            if [[ -n $LICENSE_SK ]]; then
                echo "License SK is valid."
                break
            else
                echo "License SK cannot be empty. Please try again."
            fi
        done
      
        sed -i "s/LICENSE_SUBJECT:.*/LICENSE_SUBJECT: $LICENSE_SUBJECT/g" docker-compose.yml
        sed -i "s/LICENSE_SK:.*/LICENSE_SK: $LICENSE_SK/g" docker-compose.yml
      
        echo "*****************************************************"
        echo "** License details have been updated successfully. **"
        echo "*****************************************************"
      
        echo ""
        echo ""
      
        # Prompt for configuring OSS
        echo "###################################################################"
        echo "####################### Setup AIChat OSS ##########################"
        echo "###################################################################"
        echo "Do you want to configure OSS? (Y/N)"
        read -p "Choice: " CONFIGURE_OSS
      
        if [[ $CONFIGURE_OSS == "Y" || $CONFIGURE_OSS == "y" ]]; then
          while true; do
            read -p "Please input the OSS endpoint: " OSS_ENDPOINT
            if [[ -n $OSS_ENDPOINT ]]; then
              echo "OSS Endpoint is valid."
              break
            else
              echo "OSS Endpoint cannot be empty. Please try again."
            fi
          done
      
          OSS_ENDPOINT2=$OSS_ENDPOINT  
      
          # Replace all '/' with '\/'
          OSS_ENDPOINT=${OSS_ENDPOINT//\//\\/}
      
          while true; do
            read -p "Please input the OSS bucket name: " OSS_BUCKET_NAME
            if [[ -n $OSS_BUCKET_NAME ]]; then
              echo "OSS Bucket Name is valid."
              break
            else
              echo "OSS Bucket Name cannot be empty. Please try again."
            fi
          done
      
          while true; do
            read -p "Please input the OSS access key ID: " OSS_ACCESS_KEY_ID
            if [[ -n $OSS_ACCESS_KEY_ID ]]; then
              echo "OSS Access Key ID is valid."
              break
            else
              echo "OSS Access Key ID cannot be empty. Please try again."
            fi
          done
      
          while true; do
            read -p "Please input the OSS access key secret: " OSS_ACCESS_KEY_SECRET
            if [[ -n $OSS_ACCESS_KEY_SECRET ]]; then
              echo "OSS Access Key Secret is valid."
              break
            else
              echo "OSS Access Key Secret cannot be empty. Please try again."
            fi
          done
      
          sed -i "s/STORE_TYPE:.*/STORE_TYPE: oss/" docker-compose.yml
          sed -i "s/OSS_ENDPOINT:.*/OSS_ENDPOINT: $OSS_ENDPOINT/g" docker-compose.yml
          sed -i "s/OSS_BUCKET_NAME:.*/OSS_BUCKET_NAME: $OSS_BUCKET_NAME/g" docker-compose.yml
          sed -i "s/OSS_ACCESS_KEY_ID:.*/OSS_ACCESS_KEY_ID: $OSS_ACCESS_KEY_ID/g" docker-compose.yml
          sed -i "s/OSS_ACCESS_KEY_SECRET:.*/OSS_ACCESS_KEY_SECRET: $OSS_ACCESS_KEY_SECRET/g" docker-compose.yml
      
          echo "******************************************************"
          echo "** OSS configuration has been updated successfully. **"
          echo "******************************************************"
        fi
      
        echo ""
        echo ""
      
        # Get Gateway IP address
        GATEWAY_IP=$(docker network inspect bridge --format='{{(index .IPAM.Config 0).Gateway}}')
      
        # Update UTIL_ENDPOINT in docker-compose.yml
        sed -i "s/UTIL_ENDPOINT:.*/UTIL_ENDPOINT: http:\/\/$GATEWAY_IP:7788/g" docker-compose.yml
      
        # Display the user input configuration
        echo "======================================================================"
        echo "======================= Configuration Summary ========================"
        echo "======================================================================"
        echo "AIChat Pro License:"
        echo "License Email: $LICENSE_SUBJECT"
        echo "License SK: $LICENSE_SK"
        echo ""
        echo "AIChat OSS Configuration:"
        if [[ $CONFIGURE_OSS == "Y" || $CONFIGURE_OSS == "y" ]]; then
          echo "OSS Endpoint: $OSS_ENDPOINT2"
          echo "OSS Bucket Name: $OSS_BUCKET_NAME"
          echo "OSS Access Key ID: $OSS_ACCESS_KEY_ID"
          echo "OSS Access Key Secret: $OSS_ACCESS_KEY_SECRET"
        else
          echo "OSS is not configured."
        fi
        echo ""
        echo "UTIL_ENDPOINT: $GATEWAY_IP"
        echo "======================================================================"
      
        # Prompt for confirmation
        echo "Please review the above configuration. If everything looks correct, press Enter to continue or Ctrl+C to cancel."
        read
      
        # Pull the latest images
        docker compose pull
      
        docker compose up -d
      
        docker ps
      else
        echo "Skipping update."
        exit 0
      fi
    else
      echo "docker-compose.yml does not exist, proceeding with the script to install AIChat Pro..."
    
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
    
      echo ""
      echo ""
    
      # Clone the repository and install dependencies
      echo "curl -o docker-compose.yml..."
      curl -o docker-compose.yml https://raw.githubusercontent.com/Nanjiren01/AIChatWeb/pro/docker-compose.yml
    
      # Setup AIChat Pro Authorized Repository Account
      echo "#############################################################################"
      echo "############# Setup AIChat Pro Authorized Repository Account ################"
      echo "#############################################################################"
      while true; do
        echo "Please input AIChat Pro authorized account username:"
        read -p "Username: " DOCKER_REGISTRY_USERNAME
        echo "Please input AIChat Pro authorized account password:"
        read -s -p "Password: " DOCKER_REGISTRY_PASSWORD
    
        # Log in to the AIChat Pro private repository
        echo ""
        echo "Logging in to AIChat Pro Docker Private Repository..."
        if docker login -u $DOCKER_REGISTRY_USERNAME -p $DOCKER_REGISTRY_PASSWORD http://harbor.nanjiren.online:8099; then
          break
        else
          echo "AIChat Pro authorization failed, please re-enter your account and password."
        fi
      done
    
      echo "******************************************************************"
      echo "** Setup AIChat Pro Authorized Repository Account successfully. **"
      echo "******************************************************************"
    
      echo ""
      echo ""
    
      # Setup AIChat Pro License
      echo "###################################################################"
      echo "#################### Setup AIChat Pro License #####################"
      echo "###################################################################"
      while true; do
          read -p "Please input the license email: " LICENSE_SUBJECT
          if [[ -n $LICENSE_SUBJECT ]]; then
              if [[ $LICENSE_SUBJECT =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
                  echo "License email is valid."
                  break
              else
                  echo "Invalid email format. Please try again."
              fi
          else
              echo "License email cannot be empty. Please try again."
          fi
      done
    
      while true; do
          read -p "Please input the license SK: " LICENSE_SK
          if [[ -n $LICENSE_SK ]]; then
              echo "License SK is valid."
              break
          else
              echo "License SK cannot be empty. Please try again."
          fi
      done
    
      sed -i "s/LICENSE_SUBJECT:.*/LICENSE_SUBJECT: $LICENSE_SUBJECT/g" docker-compose.yml
      sed -i "s/LICENSE_SK:.*/LICENSE_SK: $LICENSE_SK/g" docker-compose.yml
    
      echo "*****************************************************"
      echo "** License details have been updated successfully. **"
      echo "*****************************************************"
    
      echo ""
      echo ""
    
      # Setup AIChat super admin account
      echo "###################################################################"
      echo "#################### Setup Super Admin Account ####################"
      echo "###################################################################"
      while true; do
          echo "Only letters and numbers are supported, the length should between 6 and 20, and they cannot start with a number."
          read -p "Please input the super admin username: " SUPER_USERNAME
          regex='^[A-Za-z][A-Za-z0-9]{5,19}'
          if [[ $SUPER_USERNAME =~ $regex ]]; then
              echo "Super Admin Username is valid."
              break
          else
              echo "Super Admin Username is invalid. Please try again."
          fi
      done
    
      while true; do
          echo "Only letters and numbers are supported, and the length should between 6 and 20. You can change it on the web page after the Application running."
          read -p "Please input the super admin password: " SUPER_PASSWORD
          regex='^[A-Za-z0-9]{6,20}'
          if [[ $SUPER_PASSWORD =~ $regex ]]; then
              echo "Super Admin Password is valid."
              break
          else
              echo "Super Admin Password is invalid. Please try again."
          fi
      done
    
      sed -i "s/SUPERADMIN_USERNAME:.*/SUPERADMIN_USERNAME: $SUPER_USERNAME/g" docker-compose.yml
      sed -i "s/SUPERADMIN_PASSWORD:.*/SUPERADMIN_PASSWORD: $SUPER_PASSWORD/g" docker-compose.yml
    
      echo "**********************************************************************"
      echo "** Super admin account and password have been updated successfully. **"
      echo "**********************************************************************"
    
      echo ""
      echo ""
    
      # Prompt for configuring OSS
      echo "###################################################################"
      echo "####################### Setup AIChat OSS ##########################"
      echo "###################################################################"
      echo "Do you want to configure OSS? (Y/N)"
      read -p "Choice: " CONFIGURE_OSS
    
      if [[ $CONFIGURE_OSS == "Y" || $CONFIGURE_OSS == "y" ]]; then
        while true; do
          read -p "Please input the OSS endpoint: " OSS_ENDPOINT
          if [[ -n $OSS_ENDPOINT ]]; then
            echo "OSS Endpoint is valid."
            break
          else
            echo "OSS Endpoint cannot be empty. Please try again."
          fi
        done
    
        OSS_ENDPOINT2=$OSS_ENDPOINT  
    
        # Replace all '/' with '\/'
        OSS_ENDPOINT=${OSS_ENDPOINT//\//\\/}
    
        while true; do
          read -p "Please input the OSS bucket name: " OSS_BUCKET_NAME
          if [[ -n $OSS_BUCKET_NAME ]]; then
            echo "OSS Bucket Name is valid."
            break
          else
            echo "OSS Bucket Name cannot be empty. Please try again."
          fi
        done
    
        while true; do
          read -p "Please input the OSS access key ID: " OSS_ACCESS_KEY_ID
          if [[ -n $OSS_ACCESS_KEY_ID ]]; then
            echo "OSS Access Key ID is valid."
            break
          else
            echo "OSS Access Key ID cannot be empty. Please try again."
          fi
        done
    
        while true; do
          read -p "Please input the OSS access key secret: " OSS_ACCESS_KEY_SECRET
          if [[ -n $OSS_ACCESS_KEY_SECRET ]]; then
            echo "OSS Access Key Secret is valid."
            break
          else
            echo "OSS Access Key Secret cannot be empty. Please try again."
          fi
        done
    
        sed -i "s/STORE_TYPE:.*/STORE_TYPE: oss/" docker-compose.yml
        sed -i "s/OSS_ENDPOINT:.*/OSS_ENDPOINT: $OSS_ENDPOINT/g" docker-compose.yml
        sed -i "s/OSS_BUCKET_NAME:.*/OSS_BUCKET_NAME: $OSS_BUCKET_NAME/g" docker-compose.yml
        sed -i "s/OSS_ACCESS_KEY_ID:.*/OSS_ACCESS_KEY_ID: $OSS_ACCESS_KEY_ID/g" docker-compose.yml
        sed -i "s/OSS_ACCESS_KEY_SECRET:.*/OSS_ACCESS_KEY_SECRET: $OSS_ACCESS_KEY_SECRET/g" docker-compose.yml
    
        echo "******************************************************"
        echo "** OSS configuration has been updated successfully. **"
        echo "******************************************************"
      fi
    
      echo ""
      echo ""
    
      # Get Gateway IP address
      GATEWAY_IP=$(docker network inspect bridge --format='{{(index .IPAM.Config 0).Gateway}}')
    
      # Update UTIL_ENDPOINT in docker-compose.yml
      sed -i "s/UTIL_ENDPOINT:.*/UTIL_ENDPOINT: http:\/\/$GATEWAY_IP:7788/g" docker-compose.yml
    
      # Display the user input configuration
      echo "======================================================================"
      echo "======================= Configuration Summary ========================"
      echo "======================================================================"
      echo "AIChat Pro License:"
      echo "License Email: $LICENSE_SUBJECT"
      echo "License SK: $LICENSE_SK"
      echo ""
      echo "Super Admin Account:"
      echo "Username: $SUPER_USERNAME"
      echo "Password: $SUPER_PASSWORD"
      echo ""
      echo "AIChat OSS Configuration:"
      if [[ $CONFIGURE_OSS == "Y" || $CONFIGURE_OSS == "y" ]]; then
        echo "OSS Endpoint: $OSS_ENDPOINT2"
        echo "OSS Bucket Name: $OSS_BUCKET_NAME"
        echo "OSS Access Key ID: $OSS_ACCESS_KEY_ID"
        echo "OSS Access Key Secret: $OSS_ACCESS_KEY_SECRET"
      else
        echo "OSS is not configured."
      fi
      echo ""
      echo "UTIL_ENDPOINT: $GATEWAY_IP"
      echo "======================================================================"
    
      # Prompt for confirmation
      echo "Please review the above configuration. If everything looks correct, press Enter to continue or Ctrl+C to cancel."
      read
    
      # Pull the latest images
      docker compose pull
    
      docker compose up -d
    
      docker ps
    fi
    ;;
  *)
    echo "无效选择，默认选择英文 / Invalid choice. Defaulting to English."

    # AIChat Pro Setup
    # Copyright © 2023 AIChat. All Rights Reserved.
    # Latest: 2023/09/02
    echo "*******************************************************************************"
    echo "******                                                                   ******"
    echo "******                                                                   ******"
    echo "******        The setup program for AIChat Professional Edition          ******"
    echo "******                                                                   ******"
    echo "******                                                                   ******"
    echo "******           Copyright © 2023 AIChat. All Rights Reserved.           ******"
    echo "******                                                                   ******"
    echo "******                     Latest: 2023/09/02                            ******"
    echo "******                                                                   ******"
    echo "******                                                                   ******"
    echo "*******************************************************************************"
    
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
    
    # Check if docker-compose.yml exists
    if [ -e docker-compose.yml ]; then
      echo "docker-compose.yml exists."
      echo "Warning: The AIChat system that is currently running will stop immediately after confirmation."
      read -p "Do you want to update AIChat latest system? (Y/N) " UPDATE_COMPOSE
      if [[ $UPDATE_COMPOSE == "Y" || $UPDATE_COMPOSE == "y" ]]; then
    
        # Stop AIChat System
        docker compose down
    
        if [ -e docker-compose.yml.bak.old ]; then
          echo "docker-compose.yml.bak.old exists, restoring it..."
          cp -f docker-compose.yml.bak.old docker-compose.yml
          cp -r mysql_data mysql_data_bak_old 
          echo "The original version of the configuration file docker-compose.yml and the database mysql_data have been backed up and renamed as docker-compose.yml.bak.old and mysql_data_bak_old."
        else
          # backup yml and mysql_data
          cp docker-compose.yml docker-compose.yml.bak.old
          cp -r mysql_data mysql_data_bak_old
          echo "The original version of the configuration file docker-compose.yml and the database mysql_data have been backed up and renamed as docker-compose.yml.bak.old and mysql_data_bak_old."  
        fi
    
        # Add new depend on
        sed -i '12i\      - util' docker-compose.yml
    
        # Add new env var
        sed -i '/admin:/,/ports:/ {
          /environment:/ {
            a\      OSS_ACCESS_KEY_SECRET: 
            a\      OSS_ACCESS_KEY_ID: 
            a\      OSS_BUCKET_NAME: 
            a\      OSS_ENDPOINT: 
            a\      STORE_TYPE: 
            a\      UTIL_ENDPOINT: 
            a\      LICENSE_SK: 
            a\      LICENSE_SUBJECT: 
          }
        }' docker-compose.yml
      
        # Add new util server
        cat <<EOT >> docker-compose.yml

  util:
    image: harbor.nanjiren.online:8099/aichat/aichat-util:latest
    container_name: aichat-util
    restart: always
    network_mode: host
    environment:
      PORT: 7788
      TZ: Asia/Shanghai
EOT
    
        # Setup AIChat Pro Authorized Repository Account
        echo "#############################################################################"
        echo "############# Setup AIChat Pro Authorized Repository Account ################"
        echo "#############################################################################"
        while true; do
          echo "Please input AIChat Pro authorized account username:"
          read -p "Username: " DOCKER_REGISTRY_USERNAME
          echo "Please input AIChat Pro authorized account password:"
          read -s -p "Password: " DOCKER_REGISTRY_PASSWORD
      
          # Log in to the AIChat Pro private repository
          echo ""
          echo "Logging in to AIChat Pro Docker Private Repository..."
          if docker login -u $DOCKER_REGISTRY_USERNAME -p $DOCKER_REGISTRY_PASSWORD http://harbor.nanjiren.online:8099; then
            break
          else
            echo "AIChat Pro authorization failed, please re-enter your account and password."
          fi
        done
      
        echo "******************************************************************"
        echo "** Setup AIChat Pro Authorized Repository Account successfully. **"
        echo "******************************************************************"
      
        echo ""
        echo ""
      
        # Setup AIChat Pro License
        echo "###################################################################"
        echo "#################### Setup AIChat Pro License #####################"
        echo "###################################################################"
        while true; do
            read -p "Please input the license email: " LICENSE_SUBJECT
            if [[ -n $LICENSE_SUBJECT ]]; then
                if [[ $LICENSE_SUBJECT =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
                    echo "License email is valid."
                    break
                else
                    echo "Invalid email format. Please try again."
                fi
            else
                echo "License email cannot be empty. Please try again."
            fi
        done
      
        while true; do
            read -p "Please input the license SK: " LICENSE_SK
            if [[ -n $LICENSE_SK ]]; then
                echo "License SK is valid."
                break
            else
                echo "License SK cannot be empty. Please try again."
            fi
        done
      
        sed -i "s/LICENSE_SUBJECT:.*/LICENSE_SUBJECT: $LICENSE_SUBJECT/g" docker-compose.yml
        sed -i "s/LICENSE_SK:.*/LICENSE_SK: $LICENSE_SK/g" docker-compose.yml
      
        echo "*****************************************************"
        echo "** License details have been updated successfully. **"
        echo "*****************************************************"
      
        echo ""
        echo ""
      
        # Prompt for configuring OSS
        echo "###################################################################"
        echo "####################### Setup AIChat OSS ##########################"
        echo "###################################################################"
        echo "Do you want to configure OSS? (Y/N)"
        read -p "Choice: " CONFIGURE_OSS
      
        if [[ $CONFIGURE_OSS == "Y" || $CONFIGURE_OSS == "y" ]]; then
          while true; do
            read -p "Please input the OSS endpoint: " OSS_ENDPOINT
            if [[ -n $OSS_ENDPOINT ]]; then
              echo "OSS Endpoint is valid."
              break
            else
              echo "OSS Endpoint cannot be empty. Please try again."
            fi
          done
      
          OSS_ENDPOINT2=$OSS_ENDPOINT  
      
          # Replace all '/' with '\/'
          OSS_ENDPOINT=${OSS_ENDPOINT//\//\\/}
      
          while true; do
            read -p "Please input the OSS bucket name: " OSS_BUCKET_NAME
            if [[ -n $OSS_BUCKET_NAME ]]; then
              echo "OSS Bucket Name is valid."
              break
            else
              echo "OSS Bucket Name cannot be empty. Please try again."
            fi
          done
      
          while true; do
            read -p "Please input the OSS access key ID: " OSS_ACCESS_KEY_ID
            if [[ -n $OSS_ACCESS_KEY_ID ]]; then
              echo "OSS Access Key ID is valid."
              break
            else
              echo "OSS Access Key ID cannot be empty. Please try again."
            fi
          done
      
          while true; do
            read -p "Please input the OSS access key secret: " OSS_ACCESS_KEY_SECRET
            if [[ -n $OSS_ACCESS_KEY_SECRET ]]; then
              echo "OSS Access Key Secret is valid."
              break
            else
              echo "OSS Access Key Secret cannot be empty. Please try again."
            fi
          done
      
          sed -i "s/STORE_TYPE:.*/STORE_TYPE: oss/" docker-compose.yml
          sed -i "s/OSS_ENDPOINT:.*/OSS_ENDPOINT: $OSS_ENDPOINT/g" docker-compose.yml
          sed -i "s/OSS_BUCKET_NAME:.*/OSS_BUCKET_NAME: $OSS_BUCKET_NAME/g" docker-compose.yml
          sed -i "s/OSS_ACCESS_KEY_ID:.*/OSS_ACCESS_KEY_ID: $OSS_ACCESS_KEY_ID/g" docker-compose.yml
          sed -i "s/OSS_ACCESS_KEY_SECRET:.*/OSS_ACCESS_KEY_SECRET: $OSS_ACCESS_KEY_SECRET/g" docker-compose.yml
      
          echo "******************************************************"
          echo "** OSS configuration has been updated successfully. **"
          echo "******************************************************"
        fi
      
        echo ""
        echo ""
      
        # Get Gateway IP address
        GATEWAY_IP=$(docker network inspect bridge --format='{{(index .IPAM.Config 0).Gateway}}')
      
        # Update UTIL_ENDPOINT in docker-compose.yml
        sed -i "s/UTIL_ENDPOINT:.*/UTIL_ENDPOINT: http:\/\/$GATEWAY_IP:7788/g" docker-compose.yml
      
        # Display the user input configuration
        echo "======================================================================"
        echo "======================= Configuration Summary ========================"
        echo "======================================================================"
        echo "AIChat Pro License:"
        echo "License Email: $LICENSE_SUBJECT"
        echo "License SK: $LICENSE_SK"
        echo ""
        echo "AIChat OSS Configuration:"
        if [[ $CONFIGURE_OSS == "Y" || $CONFIGURE_OSS == "y" ]]; then
          echo "OSS Endpoint: $OSS_ENDPOINT2"
          echo "OSS Bucket Name: $OSS_BUCKET_NAME"
          echo "OSS Access Key ID: $OSS_ACCESS_KEY_ID"
          echo "OSS Access Key Secret: $OSS_ACCESS_KEY_SECRET"
        else
          echo "OSS is not configured."
        fi
        echo ""
        echo "UTIL_ENDPOINT: $GATEWAY_IP"
        echo "======================================================================"
      
        # Prompt for confirmation
        echo "Please review the above configuration. If everything looks correct, press Enter to continue or Ctrl+C to cancel."
        read
      
        # Pull the latest images
        docker compose pull
      
        docker compose up -d
      
        docker ps
      else
        echo "Skipping update."
        exit 0
      fi
    else
      echo "docker-compose.yml does not exist, proceeding with the script to install AIChat Pro..."
    
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
    
      echo ""
      echo ""
    
      # Clone the repository and install dependencies
      echo "curl -o docker-compose.yml..."
      curl -o docker-compose.yml https://raw.githubusercontent.com/Nanjiren01/AIChatWeb/pro/docker-compose.yml
    
      # Setup AIChat Pro Authorized Repository Account
      echo "#############################################################################"
      echo "############# Setup AIChat Pro Authorized Repository Account ################"
      echo "#############################################################################"
      while true; do
        echo "Please input AIChat Pro authorized account username:"
        read -p "Username: " DOCKER_REGISTRY_USERNAME
        echo "Please input AIChat Pro authorized account password:"
        read -s -p "Password: " DOCKER_REGISTRY_PASSWORD
    
        # Log in to the AIChat Pro private repository
        echo ""
        echo "Logging in to AIChat Pro Docker Private Repository..."
        if docker login -u $DOCKER_REGISTRY_USERNAME -p $DOCKER_REGISTRY_PASSWORD http://harbor.nanjiren.online:8099; then
          break
        else
          echo "AIChat Pro authorization failed, please re-enter your account and password."
        fi
      done
    
      echo "******************************************************************"
      echo "** Setup AIChat Pro Authorized Repository Account successfully. **"
      echo "******************************************************************"
    
      echo ""
      echo ""
    
      # Setup AIChat Pro License
      echo "###################################################################"
      echo "#################### Setup AIChat Pro License #####################"
      echo "###################################################################"
      while true; do
          read -p "Please input the license email: " LICENSE_SUBJECT
          if [[ -n $LICENSE_SUBJECT ]]; then
              if [[ $LICENSE_SUBJECT =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
                  echo "License email is valid."
                  break
              else
                  echo "Invalid email format. Please try again."
              fi
          else
              echo "License email cannot be empty. Please try again."
          fi
      done
    
      while true; do
          read -p "Please input the license SK: " LICENSE_SK
          if [[ -n $LICENSE_SK ]]; then
              echo "License SK is valid."
              break
          else
              echo "License SK cannot be empty. Please try again."
          fi
      done
    
      sed -i "s/LICENSE_SUBJECT:.*/LICENSE_SUBJECT: $LICENSE_SUBJECT/g" docker-compose.yml
      sed -i "s/LICENSE_SK:.*/LICENSE_SK: $LICENSE_SK/g" docker-compose.yml
    
      echo "*****************************************************"
      echo "** License details have been updated successfully. **"
      echo "*****************************************************"
    
      echo ""
      echo ""
    
      # Setup AIChat super admin account
      echo "###################################################################"
      echo "#################### Setup Super Admin Account ####################"
      echo "###################################################################"
      while true; do
          echo "Only letters and numbers are supported, the length should between 6 and 20, and they cannot start with a number."
          read -p "Please input the super admin username: " SUPER_USERNAME
          regex='^[A-Za-z][A-Za-z0-9]{5,19}'
          if [[ $SUPER_USERNAME =~ $regex ]]; then
              echo "Super Admin Username is valid."
              break
          else
              echo "Super Admin Username is invalid. Please try again."
          fi
      done
    
      while true; do
          echo "Only letters and numbers are supported, and the length should between 6 and 20. You can change it on the web page after the Application running."
          read -p "Please input the super admin password: " SUPER_PASSWORD
          regex='^[A-Za-z0-9]{6,20}'
          if [[ $SUPER_PASSWORD =~ $regex ]]; then
              echo "Super Admin Password is valid."
              break
          else
              echo "Super Admin Password is invalid. Please try again."
          fi
      done
    
      sed -i "s/SUPERADMIN_USERNAME:.*/SUPERADMIN_USERNAME: $SUPER_USERNAME/g" docker-compose.yml
      sed -i "s/SUPERADMIN_PASSWORD:.*/SUPERADMIN_PASSWORD: $SUPER_PASSWORD/g" docker-compose.yml
    
      echo "**********************************************************************"
      echo "** Super admin account and password have been updated successfully. **"
      echo "**********************************************************************"
    
      echo ""
      echo ""
    
      # Prompt for configuring OSS
      echo "###################################################################"
      echo "####################### Setup AIChat OSS ##########################"
      echo "###################################################################"
      echo "Do you want to configure OSS? (Y/N)"
      read -p "Choice: " CONFIGURE_OSS
    
      if [[ $CONFIGURE_OSS == "Y" || $CONFIGURE_OSS == "y" ]]; then
        while true; do
          read -p "Please input the OSS endpoint: " OSS_ENDPOINT
          if [[ -n $OSS_ENDPOINT ]]; then
            echo "OSS Endpoint is valid."
            break
          else
            echo "OSS Endpoint cannot be empty. Please try again."
          fi
        done
    
        OSS_ENDPOINT2=$OSS_ENDPOINT  
    
        # Replace all '/' with '\/'
        OSS_ENDPOINT=${OSS_ENDPOINT//\//\\/}
    
        while true; do
          read -p "Please input the OSS bucket name: " OSS_BUCKET_NAME
          if [[ -n $OSS_BUCKET_NAME ]]; then
            echo "OSS Bucket Name is valid."
            break
          else
            echo "OSS Bucket Name cannot be empty. Please try again."
          fi
        done
    
        while true; do
          read -p "Please input the OSS access key ID: " OSS_ACCESS_KEY_ID
          if [[ -n $OSS_ACCESS_KEY_ID ]]; then
            echo "OSS Access Key ID is valid."
            break
          else
            echo "OSS Access Key ID cannot be empty. Please try again."
          fi
        done
    
        while true; do
          read -p "Please input the OSS access key secret: " OSS_ACCESS_KEY_SECRET
          if [[ -n $OSS_ACCESS_KEY_SECRET ]]; then
            echo "OSS Access Key Secret is valid."
            break
          else
            echo "OSS Access Key Secret cannot be empty. Please try again."
          fi
        done
    
        sed -i "s/STORE_TYPE:.*/STORE_TYPE: oss/" docker-compose.yml
        sed -i "s/OSS_ENDPOINT:.*/OSS_ENDPOINT: $OSS_ENDPOINT/g" docker-compose.yml
        sed -i "s/OSS_BUCKET_NAME:.*/OSS_BUCKET_NAME: $OSS_BUCKET_NAME/g" docker-compose.yml
        sed -i "s/OSS_ACCESS_KEY_ID:.*/OSS_ACCESS_KEY_ID: $OSS_ACCESS_KEY_ID/g" docker-compose.yml
        sed -i "s/OSS_ACCESS_KEY_SECRET:.*/OSS_ACCESS_KEY_SECRET: $OSS_ACCESS_KEY_SECRET/g" docker-compose.yml
    
        echo "******************************************************"
        echo "** OSS configuration has been updated successfully. **"
        echo "******************************************************"
      fi
    
      echo ""
      echo ""
    
      # Get Gateway IP address
      GATEWAY_IP=$(docker network inspect bridge --format='{{(index .IPAM.Config 0).Gateway}}')
    
      # Update UTIL_ENDPOINT in docker-compose.yml
      sed -i "s/UTIL_ENDPOINT:.*/UTIL_ENDPOINT: http:\/\/$GATEWAY_IP:7788/g" docker-compose.yml
    
      # Display the user input configuration
      echo "======================================================================"
      echo "======================= Configuration Summary ========================"
      echo "======================================================================"
      echo "AIChat Pro License:"
      echo "License Email: $LICENSE_SUBJECT"
      echo "License SK: $LICENSE_SK"
      echo ""
      echo "Super Admin Account:"
      echo "Username: $SUPER_USERNAME"
      echo "Password: $SUPER_PASSWORD"
      echo ""
      echo "AIChat OSS Configuration:"
      if [[ $CONFIGURE_OSS == "Y" || $CONFIGURE_OSS == "y" ]]; then
        echo "OSS Endpoint: $OSS_ENDPOINT2"
        echo "OSS Bucket Name: $OSS_BUCKET_NAME"
        echo "OSS Access Key ID: $OSS_ACCESS_KEY_ID"
        echo "OSS Access Key Secret: $OSS_ACCESS_KEY_SECRET"
      else
        echo "OSS is not configured."
      fi
      echo ""
      echo "UTIL_ENDPOINT: $GATEWAY_IP"
      echo "======================================================================"
    
      # Prompt for confirmation
      echo "Please review the above configuration. If everything looks correct, press Enter to continue or Ctrl+C to cancel."
      read
    
      # Pull the latest images
      docker compose pull
    
      docker compose up -d
    
      docker ps
    fi
    ;;
esac
