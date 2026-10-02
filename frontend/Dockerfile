FROM node:22-alpine AS build
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./

ARG VITE_ADMIN_PATH=/admin
ENV VITE_ADMIN_PATH=$VITE_ADMIN_PATH

RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 8080