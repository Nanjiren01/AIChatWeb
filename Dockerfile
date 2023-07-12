
# docker build -t nanjiren01/aichat-web:0.1 .
# docker push nanjiren01/aichat-web:0.1
# docker tag nanjiren01/aichat-web:0.1 nanjiren01/aichat-web:latest
# docker push nanjiren01/aichat-web:latest

# docker build -t nanjiren01/aichat-web:0.2 .
# docker push nanjiren01/aichat-web:0.2
# docker tag nanjiren01/aichat-web:0.2 nanjiren01/aichat-web:latest
# docker push nanjiren01/aichat-web:latest

# docker build -t nanjiren01/aichat-web:0.2.1 .
# docker push nanjiren01/aichat-web:0.2.1
# docker tag nanjiren01/aichat-web:0.2.1 nanjiren01/aichat-web:latest
# docker push nanjiren01/aichat-web:latest

# docker build -t nanjiren01/aichat-web:0.2.2 .
# docker push nanjiren01/aichat-web:0.2.2
# docker tag nanjiren01/aichat-web:0.2.2 nanjiren01/aichat-web:latest
# docker push nanjiren01/aichat-web:latest

# docker build -t nanjiren01/aichat-web:0.2.3 .
# docker push nanjiren01/aichat-web:0.2.3
# docker tag nanjiren01/aichat-web:0.2.3 nanjiren01/aichat-web:latest
# docker push nanjiren01/aichat-web:latest

# docker build -t harbor.nanjiren.online:8099/aichat/aichat-web:0.3 .
# docker push harbor.nanjiren.online:8099/aichat/aichat-web:0.3
# docker tag harbor.nanjiren.online:8099/aichat/aichat-web:0.3 harbor.nanjiren.online:8099/aichat/aichat-web:latest
# docker push harbor.nanjiren.online:8099/aichat/aichat-web:latest

# docker build -t harbor.nanjiren.online:8099/aichat/aichat-web:0.3.1 .
# docker push harbor.nanjiren.online:8099/aichat/aichat-web:0.3.1
# docker tag harbor.nanjiren.online:8099/aichat/aichat-web:0.3.1 harbor.nanjiren.online:8099/aichat/aichat-web:latest
# docker push harbor.nanjiren.online:8099/aichat/aichat-web:latest

# docker build -t harbor.nanjiren.online:8099/aichat/aichat-web:0.3.2 .
# docker push harbor.nanjiren.online:8099/aichat/aichat-web:0.3.2
# docker tag harbor.nanjiren.online:8099/aichat/aichat-web:0.3.2 harbor.nanjiren.online:8099/aichat/aichat-web:latest
# docker push harbor.nanjiren.online:8099/aichat/aichat-web:latest

# docker build -t nanjiren01/aichat-web:0.4 .
# docker push nanjiren01/aichat-web:0.4
# docker tag nanjiren01/aichat-web:0.4 nanjiren01/aichat-web:latest
# docker push nanjiren01/aichat-web:latest


# docker build -t harbor.nanjiren.online:8099/aichat/aichat-web:0.5 .
# docker push harbor.nanjiren.online:8099/aichat/aichat-web:0.5
# docker tag harbor.nanjiren.online:8099/aichat/aichat-web:0.5 harbor.nanjiren.online:8099/aichat/aichat-web:latest
# docker push harbor.nanjiren.online:8099/aichat/aichat-web:latest

# 需要先在本地执行yarn install && yarn build
FROM node:18-alpine

WORKDIR /app

COPY ./public ./public
COPY ./node_modules ./node_modules
COPY ./.next/standalone ./
COPY ./.next/static ./.next/static
COPY ./.next/server ./.next/server

ENV BASE_URL=http://aichat-admin:8080

EXPOSE 3000

CMD node /app/server.js;
