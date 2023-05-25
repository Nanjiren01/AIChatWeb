#!/bin/bash

docker compose down

# Clone the repository and install dependencies
echo "update docker-compose.yml..."
curl -o docker-compose.yml https://raw.githubusercontent.com/Nanjiren01/AIChatWeb/main/docker-compose.yml

docker compose up -d

