#!/usr/bin/env ts-node

/**
 * Script pour effacer toutes les tables de la base de données sauf 'account' et 'users'
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { logger } = require("@/src/utils/logger");

async function clearDatabase() {
  logger.info("🗑️  Nettoyage de la base de données en cours...");

  try {
    // Liste des modèles à nettoyer
    const modelsToClean = ["project"];

    // Filtrer pour ne garder que les modèles existants
    const availableModels = modelsToClean.filter((model) =>
      Object.prototype.hasOwnProperty.call(prisma, model),
    );

    logger.debug("Modèles disponibles:", availableModels);

    // Effacer chaque modèle disponible
    for (const modelName of availableModels) {
      logger.info(`Effacement de la table ${modelName}...`);
      try {
        await prisma[modelName].deleteMany({});
        logger.info(`Table ${modelName} effacée avec succès`);
      } catch (error) {
        logger.error(`Erreur lors de l'effacement de ${modelName}:`, error);
      }
    }

    logger.info(
      "✅ Base de données nettoyée avec succès (sauf tables account et users)",
    );
  } catch (error) {
    logger.error("❌ Erreur lors du nettoyage de la base de données:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
