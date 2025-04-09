# Makefile pour le projet front-end

# Variables
NODE_BIN = node_modules/.bin
NPM = pnpm
DOCKER_HUB_USERNAME = roland.vrignon@iadopt.fr
DOCKER_HUB_PREFIX = iadopt
DOCKER_IMAGE_NAME = btpc-front
DOCKER_IMAGE_TAG = latest
DB_USER = postgres
DB_PASSWORD = postgres
DB_NAME = btpc
DB_PORT = 5434
DB_HOST = localhost
DATABASE_URL = postgresql://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?schema=public

# Commandes principales
.PHONY: install start build test lint clean help

# Commandes Prisma
.PHONY: prisma-init prisma-generate prisma-migrate prisma-studio prisma-push prisma-pull prisma-format prisma-validate prisma-reset db-init db-migrate db-generate

# Commandes Prettier
.PHONY: prettier prettier-check

# Installation des dépendances
install:
	$(NPM) install

dev:
	$(NPM) run dev

# Démarrage du serveur de développement
start:
	$(NPM) start

# Construction du projet pour la production
build:
	$(NPM) run build --no-lint

# Exécution des tests
test:
	$(NPM) test

# Linting du code
lint:
	$(NPM) run lint

# Nettoyage des fichiers générés
clean:
	rm -rf build/
	rm -rf node_modules/

# Affichage de l'aide
help:
	@echo "Commandes disponibles:"
	@echo "  make install  - Installe les dépendances"
	@echo "  make start    - Démarre le serveur de développement"
	@echo "  make build    - Construit le projet pour la production"
	@echo "  make test     - Exécute les tests"
	@echo "  make lint     - Vérifie la qualité du code"
	@echo "  make clean    - Supprime les fichiers générés"
	@echo "  make help     - Affiche cette aide"

# Commande par défaut
default: help

# Initialiser Prisma
prisma-init:
	@echo "Initialisation de Prisma..."
	npx prisma init

# Générer le client Prisma
prisma-generate:
	@echo "Génération du client Prisma..."
	npx prisma generate

# Créer et appliquer une migration
prisma-migrate:
	@echo "Création d'une migration..."
	npx prisma migrate dev

# Créer une migration avec un nom spécifique
prisma-migrate-name:
	@echo "Création d'une migration nommée..."
	@read -p "Nom de la migration: " name; \
	npx prisma migrate dev --name $$name

# Appliquer les migrations en production
prisma-deploy:
	@echo "Déploiement des migrations en production..."
	npx prisma migrate deploy

# Ouvrir Prisma Studio
prisma-studio:
	@echo "Ouverture de Prisma Studio..."
	npx prisma studio

# Pousser le schéma vers la base de données (sans migration)
prisma-push:
	@echo "Mise à jour de la base de données sans migration..."
	npx prisma db push

# Extraire le schéma depuis la base de données
prisma-pull:
	@echo "Extraction du schéma depuis la base de données..."
	npx prisma db pull

# Formater le fichier schema.prisma
prisma-format:
	@echo "Formatage du schéma Prisma..."
	npx prisma format

# Valider le schéma Prisma
prisma-validate:
	@echo "Validation du schéma Prisma..."
	npx prisma validate

# Réinitialiser la base de données (ATTENTION: supprime toutes les données)
prisma-reset:
	@echo "ATTENTION: Cette commande va supprimer toutes les données de la base de données."
	@read -p "Êtes-vous sûr de vouloir continuer? (y/n): " confirm; \
	if [ "$$confirm" = "y" ]; then \
		npx prisma migrate reset --force; \
		echo "Base de données réinitialisée."; \
	else \
		echo "Opération annulée."; \
	fi

# Commande pour configurer le projet
.PHONY: setup

# Configuration initiale du projet
setup:
	$(NPM) install
	make prisma-generate
	make prisma-push

# Formater le code avec Prettier
prettier:
	@echo "Formatage du code avec Prettier..."
	npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,scss,md}"

# Vérifier le formatage sans modifier les fichiers
prettier-check:
	@echo "Vérification du formatage avec Prettier..."
	npx prettier --check "**/*.{js,jsx,ts,tsx,json,css,scss,md}"

# Effacer les données de la base de données (sauf users et accounts)
clear-db:
	@echo "Effacement des données de la base de données (sauf users et accounts)..."
	@npx tsx scripts/clear-db.ts

.PHONY: push-image
push-image:
	@echo "\033[1;36m=== Préparation et envoi de l'image Docker vers Docker Hub ===\033[0m"
	@echo "\033[1;33mConstruction de l'image Docker...\033[0m"
	@docker-compose build
	@echo "\033[1;33mTaggage de l'image avec $(DOCKER_HUB_PREFIX)/$(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG)...\033[0m"
	@docker tag btpc-front:latest $(DOCKER_HUB_PREFIX)/$(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG)
	@echo "\033[1;33mEnvoi de l'image vers Docker Hub...\033[0m"
	@docker push $(DOCKER_HUB_PREFIX)/$(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG)
	@echo "\033[1;32mImage envoyée avec succès vers Docker Hub !\033[0m"
	@echo "L'image est disponible à l'adresse: $(DOCKER_HUB_PREFIX)/$(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG)"

# Initialiser la base de données PostgreSQL
db-init:
	@echo "\033[1;36m=== Initialisation de la base de données PostgreSQL ===\033[0m"
	@echo "\033[1;33mDémarrage du conteneur PostgreSQL...\033[0m"
	@docker-compose up -d postgres
	@echo "\033[1;33mAttente que PostgreSQL soit prêt...\033[0m"
	@sleep 5
	@echo "\033[1;33mCréation de la base de données $(DB_NAME)...\033[0m"
	@docker-compose exec postgres psql -U $(DB_USER) -c "CREATE DATABASE $(DB_NAME) WITH ENCODING 'UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8' TEMPLATE=template0;" || echo "La base de données existe déjà"
	@echo "\033[1;32mBase de données initialisée avec succès !\033[0m"
	@echo "URL de connexion: $(DATABASE_URL)"

# Exécuter les migrations Prisma
db-migrate:
	@echo "\033[1;36m=== Exécution des migrations Prisma ===\033[0m"
	@echo "\033[1;33mApplication des migrations...\033[0m"
	@DATABASE_URL=$(DATABASE_URL) npx prisma migrate dev
	@echo "\033[1;32mMigrations appliquées avec succès !\033[0m"

# Générer le client Prisma
db-generate:
	@echo "\033[1;36m=== Génération du client Prisma ===\033[0m"
	@echo "\033[1;33mGénération du client...\033[0m"
	@DATABASE_URL=$(DATABASE_URL) npx prisma generate
	@echo "\033[1;32mClient Prisma généré avec succès !\033[0m"

# Database commands
db-up:
	@echo "\033[1;36m=== Démarrage de PostgreSQL avec Docker Compose ===\033[0m"
	docker-compose up -d postgres
	@echo "\033[1;33mAttente que PostgreSQL soit prêt...\033[0m"
	@sleep 5
	@echo "\033[1;32mPostgreSQL est prêt ! ===\033[0m"
	@echo "Disponible sur localhost:5434"

db-down:
	@echo "\033[1;36m=== Arrêt de PostgreSQL ===\033[0m"
	docker-compose stop postgres
	docker-compose rm -f postgres

db-logs:
	docker-compose logs -f postgres

db-shell:
	docker-compose exec postgres psql -U postgres -d btpc

db-status:
	@echo "\033[1;36m=== Status de PostgreSQL ===\033[0m"
	@docker-compose ps postgres

.PHONY: db-up db-down db-logs db-shell db-status