# ==========================================
# 1. Estágio de Build (Compilação Web do Expo)
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

# Instala dependências do projeto
COPY package.json package-lock.json ./
RUN npm ci

# Copia todo o código-fonte
COPY . ./

# Define argumentos de build e variáveis de ambiente
ARG EXPO_PUBLIC_API_URL=http://localhost:5000
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV CI=1

# Exporta os arquivos estáticos da versão web do app
RUN npx expo export -p web

# ==========================================
# 2. Estágio de Produção (Nginx Web Server)
# ==========================================
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Remove arquivos padrões do Nginx
RUN rm -rf ./*

# Configuração customizada do Nginx com SPA Routing e proxy reverso para backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os artefatos compilados do estágio builder
COPY --from=builder /app/dist ./

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

# ==========================================
# 3. Estágio de Desenvolvimento (Metro Bundler)
# ==========================================
FROM node:22-alpine AS dev
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

ENV NODE_ENV=development
EXPOSE 8081

CMD ["npx", "expo", "start", "--web", "--host", "0.0.0.0"]
