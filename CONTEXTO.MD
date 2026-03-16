# MotoTrack — Sistema de Controle de Entregas
> Memória viva. Atualizado automaticamente após qualquer mudança e antes de encerrar cada sessão.

## 🎯 Objetivo
Sistema de gestão de frota de motoboys para empresas com frota própria. O gestor gerencia os motoboys via dashboard web e acompanha entregas, manutenções e abastecimentos em tempo real. O motoboy usa o app mobile para receber, executar e registrar entregas.

## 👥 Usuários e Perfis
- **Gestor:** acessa o dashboard web — gerencia motoboys, cria entregas, aprova manutenções, monitora GPS ao vivo
- **Motoboy:** usa o app mobile (celular pessoal, Android) — recebe entregas, envia localização GPS, tira foto de comprovante, registra abastecimento, abre chamado de manutenção

## ⚙️ Regras de Negócio
- Empresa com frota própria — não é marketplace
- Volume: ~100 motoboys simultâneos
- Autenticação: email/senha para ambos os perfis
- Comprovante de entrega: foto tirada na hora pelo motoboy
- Manutenção: motoboy abre chamado → gestor aprova/recusa → histórico mantido
- Abastecimento: motoboy registra (litros + valor + km) → gestor visualiza e controla custo
- GPS real-time: motoboy envia posição a cada 5s → gestor vê no mapa ao vivo
- Sem cálculo de comissão (fora do escopo)

## 📦 Stack
- **Frontend Web:** React + Vite + TypeScript + Tailwind CSS
  - Libs: TanStack Query, React Hook Form + Zod, React Leaflet (mapa de pins de entregas concluídas), TanStack Table, date-fns, Zustand, lucide-react
- **Mobile:** React Native + Expo (Android first)
  - Libs: expo-location (foreground, captura pontual na foto), expo-camera, expo-notifications, React Navigation
- **Backend:** Node.js + NestJS + Prisma + PostgreSQL
  - Libs: @nestjs/jwt + passport-jwt, bcryptjs, minio, class-validator, @nestjs/throttler, helmet, nestjs-pino + pino-pretty
- **Auth:** JWT + refresh token (login email/senha)
- **Logs:** nestjs-pino | Nível produção: info
- **Segurança:** CORS, Helmet, Rate Limiting configurados
- **Storage:** MinIO na VPS (fotos de comprovante)
- **Real-time:** Não necessário — localização capturada apenas no momento da foto de comprovante
- **MCP:** Coolify MCP (configurar após setup da VPS)
- **Infra:** VPS + Coolify | Deploy: GitHub push → auto deploy | Timezone: America/Sao_Paulo

## 🗄️ Banco de Dados
### Tabelas (nomes em Português)
- `usuarios` — gestor e motoboy (perfil enum)
- `motoboys` — dados da moto, CNH, telefone, status online
- `entregas` — status, endereços, cliente, comprovante_url, coordenadas
- `localizacoes` — histórico GPS por motoboy (crescimento rápido — avaliar política de limpeza)
- `manutencoes` — chamados com status e aprovação
- `abastecimentos` — litros, valor, quilometragem por motoboy

### Prisma Schema Completo
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum PerfilUsuario {
  gestor
  motoboy
}

enum StatusEntrega {
  pendente
  em_rota
  concluida
  cancelada
}

enum StatusManutencao {
  aberta
  aprovada
  em_andamento
  concluida
  recusada
}

model Usuario {
  id            String        @id @default(uuid())
  nome          String
  email         String        @unique
  senha_hash    String
  perfil        PerfilUsuario
  ativo         Boolean       @default(true)
  criado_em     DateTime      @default(now())
  atualizado_em DateTime      @updatedAt

  motoboy       Motoboy?
  aprovacoes    Manutencao[]  @relation("AprovadoPor")
}

model Motoboy {
  id            String    @id @default(uuid())
  usuario_id    String    @unique
  usuario       Usuario   @relation(fields: [usuario_id], references: [id])
  cnh           String
  placa_moto    String
  modelo_moto   String
  telefone      String
  online        Boolean   @default(false)
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt

  entregas        Entrega[]
  localizacoes    Localizacao[]
  manutencoes     Manutencao[]
  abastecimentos  Abastecimento[]
}

