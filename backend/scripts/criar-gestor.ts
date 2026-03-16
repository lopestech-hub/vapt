import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('admin123', 10);

  const gestor = await prisma.usuario.upsert({
    where: { email: 'gestor@mototrack.com' },
    update: { senha_hash: senhaHash },
    create: {
      nome: 'Gestor',
      email: 'gestor@mototrack.com',
      senha_hash: senhaHash,
      perfil: 'gestor',
    },
  });

  console.log(`✅ Gestor criado: ${gestor.email}`);
  console.log(`   Senha: admin123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
