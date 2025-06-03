#!/bin/sh
set -e

# Afficher un message de démarrage
echo "🚀 Démarrage de l'application Next.js..."

# Vérifier si DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  ATTENTION: La variable DATABASE_URL n'est pas définie!"
  echo "⚠️  L'application pourrait ne pas fonctionner correctement."
else
  echo "📊 Connexion à la base de données configurée."
fi

# Générer le client Prisma avec l'URL de base de données fournie
echo "🔧 Génération du client Prisma..."
pnpm prisma generate

# Si PRISMA_RESOLVE_MIGRATION est à true, on marque la migration manuelle comme appliquée
if [ "$PRISMA_RESOLVE_MIGRATION" = "true" ]; then
  echo "🟢 Résolution de la migration manuelle snake_case_rename..."
  pnpm prisma migrate resolve --applied 20250603763833_snake_case_rename || true
fi

# Vérifier si PRISMA_MIGRATE est défini à "true" pour exécuter les migrations
if [ "$PRISMA_MIGRATE" = "true" ]; then
  echo "🔄 Exécution des migrations Prisma..."
  pnpm prisma migrate deploy
else
  echo "ℹ️  Les migrations Prisma ne seront pas exécutées automatiquement."
  echo "ℹ️  Pour les exécuter, définissez PRISMA_MIGRATE=true"
fi

# Démarrer l'application Next.js
echo "✅ Démarrage du serveur Next.js..."
exec pnpm start