model Entrega {
  id                String        @id @default(uuid())
  motoboy_id        String
  motoboy           Motoboy       @relation(fields: [motoboy_id], references: [id])
  status            StatusEntrega @default(pendente)
  cliente_nome      String
  cliente_telefone  String?
  endereco_origem   String
  endereco_destino  String
  observacoes       String?
  comprovante_url   String?
  lat_entrega       Decimal?      @db.Decimal(10, 7)
  lng_entrega       Decimal?      @db.Decimal(10, 7)
  iniciada_em       DateTime?
  concluida_em      DateTime?
  criado_em         DateTime      @default(now())
  atualizado_em     DateTime      @updatedAt

  @@index([motoboy_id])
  @@index([status])
  @@index([criado_em])
}

model Localizacao {
  id          String   @id @default(uuid())
  motoboy_id  String
  motoboy     Motoboy  @relation(fields: [motoboy_id], references: [id])
  latitude    Decimal  @db.Decimal(10, 7)
  longitude   Decimal  @db.Decimal(10, 7)
  velocidade  Decimal? @db.Decimal(5, 2)
  criado_em   DateTime @default(now())

  @@index([motoboy_id, criado_em])
}

model Manutencao {
  id              String           @id @default(uuid())
  motoboy_id      String
  motoboy         Motoboy          @relation(fields: [motoboy_id], references: [id])
  tipo            String
  descricao       String
  status          StatusManutencao @default(aberta)
  aprovado_por_id String?
  aprovado_por    Usuario?         @relation("AprovadoPor", fields: [aprovado_por_id], references: [id])
  aprovado_em     DateTime?
  concluida_em    DateTime?
  criado_em       DateTime         @default(now())
  atualizado_em   DateTime         @updatedAt

  @@index([motoboy_id])
  @@index([status])
}

model Abastecimento {
  id            String   @id @default(uuid())
  motoboy_id    String
  motoboy       Motoboy  @relation(fields: [motoboy_id], references: [id])
  litros        Decimal  @db.Decimal(6, 2)
  valor_total   Decimal  @db.Decimal(10, 2)
  quilometragem Int
  posto         String?
  criado_em     DateTime @default(now())
  atualizado_em DateTime @updatedAt

  @@index([motoboy_id])
  @@index([criado_em])
}
```

### Decisões importantes
- Valores monetários: `Decimal @db.Decimal(10, 2)` — nunca Float
- Coordenadas GPS: `Decimal @db.Decimal(10, 7)` — precisão suficiente para rastreamento
- Tabela `localizacoes` cresce rápido — avaliar job de limpeza de registros com mais de 30 dias

## 🔌 Rotas da API

### Auth
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Login email/senha | ❌ |
| POST | `/api/auth/refresh` | Renovar token | ❌ |
| POST | `/api/auth/logout` | Invalidar refresh token | ✅ |

### Motoboys
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/motoboys` | Listar todos | Gestor |
| POST | `/api/motoboys` | Cadastrar motoboy | Gestor |
| GET | `/api/motoboys/:id` | Detalhes + última localização | Gestor |
| PATCH | `/api/motoboys/:id` | Editar dados | Gestor |
| DELETE | `/api/motoboys/:id` | Desativar | Gestor |
| GET | `/api/motoboys/online` | Motoboys ativos no momento | Gestor |

