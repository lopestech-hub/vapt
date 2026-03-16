import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Criando tabela Filial e adicionando coluna filial_id em Motoboy...');

  // Cria a tabela Filial
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Filial" (
      "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "codigo"     TEXT NOT NULL,
      "nome"       TEXT NOT NULL,
      "ativo"      BOOLEAN NOT NULL DEFAULT true,
      "criado_em"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Filial_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Filial_codigo_key" UNIQUE ("codigo")
    );
  `);
  console.log('✅ Tabela Filial criada');

  // Adiciona coluna filial_id em Motoboy
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Motoboy"
    ADD COLUMN IF NOT EXISTS "filial_id" TEXT REFERENCES "Filial"("id");
  `);
  console.log('✅ Coluna filial_id adicionada em Motoboy');

  // Adiciona índice
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Motoboy_filial_id_idx" ON "Motoboy"("filial_id");
  `);
  console.log('✅ Índice criado');

  // Seed das filiais
  const filiais = [
    { codigo: '00', nome: 'Petrolina' },
    { codigo: '01', nome: 'Juazeiro' },
    { codigo: '02', nome: 'Salgueiro' },
    { codigo: '04', nome: 'CD' },
    { codigo: '05', nome: 'Bonfim' },
    { codigo: '06', nome: 'Picos' },
  ];

  for (const filial of filiais) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Filial" ("codigo", "nome")
      VALUES ('${filial.codigo}', '${filial.nome}')
      ON CONFLICT ("codigo") DO NOTHING;
    `);
  }
  console.log('✅ 6 filiais cadastradas');
}

main()
  .catch((e) => { console.error('❌ Erro:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
