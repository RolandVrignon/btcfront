# Makefile pour le projet front-end

# Variables
NODE_BIN = node_modules/.bin
NPM = npm

# Commandes principales
.PHONY: install start build test lint clean help

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