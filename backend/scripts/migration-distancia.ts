import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adicionando colunas de GPS de início e distância...');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Entrega"
    ADD COLUMN IF NOT EXISTS "lat_inicio" DECIMAL(10,7),
    ADD COLUMN IF NOT EXISTS "lng_inicio" DECIMAL(10,7),
    ADD COLUMN IF NOT EXISTS "distancia_km" DECIMAL(8,3)
  `);

  console.log('✅ Colunas adicionadas com sucesso!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
