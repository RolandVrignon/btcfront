# Makefile pour le projet front-end

# Variables
NODE_BIN = node_modules/.bin
NPM = npm
DB_URL=postgresql://postgres:TSnFU4uXXyPQW22fzcbKV@roland-aec-agents-front.c96wswwy05s8.eu-west-1.rds.amazonaws.com:5432/aec-front?schema=public

# Commandes principales
.PHONY: install start build test lint clean help

# Commandes Prisma
.PHONY: prisma-init prisma-generate prisma-migrate prisma-studio prisma-push prisma-pull prisma-format prisma-validate prisma-reset

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
	$(NPM) run build

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
	@npx ts-node --esm scripts/clear-db.ts