### Entregas
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/entregas` | Listar (filtros: data, status, motoboy) | Gestor |
| POST | `/api/entregas` | Criar e atribuir | Gestor |
| GET | `/api/entregas/minhas` | Entregas do motoboy logado | Motoboy |
| PATCH | `/api/entregas/:id/iniciar` | Motoboy inicia entrega | Motoboy |
| POST | `/api/entregas/:id/concluir` | Upload foto + concluir | Motoboy |
| PATCH | `/api/entregas/:id/cancelar` | Cancelar entrega | Gestor |

### Manutenções
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/manutencoes` | Listar todas | Gestor |
| POST | `/api/manutencoes` | Motoboy abre chamado | Motoboy |
| GET | `/api/manutencoes/minhas` | Chamados do motoboy | Motoboy |
| PATCH | `/api/manutencoes/:id/aprovar` | Gestor aprova | Gestor |
| PATCH | `/api/manutencoes/:id/recusar` | Gestor recusa | Gestor |
| PATCH | `/api/manutencoes/:id/concluir` | Marcar como concluída | Gestor |

### Abastecimento
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/abastecimentos` | Listar (filtros: motoboy, período) | Gestor |
| POST | `/api/abastecimentos` | Motoboy registra abastecimento | Motoboy |
| GET | `/api/abastecimentos/minhas` | Histórico do motoboy | Motoboy |

### Dashboard
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/dashboard/resumo` | KPIs do dia | Gestor |
| GET | `/api/dashboard/motoboys-ativos` | Quantos online agora | Gestor |

### WebSocket (Socket.io)
| Evento | Direção | Descrição |
|---|---|---|
| `motoboy:localizacao` | App → Server | Envia GPS a cada 5s |
| `motoboy:online` | App → Server | Motoboy ficou online |
| `motoboy:offline` | App → Server | Motoboy ficou offline |
| `tracking:update` | Server → Dashboard | Broadcast posição ao gestor |

## 📁 Estrutura de Pastas Atual

```
mototrack/
├── frontend/
│   └── src/
│       ├── components/ui/
│       ├── components/mapa/
│       ├── components/entregas/
│       ├── components/manutencoes/
│       ├── components/abastecimento/
│       ├── pages/
│       ├── hooks/
│       ├── services/api.ts
│       ├── services/socket.ts
│       ├── store/
│       ├── types/
│       └── utils/
├── mobile/
│   └── src/
│       ├── screens/
│       ├── components/
│       ├── hooks/useLocalizacao.ts
│       ├── services/api.ts
│       ├── services/socket.ts
│       └── navigation/
├── backend/
│   ├── prisma/schema.prisma
│   ├── scripts/
│   └── src/
│       ├── modules/auth/
│       ├── modules/motoboys/
│       ├── modules/entregas/
│       ├── modules/manutencoes/
│       ├── modules/abastecimento/
│       ├── modules/dashboard/
│       ├── modules/rastreamento/
│       ├── modules/storage/
│       ├── common/guards/
│       ├── common/decorators/
│       └── config/
├── Dockerfile
├── .env.example
└── CONTEXTO.MD
```

## 🔧 Variáveis de Ambiente
```
DATABASE_URL
TZ=America/Sao_Paulo
PGTZ=America/Sao_Paulo
JWT_SECRET
JWT_EXPIRES_IN=10h
JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
FRONTEND_URL
CORS_ORIGIN
LOG_LEVEL=info
MINIO_ENDPOINT
MINIO_PORT=9000
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
MINIO_BUCKET=mototrack
```

## 🛠️ Comandos Úteis
- Dev frontend: `cd frontend && npm run dev`
- Dev backend: `cd backend && npm run start:dev`
- Dev mobile: `cd mobile && npx expo start`
- Rodar migration: `cd backend && npx tsx scripts/nome.ts`
- Build local: `docker build -t mototrack .`
- Prisma Studio: `cd backend && npx prisma studio`

## 📋 Integrações Externas
- MinIO (storage de fotos) — na mesma VPS
- Google Maps / OpenStreetMap via React Leaflet (sem custo)
- Expo Push Notifications (sem custo, via Expo)

## 🚀 Roadmap
- [ ] Fase 1 — Setup monorepo, Dockerfile, Prisma schema, Auth (JWT + refresh), Pino, CORS, Helmet, rate limiting, `public/version.json`
- [ ] Fase 2 — Módulos Motoboys + Entregas (web + mobile básico)
- [ ] Fase 3 — WebSocket GPS real-time + mapa no dashboard
- [ ] Fase 4 — Comprovante de entrega (câmera + MinIO)
- [ ] Fase 5 — Manutenções + Abastecimento
- [ ] Fase 6 — Dashboard KPIs + relatórios
- [ ] Fase 7 — Push notifications (nova entrega para o motoboy)
- [ ] Fase 8 — Testes, refinamentos, publicação Play Store

