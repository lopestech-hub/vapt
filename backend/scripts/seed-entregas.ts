import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Busca o motoboy de teste
  const motoboy = await prisma.motoboy.findFirst({
    include: { usuario: true },
  });

  if (!motoboy) {
    console.error('Nenhum motoboy encontrado. Execute o seed principal primeiro.');
    process.exit(1);
  }

  console.log(`Criando entregas para motoboy: ${motoboy.usuario.nome}`);

  // Remove entregas anteriores do seed
  await prisma.entrega.deleteMany({ where: { motoboy_id: motoboy.id } });

  // Cria entregas de exemplo
  const entregas = await prisma.entrega.createMany({
    data: [
      {
        motoboy_id: motoboy.id,
        status: 'pendente',
        cliente_nome: 'Maria Silva',
        cliente_telefone: '(11) 99999-1111',
        endereco_origem: 'Rua das Flores, 100 - Centro',
        endereco_destino: 'Av. Paulista, 1500 - Bela Vista, São Paulo',
        observacoes: 'Fragil - manusear com cuidado',
      },
      {
        motoboy_id: motoboy.id,
        status: 'pendente',
        cliente_nome: 'Carlos Pereira',
        cliente_telefone: '(11) 98888-2222',
        endereco_origem: 'Rua das Flores, 100 - Centro',
        endereco_destino: 'Rua Augusta, 800 - Consolação, São Paulo',
        observacoes: null,
      },
      {
        motoboy_id: motoboy.id,
        status: 'concluida',
        cliente_nome: 'Ana Rodrigues',
        cliente_telefone: '(11) 97777-3333',
        endereco_origem: 'Rua das Flores, 100 - Centro',
        endereco_destino: 'Rua Oscar Freire, 200 - Jardins, São Paulo',
        observacoes: null,
        concluida_em: new Date(),
      },
    ],
  });

  console.log(`✅ ${entregas.count} entregas criadas com sucesso!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
