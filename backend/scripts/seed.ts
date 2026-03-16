import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Cria gestor
  const senhaGestor = await bcrypt.hash('admin123', 10);
  const gestor = await prisma.usuario.upsert({
    where: { email: 'gestor@mototrack.com' },
    update: {},
    create: {
      nome: 'Admin Gestor',
      email: 'gestor@mototrack.com',
      senha_hash: senhaGestor,
      perfil: 'gestor',
    },
  });
  console.log('✅ Gestor criado:', gestor.email);

  // Cria motoboy
  const senhaMotoboy = await bcrypt.hash('motoboy123', 10);
  const motoboy = await prisma.usuario.upsert({
    where: { email: 'joao@mototrack.com' },
    update: {},
    create: {
      nome: 'João Silva',
      email: 'joao@mototrack.com',
      senha_hash: senhaMotoboy,
      perfil: 'motoboy',
      motoboy: {
        create: {
          cnh: '12345678901',
          placa_moto: 'ABC-1234',
          modelo_moto: 'Honda CG 160',
          telefone: '(11) 99999-0001',
        },
      },
    },
  });
  console.log('✅ Motoboy criado:', motoboy.email);

  console.log('\n📋 Credenciais para teste:');
  console.log('   Gestor  → gestor@mototrack.com / admin123');
  console.log('   Motoboy → joao@mototrack.com  / motoboy123');
}

main()
  .catch((e) => { console.error('❌ Erro:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