## 🎨 Convenções de Código
- Nomenclatura: `camelCase` (funções/variáveis), `PascalCase` (componentes/classes), `snake_case` (banco)
- Erros backend: `{ success: false, error: "mensagem" }` — nunca expor stack trace em produção
- Imports: absolutos via alias `@/` no frontend e mobile, relativos no backend
- Todo elemento clicável usa `cursor-pointer` no Tailwind
- Comentários sempre em português

## ⚠️ Riscos Identificados
- **[ALTO]** GPS background: iOS limita rastreamento em background → focar em Android first
- **[ALTO]** WebSocket com 100 motoboys simultâneos: validar capacidade do servidor sob carga
- **[MÉDIO]** MinIO na VPS: configurar volume persistente no Coolify para não perder fotos no redeploy
- **[MÉDIO]** Expo OTA vs Play Store: mudanças nativas exigem republicação → documentar processo
- **[MÉDIO]** Tabela `localizacoes` cresce rápido → implementar job de limpeza de registros antigos (>30 dias)
- **[BAIXO]** Refresh token: definir estratégia de revogação em caso de roubo do celular do motoboy

## 📝 Decisões Técnicas
- **NestJS ao invés de Fastify:** projeto tem WebSocket, múltiplos módulos e complexidade que justificam a estrutura modular do NestJS
- **React Native + Expo ao invés de Flutter:** mesma stack TypeScript do frontend web, OTA updates sem publicar nova versão na Play Store, comunidade maior no Brasil
- **MinIO ao invés de S3:** projeto ainda sem plataforma de deploy definida — MinIO na VPS evita dependência e custo externo
- **Android first:** perfil do motoboy brasileiro usa Android — iOS fica para fase posterior

## 🗺️ Planejamento — Resumo das Etapas
- Etapa 1 (Entendimento): empresa com frota própria, 100 motoboys, gestor web + motoboy mobile, GPS real-time, comprovante foto, manutenções, abastecimento
- Etapa 2 (Stack): NestJS + React + React Native/Expo + PostgreSQL + MinIO + Socket.io
- Etapa 3 (Libs): socket.io, expo-location, expo-camera, React Leaflet, TanStack Query, nestjs-pino
- Etapa 4 (Módulos): Auth, Usuários, Motoboys, Entregas, Rastreamento, Comprovantes, Manutenções, Abastecimento, Dashboard
- Etapa 5 (Banco): 6 tabelas definidas com Prisma Schema completo
- Etapa 6 (Rotas): 22 rotas HTTP + 4 eventos WebSocket
- Etapa 7 (Pastas): monorepo com frontend/, mobile/, backend/
- Etapa 8 (Dockerfile): multi-stage build, mobile publicado separado na Play Store
- Etapa 9 (Envs): 15 variáveis mapeadas
- Etapa 10 (Roadmap): 8 fases definidas

## ⚠️ Problemas Conhecidos
_Nenhum — projeto em fase de planejamento_

## 📅 Última Sessão — O que foi feito e testado
- Planejamento completo das 12 etapas realizado
- Stack definida e validada
- Prisma Schema completo criado
- Rotas da API mapeadas (22 HTTP + 4 WebSocket)
- CONTEXTO.MD criado

## ➡️ Próximos Passos
1. Criar estrutura de pastas do monorepo (`frontend/`, `mobile/`, `backend/`)
2. Inicializar projetos: `npm create vite@latest frontend`, `npx create-nest backend`, `npx create-expo-app mobile`
3. Configurar Prisma e banco na VPS
4. Implementar Fase 1: Auth + setup de segurança + version.json

## 📅 Histórico de Mudanças
- **2026-03-12:** Planejamento inicial criado — projeto MotoTrack
