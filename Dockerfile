# Dockerfile pour l'application Next.js avec Prisma

# Étape 1: Dépendances et build
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Installation de pnpm via npm (plus fiable que corepack)
RUN npm install -g pnpm

# Installation des dépendances système nécessaires pour Prisma et bcrypt
RUN apk add --no-cache python3 make g++ openssl-dev

# Création d'une DATABASE_URL temporaire pour l'installation
ENV DATABASE_URL="postgresql://fake:fake@localhost:5432/fake"

# Variables pour ignorer les vérifications de type et de lint
ENV SKIP_TYPE_CHECK=true
ENV NEXT_TELEMETRY_DISABLED=1

# Copie des fichiers de configuration
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Installation des dépendances avec pnpm
RUN pnpm install --frozen-lockfile

# Génération explicite du client Prisma avec l'URL temporaire
RUN pnpm prisma generate

# Copie du reste des fichiers du projet
COPY . .

# Construction de l'application en ignorant les erreurs de linting et de type
RUN SKIP_TYPE_CHECK=true pnpm exec next build

# Étape 2: Image de production
FROM node:20-alpine AS runner

# Définir le répertoire de travail
WORKDIR /app

# Installation de pnpm via npm (plus fiable que corepack)
RUN npm install -g pnpm

# Installation des dépendances système nécessaires pour Prisma
RUN apk add --no-cache python3 make g++ openssl-dev

# Définir les variables d'environnement pour la production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copie des fichiers nécessaires depuis l'étape de build
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Création du script d'entrypoint
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Exposition du port
EXPOSE 3000

# Utilisation du script d'entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]