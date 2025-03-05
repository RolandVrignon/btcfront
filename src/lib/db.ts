import { PrismaClient } from "@prisma/client";

// Évite de créer plusieurs instances de PrismaClient en développement
// à cause du rechargement à chaud (hot reloading)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
