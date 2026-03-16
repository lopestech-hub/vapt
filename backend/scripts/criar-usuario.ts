import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('123456', 10);

  const usuario = await prisma.usuario.upsert({
    where: { email: 'julio@gmail.com' },
    update: { senha_hash: senhaHash },
    create: {
      nome: 'Julio',
      email: 'julio@gmail.com',
      senha_hash: senhaHash,
      perfil: 'motoboy',
    },
  });

  // Cria o registro de motoboy vinculado
  await prisma.motoboy.upsert({
    where: { usuario_id: usuario.id },
    update: {},
    create: {
      usuario_id: usuario.id,
      cnh: '00000000000',
      placa_moto: 'ABC-1234',
      modelo_moto: 'Honda CG 160',
      telefone: '(11) 99999-9999',
    },
  });

  // Cria algumas entregas de teste para este usuário
  const motoboy = await prisma.motoboy.findUnique({ where: { usuario_id: usuario.id } });
  await prisma.entrega.createMany({
    data: [
      {
        motoboy_id: motoboy!.id,
        status: 'pendente',
        cliente_nome: 'Maria Silva',
        endereco_origem: 'Rua das Flores, 100 - Centro',
        endereco_destino: 'Av. Paulista, 1500 - Bela Vista, São Paulo',
        observacoes: 'Fragil - manusear com cuidado',
      },
      {
        motoboy_id: motoboy!.id,
        status: 'pendente',
        cliente_nome: 'Carlos Pereira',
        endereco_origem: 'Rua das Flores, 100 - Centro',
        endereco_destino: 'Rua Augusta, 800 - Consolação, São Paulo',
      },
      {
        motoboy_id: motoboy!.id,
        status: 'concluida',
        cliente_nome: 'Ana Rodrigues',
        endereco_origem: 'Rua das Flores, 100 - Centro',
        endereco_destino: 'Rua Oscar Freire, 200 - Jardins, São Paulo',
        concluida_em: new Date(),
      },
    ],
  });

  console.log(`✅ Usuário criado: ${usuario.email} (motoboy)`);
  console.log(`   Senha: 123456`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
