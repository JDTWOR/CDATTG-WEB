# Build stage: compilar la app con la URL de la API inyectada
FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=https://apiacademica.jhonrojas.online/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage final: nginx sirve los estáticos
FROM nginx:alpine

# Eliminar config por defecto y usar la nuestra
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
