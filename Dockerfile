
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

# docker build -t nanjiren01/aichat-web:0.4 .
# docker push nanjiren01/aichat-web:0.4
# docker tag nanjiren01/aichat-web:0.4 nanjiren01/aichat-web:latest
# docker push nanjiren01/aichat-web:latest

# 需要先在本地执行yarn install && yarn build
FROM node:18-alpine

WORKDIR /app

COPY ./public ./public
COPY ./.next/standalone ./
COPY ./.next/static ./.next/static
COPY ./.next/server ./.next/server

ENV BASE_URL=http://aichat-admin:8080

EXPOSE 3000

CMD node server.js;
