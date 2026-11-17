# Gest?o financeira corporativa

MVP do desafio t?cnico NestJS + React: autentica??o, categorias, transa??es e dashboard com dados isolados por usu?rio.

## Estado atual

Estrutura inicial de backend e frontend. As funcionalidades de neg?cio ser?o implementadas nos pr?ximos commits; esta vers?o ainda n?o ? a entrega final do desafio.

## Stack e decis?es

- NestJS com TypeScript strict e m?dulos separados por responsabilidade.
- React com TypeScript, Vite e React Router, usando componentes funcionais.
- TanStack Query para estado remoto: cache, consultas e invalida??o ap?s altera??es. A autentica??o usar? Context API.
- PostgreSQL e Prisma para persist?ncia com migrations versionadas.
- npm workspaces para instalar e executar as duas aplica??es pela raiz.

## Pr?-requisitos

- Node.js 22.14 ou superior na linha 22 e npm 10 ou superior.
- PostgreSQL 17, local ou via Docker Desktop, para a etapa de banco.

## Desenvolvimento local

Na raiz do projeto:

```powershell
npm ci
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Em terminais separados:

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- Verifica??o da API: `GET http://localhost:3000/api/health`

## Verifica??es

```powershell
npm run lint
npm run typecheck
npm run build
```

## Roteiro e entrega

Consulte [PASSO_A_PASSO.md](PASSO_A_PASSO.md). O prazo de trabalho foi concentrado em dois dias: backend e testes no primeiro; interface, deploy e documenta??o no segundo.

Reposit?rio p?blico, deploy e testes de neg?cio ainda pendentes. Os links e credenciais de demonstra??o ser?o documentados quando estiverem dispon?veis.
