# Meu Baba API

API REST em TypeScript com NestJS, TypeORM, PostgreSQL/SQLite e autenticacao JWT.

## Como executar

Requer Node.js 20 ou superior.

    npm install
    npm run start:dev

Para compilar e executar a versao de producao:

    npm run build
    npm start

A API estara disponivel em http://localhost:3000/api.

Defina JWT_SECRET antes de publicar a aplicacao. O valor padrao existe somente para desenvolvimento.

## Primeiro usuario

As rotas de users e todas as mutacoes de players exigem autenticacao. Para iniciar um banco vazio, crie o primeiro usuario pelo script local.

No PowerShell:

    $env:INITIAL_USER_NAME="Administrador"
    $env:INITIAL_USER_USERNAME="admin"
    $env:INITIAL_USER_PASSWORD="uma-senha-segura"
    npm run seed:user

Essas variaveis sao usadas localmente e a senha e armazenada somente como hash.

## Login

Rota publica:

- POST /api/auth/login

Corpo:

    {
      "username": "admin",
      "password": "uma-senha-segura"
    }

A resposta inclui accessToken. Envie o token nas demais requisicoes:

    Authorization: Bearer SEU_TOKEN

O status GET /api e as leituras GET de players sao publicos. As rotas de users e as mutacoes de players retornam 401 sem um token valido.

## User

User representa uma pessoa que acessa o sistema:

    {
      "name": "Gabriel Silva",
      "username": "gabriel",
      "password": "strong-password",
      "role": "ADMIN"
    }

Rotas protegidas:

- POST /api/users
- GET /api/users
- GET /api/users/:id
- PATCH /api/users/:id
- DELETE /api/users/:id

A senha aceita entre 8 e 72 caracteres, sempre e armazenada como hash e nunca aparece nas respostas. role aceita ADMIN ou USER, aparece nas respostas e tambem e incluido no login e no JWT. Usuarios existentes recebem ADMIN quando a coluna e criada; novos usuarios exigem a escolha do perfil. Nesta etapa, os dois perfis possuem as mesmas permissoes.

## Player

Player representa um jogador ou participante do sorteio:

    {
      "name": "Joao Souza",
      "nickname": "Joaosinho",
      "jerseyNumber": 10,
      "jerseySize": "L",
      "photoUrl": "https://example.com/players/joao.jpg",
      "position": "OUTFIELD",
      "type": "MEMBER"
    }

Rotas publicas:

- GET /api/players
- GET /api/players/:id

Rotas protegidas:

- POST /api/players
- PATCH /api/players/:id
- PATCH /api/players/:id/stats
- PATCH /api/players/:id/deactivate
- PATCH /api/players/:id/activate

Nao existe exclusao fisica de player. A inativacao define isActive como false e preenche deactivatedAt. A reativacao restaura isActive e limpa deactivatedAt.

A listagem ordena os ativos antes dos inativos. Dentro de cada grupo, a ordem e: goleiros, mensalistas (MEMBER) e convidados (GUEST).

Campos obrigatorios:

- name
- position: GOALKEEPER ou OUTFIELD
- type: deve ser null para GOALKEEPER e MEMBER ou GUEST para OUTFIELD

Campos opcionais, que tambem aceitam null:

- nickname
- jerseyNumber: numero inteiro entre 1 e 999, unico quando informado
- jerseySize: XS, S, M, L, XL ou XXL
- photoUrl: URL HTTP ou HTTPS

Na inicializacao, players existentes sao migrados automaticamente: jogadores de linha recebem MEMBER e goleiros recebem null.

Gols e assistências sao totais acumulados, iniciam em zero e aparecem nas listagens publicas. Para definir um ou ambos os valores:

    PATCH /api/players/:id/stats

    {
      "goals": 7,
      "assists": 3
    }

Os valores devem ser inteiros entre 0 e 1000000. A rota exige autenticacao.

## Settings

Settings representa a configuracao unica usada pelo sorteio. As duas rotas sao protegidas por JWT:

- GET /api/settings
- PUT /api/settings

