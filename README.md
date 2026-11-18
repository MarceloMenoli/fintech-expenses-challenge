# Fluxo — Gestão financeira corporativa

MVP do desafio técnico NestJS + React: registro e login, categorias, transações financeiras e dashboard com dados isolados por usuário.

- **Repositório público:** https://github.com/MarceloMenoli/fintech-expenses-challenge
- **API pública:** https://api-production-78eb2bd5.up.railway.app/api
- **Healthcheck:** https://api-production-78eb2bd5.up.railway.app/api/health
- **Aplicação pública:** https://fintech-expenses-challenge-two.vercel.app
- **Demonstração local:** http://localhost:5173
- **Conta seed:** `demo@fluxo.app` / `Demo@2026!` — credenciais exclusivamente demonstrativas.

## Funcionalidades

- Cadastro com nome, e-mail único e senha com hash bcrypt; login JWT e rotas protegidas.
- CRUD de categorias com descrição opcional. Categorias usadas por transações não podem ser excluídas.
- Criação, consulta, edição e exclusão de transações próprias.
- Filtros combináveis por tipo, categoria e datas, com paginação.
- Dashboard calculado na API: saldo histórico, entradas e saídas do período e três categorias com maior soma de saídas.
- Interface responsiva com estados de carregamento, listas vazias, confirmação de exclusão e feedback de sucesso/erro.

## Stack e decisões

**Backend:** NestJS 11, TypeScript strict, Prisma 7, PostgreSQL 17, `@nestjs/jwt`, class-validator e class-transformer. Módulos Auth, Users, Categories, Transactions e Dashboard, com um serviço Prisma compartilhado. O adapter PostgreSQL tem timeout de conexão e limite de conexões explícitos.

**Frontend:** React 19, Vite, React Router, Axios e TanStack Query. Componentes funcionais e hooks. TanStack Query controla dados remotos, cache e invalidação após mutações, incluindo os indicadores do dashboard. Context API mantém o usuário e o token em memória; a sessão exige novo login após recarregar a página. Não há necessidade de outra biblioteca de estado global neste escopo.

**Domínio:** valores positivos em centavos inteiros, sem cálculos monetários de negócio no frontend; datas civis em `YYYY-MM-DD`, sem deslocamento de fuso. Tipos `INCOME` e `EXPENSE`. O proprietário vem do token, nunca do corpo. A chave estrangeira composta também impede no banco o vínculo entre uma transação e a categoria de outro usuário.

**Organização:** npm workspaces, com `backend/` e `frontend/`. Sem microsserviços, filas ou camadas adicionais sem necessidade. Docker é uma conveniência local e o formato de publicação da API no Railway.

## Executar localmente

Requisitos: **Node.js 22.14+ na linha 22**, **npm 10+** e **PostgreSQL 17**. Para os comandos abaixo, Docker Desktop deve estar iniciado. Também é possível usar PostgreSQL instalado e ajustar `DATABASE_URL`.

Na raiz, em PowerShell:

```powershell
npm ci
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
docker compose up -d
npm run db:generate
npm run db:deploy
npm run db:seed
```

Substitua `JWT_SECRET` por um segredo aleatório com pelo menos 32 caracteres. No Linux/macOS, substitua `Copy-Item` por `cp`.

Em terminais separados:

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- Healthcheck: http://localhost:3000/api/health
- PostgreSQL local do Compose: `localhost:5434`, banco `fintech`.

A porta 5434 evita conflito com outras instalações de PostgreSQL. As credenciais locais do Compose são apenas para desenvolvimento. O seed é idempotente: cria categorias e transações no mês atual e preserva as alterações de uma conta já populada.

Para desligar o PostgreSQL sem apagar dados: `docker compose stop`.

## Variáveis de ambiente

| Aplicação | Variável                 | Uso                                                           |
| --------- | ------------------------ | ------------------------------------------------------------- |
| Backend   | `DATABASE_URL`           | Conexão PostgreSQL do ambiente atual                          |
| Backend   | `JWT_SECRET`             | Segredo aleatório com pelo menos 32 caracteres                |
| Backend   | `JWT_EXPIRES_IN_SECONDS` | Validade do JWT; padrão 3600, entre 60 e 86400                |
| Backend   | `FRONTEND_URL`           | Origem exata autorizada pelo CORS, sem barra final            |
| Backend   | `PORT`                   | Porta da API; padrão 3000, fornecida pelo Railway em produção |
| Testes    | `TEST_DATABASE_URL`      | Banco exclusivo de testes, cujo nome termina em `_test`       |
| Frontend  | `VITE_API_URL`           | URL pública da API incluindo `/api`, definida durante o build |

Use as mesmas origens no navegador e no CORS: `localhost` e `127.0.0.1` são origens diferentes. Não versione arquivos `.env`. As variáveis `VITE_*` são públicas; não coloque segredos nelas.

## Banco e migrations

```powershell
# Aplicar as migrations versionadas, inclusive em banco vazio:
npm run db:deploy

# Criar uma nova migration durante o desenvolvimento:
npm run db:migrate -- --name descricao_da_alteracao
npm run db:generate

# Popular a demonstração:
npm run db:seed
```

