-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('gestor', 'motoboy');

-- CreateEnum
CREATE TYPE "StatusEntrega" AS ENUM ('pendente', 'em_rota', 'concluida', 'cancelada');

-- CreateEnum
CREATE TYPE "StatusManutencao" AS ENUM ('aberta', 'aprovada', 'em_andamento', 'concluida', 'recusada');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "refresh_token" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motoboy" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "cnh" TEXT NOT NULL,
    "placa_moto" TEXT NOT NULL,
    "modelo_moto" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Motoboy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL,
    "motoboy_id" TEXT NOT NULL,
    "status" "StatusEntrega" NOT NULL DEFAULT 'pendente',
    "cliente_nome" TEXT NOT NULL,
    "cliente_telefone" TEXT,
    "endereco_origem" TEXT NOT NULL,
    "endereco_destino" TEXT NOT NULL,
    "observacoes" TEXT,
    "comprovante_url" TEXT,
    "lat_entrega" DECIMAL(10,7),
    "lng_entrega" DECIMAL(10,7),
    "iniciada_em" TIMESTAMP(3),
    "concluida_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manutencao" (
    "id" TEXT NOT NULL,
    "motoboy_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "StatusManutencao" NOT NULL DEFAULT 'aberta',
    "aprovado_por_id" TEXT,
    "aprovado_em" TIMESTAMP(3),
    "concluida_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abastecimento" (
    "id" TEXT NOT NULL,
    "motoboy_id" TEXT NOT NULL,
    "litros" DECIMAL(6,2) NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "quilometragem" INTEGER NOT NULL,
    "posto" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Abastecimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Motoboy_usuario_id_key" ON "Motoboy"("usuario_id");

-- CreateIndex
CREATE INDEX "Entrega_motoboy_id_idx" ON "Entrega"("motoboy_id");

-- CreateIndex
CREATE INDEX "Entrega_status_idx" ON "Entrega"("status");

-- CreateIndex
CREATE INDEX "Entrega_criado_em_idx" ON "Entrega"("criado_em");

-- CreateIndex
CREATE INDEX "Manutencao_motoboy_id_idx" ON "Manutencao"("motoboy_id");

-- CreateIndex
CREATE INDEX "Manutencao_status_idx" ON "Manutencao"("status");

-- CreateIndex
CREATE INDEX "Abastecimento_motoboy_id_idx" ON "Abastecimento"("motoboy_id");

-- CreateIndex
CREATE INDEX "Abastecimento_criado_em_idx" ON "Abastecimento"("criado_em");

-- AddForeignKey
ALTER TABLE "Motoboy" ADD CONSTRAINT "Motoboy_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_motoboy_id_fkey" FOREIGN KEY ("motoboy_id") REFERENCES "Motoboy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manutencao" ADD CONSTRAINT "Manutencao_motoboy_id_fkey" FOREIGN KEY ("motoboy_id") REFERENCES "Motoboy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manutencao" ADD CONSTRAINT "Manutencao_aprovado_por_id_fkey" FOREIGN KEY ("aprovado_por_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abastecimento" ADD CONSTRAINT "Abastecimento_motoboy_id_fkey" FOREIGN KEY ("motoboy_id") REFERENCES "Motoboy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
