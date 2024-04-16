


# docker build -t nanjiren01/aichat-web:0.11.4 ../AIChatWeb
# docker push nanjiren01/aichat-web:0.11.4
# docker tag nanjiren01/aichat-web:0.11.4 nanjiren01/aichat-web:pro-latest
# docker push nanjiren01/aichat-web:pro-latest

FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN chmod +x /app/node_modules/.bin/next
RUN chmod +x /app/node_modules/.bin/cross-env

RUN yarn build

# 构建最终容器
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/server ./.next/server

ENV BASE_URL=http://aichat-admin:8080
ENV SECRET=123456

EXPOSE 3000

CMD node /app/server.js