A migration inicial inclui índices por proprietário/data e restrição de valor positivo. Em produção use `db:deploy`, nunca `migrate dev`. O seed não é executado automaticamente a cada deploy.

## Verificações e testes

Crie um banco separado uma única vez:

```powershell
docker compose exec -T postgres createdb -U fintech fintech_test
```

Configure `TEST_DATABASE_URL` em `backend/.env`, conforme o exemplo. Os testes recusam um banco cujo nome não termine em `_test` e recusam a URL de desenvolvimento. **O conteúdo desse banco exclusivo é limpo pelos testes de integração.**

```powershell
npm run db:generate
npm run lint
npm run typecheck
npm run build
npm test
```

A suíte Jest/Supertest usa PostgreSQL real e aplica as migrations. Os 11 cenários cobrem cadastro e duplicidade, login, tokens ausentes/inválidos/expirados, isolamento entre usuários, categorias de terceiros, filtros e paginação, valores e datas inválidas, dashboard com e sem dados, exclusão vinculada e edição de recursos próprios.

Testes de navegador com Playwright percorrem o fluxo completo em desktop e celular, utilizando API própria na porta 3001, frontend na 5174 e o banco exclusivo de testes:

```powershell
npx playwright install chromium
npm run test:ui
```

No Windows, para usar o Chrome já instalado em vez de baixar Chromium:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm run test:ui
```

`npm run format:check` verifica formatação e `npm run format` a aplica. O GitHub Actions executa lint, tipos, builds, testes de API e testes de navegador com PostgreSQL temporário.

### Testar o ambiente publicado

Os testes de produção usam o site da Vercel e a API do Railway, sem iniciar Docker ou servidores locais:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
$env:PRODUCTION_WEB_URL = 'https://fintech-expenses-challenge-two.vercel.app'
$env:PRODUCTION_API_URL = 'https://api-production-78eb2bd5.up.railway.app/api'
npm run test:production
```

O cenário desktop cadastra uma conta isolada e valida CRUD, filtros combinados, período inválido, paginação, dashboard, isolamento entre contas e sessão. Categorias e transações criadas são removidas ao terminar; a conta vazia permanece porque o MVP não oferece exclusão de usuários. O cenário mobile usa a conta demonstrativa para validar login, indicadores, filtros, responsividade e acesso direto às rotas. Esses testes são executados explicitamente, fora da CI, para não modificar o ambiente público a cada push.

## API

Rotas privadas usam `Authorization: Bearer <token>`.

| Método               | Rota sob `/api`     | Comportamento                                  |
| -------------------- | ------------------- | ---------------------------------------------- |
| GET                  | `/health`           | Estado da aplicação                            |
| POST                 | `/auth/register`    | Cadastro e retorno de sessão                   |
| POST                 | `/auth/login`       | Login e retorno de sessão                      |
| GET                  | `/auth/me`          | Usuário autenticado sem hash de senha          |
| GET / POST           | `/categories`       | Listar / criar categorias próprias             |
| PATCH / DELETE       | `/categories/:id`   | Editar / excluir categoria própria             |
| GET / POST           | `/transactions`     | Listar / criar transações próprias             |
| GET / PATCH / DELETE | `/transactions/:id` | Consultar / editar / excluir transação própria |
| GET                  | `/dashboard`        | Indicadores do usuário autenticado             |

Cadastro recebe `{ "name": "Ana", "email": "ana@example.com", "password": "SenhaSegura123!" }`. Login recebe e-mail e senha. Ambos retornam `{ "data": { "user": { "id", "name", "email" }, "accessToken": "..." } }` (campos do usuário ilustrados).

Exemplo de transação:

```json
{
  "description": "Assinatura mensal",
  "amount": 9990,
  "type": "EXPENSE",
  "date": "2026-11-17",
  "categoryId": "UUID_DA_CATEGORIA"
}
```

- Listagem: `page` (padrão 1), `limit` (padrão 20, máximo 100), `type`, `categoryId`, `startDate` e `endDate`. Ordenação por data decrescente e ID decrescente como desempate.
- Dashboard: `startDate` e `endDate`; saldo sempre histórico. Sem datas, os totais consideram todo o histórico. Períodos incluem os dois extremos; início posterior ao fim retorna 400.
- Sucessos: `{ "data": ... }`; listagens paginadas: `{ "data": [], "meta": { "page", "limit", "total", "totalPages" } }` (campos de metadados ilustrados).
- Dashboard: `{ "data": { "balance": 0, "income": 0, "expense": 0, "topCategories": [] } }`.
- Erros: `{ "statusCode": 400, "message": "...", "error": "..." }`; validações podem retornar uma lista em `message`.
- Status: criação 201, consulta/edição/exclusão/login 200, validação 400, autenticação 401, recurso indisponível 404 e conflito 409. Exclusão retorna `{ "data": null }`.

## Publicação no Railway e na Vercel

### API e PostgreSQL — Railway