O GET responde com 404 enquanto a configuracao ainda nao tiver sido criada. O PUT cria ou substitui a configuracao atual.

Exemplo:

    {
      "maxGuestsPerTeam": 2,
      "outfieldPlayersPerTeam": 5,
      "playerGroups": [
        {
          "playerIds": [
            "primeiro-player-uuid",
            "segundo-player-uuid"
          ]
        }
      ]
    }

Cada grupo exige pelo menos dois players ativos. Um player nao pode aparecer mais de uma vez nem participar de grupos diferentes. Todos os IDs precisam existir. playerGroups e retornado nas respostas autenticadas de GET e PUT para permitir visualizar, editar e remover agrupamentos. O sorteio continua carregando essa configuracao internamente.

## Draws

Todas as rotas de sorteio exigem JWT:

- POST /api/draws
- GET /api/draws/:id
- GET /api/events/:eventId/draws/latest

Exemplo de criacao:

    {
      "eventId": "uuid-v4-do-evento",
      "maxOutfieldPlayersPerTeam": 5,
      "participants": [
        {
          "playerId": "uuid-v4-do-player",
          "type": "MEMBER",
          "isLateArrival": false
        },
        {
          "name": "Convidado Victor",
          "type": "GUEST",
          "isLateArrival": true
        }
      ]
    }

O sorteio usa maxOutfieldPlayersPerTeam do payload. O outfieldPlayersPerTeam de settings e somente um default para a interface. maxGuestsPerTeam e playerGroups sao carregados internamente.

Para um player cadastrado, position e type sao obtidos do cadastro; se type for enviado no payload, ele precisa coincidir com o valor salvo. Convidados manuais exigem name e type GUEST.

Goleiros usam type null, nao ocupam vaga de linha e aparecem primeiro no time. Players OUTFIELD MEMBER e OUTFIELD GUEST ocupam vaga de linha. Tanto convidados cadastrados quanto manuais respeitam maxGuestsPerTeam. Atrasados sao direcionados preferencialmente ao ultimo time. Somente participantes enviados entram no sorteio.

Os resultados ficam persistidos nas tabelas draws, draw_teams e draw_team_players, incluindo convidados e isLateArrival.

## Banco de dados

Com DATABASE_URL, a API usa PostgreSQL. Sem essa variavel, usa SQLite local em data/meu-baba.sqlite. O TypeORM cria as tabelas users, players, settings, draws, draw_teams e draw_team_players automaticamente.

## Testes

    npm test

## Deploy na Vercel

A aplicacao usa PostgreSQL quando DATABASE_URL esta configurada e mantem SQLite apenas para desenvolvimento e testes locais.

Configure em Project Settings > Environment Variables:

- DATABASE_URL: string de conexao PostgreSQL
- JWT_SECRET: segredo forte e exclusivo da aplicacao
- DATABASE_SSL: opcional; use false somente se o provedor PostgreSQL nao aceitar SSL

O arquivo vercel.json executa npm run build. A Vercel detecta src/main.ts como o entrypoint NestJS. Com DATABASE_URL presente, a aplicacao nao tenta criar nem gravar a pasta data.

Na configuracao atual, synchronize esta habilitado para criar as tabelas automaticamente. Antes de evoluir um banco de producao com dados importantes, substitua synchronize por migrations versionadas.

## Migrar players para producao

A migracao le o SQLite local e preserva os UUIDs ao inserir ou atualizar players no PostgreSQL.

Primeiro, execute a simulacao, que nao abre conexao com producao:

    npm run migrate:players

Depois configure a URL do banco Neon apenas na sessao atual do PowerShell e execute a migracao:

    $env:PRODUCTION_DATABASE_URL="postgresql://..."
    npm run migrate:players -- --execute

Por padrao, a origem e data/meu-baba.sqlite. Para usar outro arquivo:

    $env:SQLITE_DATABASE_PATH="C:/caminho/outro.sqlite"
    npm run migrate:players

A operacao preserva tambem goals e assists e usa uma transacao unica. Qualquer conflito, inclusive jerseyNumber duplicado em outro UUID, cancela toda a importacao.
