# docker build -t nanjiren01/aichat-web:0.8 .
# docker push nanjiren01/aichat-web:0.8
# docker tag nanjiren01/aichat-web:0.8 nanjiren01/aichat-web:latest
# docker push nanjiren01/aichat-web:latest

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