1. Criar um projeto com PostgreSQL e um serviço `api` vinculado a este repositório, branch `master`. O ambiente publicado utiliza PostgreSQL 18, versão provisionada pelo Railway; o desenvolvimento e a CI usam PostgreSQL 17.
2. Manter a raiz do serviço na raiz do repositório e configurar no serviço: Dockerfile `backend/Dockerfile`, pre-deploy `npm run db:deploy`, inicialização `npm run start -w backend`, healthcheck `/api/health` e timeout de 120 segundos. O campo `builder` permanece `RAILPACK`; a presença do caminho do Dockerfile seleciona o build Docker. `DOCKERFILE` não é um valor válido para esse campo.
3. Configurar `DATABASE_URL` pela referência ao banco, `JWT_SECRET` aleatório, `JWT_EXPIRES_IN_SECONDS=3600` e `FRONTEND_URL` com a origem pública da Vercel. Para o primeiro deploy, pode usar temporariamente a origem local, ajustando antes da validação pública.
4. Gerar domínio público para a API e verificar `/api/health`.
5. Executar `npm run db:seed` uma vez dentro do serviço para disponibilizar a demonstração. Se não houver acesso remoto por SSH, a conta e os mesmos dados demonstrativos podem ser criados pelas rotas autenticadas da API; essa foi a forma usada na publicação inicial.

O container roda como usuário sem privilégios. O build não usa nem incorpora arquivos `.env`. O banco de desenvolvimento e o banco de testes não devem ser os de produção.

O projeto publicado é [fintech-expenses-challenge no Railway](https://railway.com/project/a17c3539-01a7-4c47-a225-02a7f7332f1a), com os serviços `api` e `Postgres`. A API usa a conexão privada do banco. O CORS está configurado para `https://fintech-expenses-challenge-two.vercel.app`.

O Railway marcou `railway.json` como configuração legada e rejeita novos vínculos por esse formato. Na publicação atual, os campos acima foram aplicados diretamente ao serviço pelo CLI/API e verificados. O arquivo é mantido como referência; ao reproduzir a infraestrutura, configurar esses campos explicitamente ou usar o formato IaC atual, em vez de assumir a aplicação automática do JSON.

### Frontend — Vercel

1. Importar este repositório e selecionar `frontend` como Root Directory, com preset Vite e Node 22.
2. Usar os comandos versionados em `frontend/vercel.json`: instalação `npm ci --prefix ..`, build `npm run build` e saída `dist`, executados a partir de `frontend`. Permitir acesso aos arquivos do workspace fora da Root Directory.
3. Definir `VITE_API_URL=https://api-production-78eb2bd5.up.railway.app/api` e publicar. `frontend/vercel.json` encaminha as rotas da SPA para `index.html`.
4. Atualizar `FRONTEND_URL` do Railway para a origem exata publicada e fazer redeploy da API.
5. Validar cadastro, login, categorias, transações, filtros, indicadores e acesso direto a `/transactions` por HTTPS. Atualizar os links no início deste README.

A publicação foi feita pelo Vercel CLI. A conexão automática do repositório GitHub não foi autorizada pela integração da conta; isso não impede o deploy público. Para publicar alterações manualmente, na raiz do repositório:

```powershell
vercel login
vercel link --yes --scope marcelomenolis-projects --project fintech-expenses-challenge
vercel deploy --prod --yes --scope marcelomenolis-projects
```

O arquivo `.vercelignore` exclui `.env` locais, dependências, artefatos de testes e arquivos das ferramentas. Antes do primeiro upload, a lista de arquivos foi verificada com `vercel deploy --dry --json`.

### Estado da entrega

API e PostgreSQL publicados no Railway em 18/11/2026, com migrations aplicadas e conta demonstrativa populada. Foram verificados por HTTPS: healthcheck, login JWT, usuário autenticado, bloqueio sem token (401), CRUD de transações, filtros combinados, atualização do dashboard e bloqueio de exclusão de categoria vinculada (409). Os registros temporários dessa validação foram removidos.

Frontend publicado na Vercel e CORS da API atualizado em 18/11/2026. Os dois testes de produção passaram nas URLs públicas: fluxo desktop com cadastro, CRUD, filtros, paginação, dashboard, isolamento entre contas e sessão; fluxo mobile com conta demonstrativa, responsividade, navegação e rotas diretas. As capturas de tela foram revisadas. A aplicação está disponível para avaliação sem exigir login na Vercel.

## Limitações conhecidas

- BRL como única moeda; sem transferências, recorrências ou recuperação de senha.
- Token em memória: recarregar a página encerra a sessão; sem refresh token neste MVP.
- A conta demonstrativa é compartilhada. Dados de outras contas continuam isolados.
- A auditoria de dependências de execução foi verificada após a atualização do Prisma. Há alertas transitivos nas ferramentas de desenvolvimento, incluindo a cadeia de glob de Jest/Vite; não foi aplicado `audit fix --force` nem substituições de versões sem compatibilidade verificada. Reavaliar as correções disponíveis antes de expandir o projeto.
- Não há fluxos de administração de usuários nem endurecimento adicional de uma plataforma financeira de produção, como auditoria de alterações ou recuperação de contas.
