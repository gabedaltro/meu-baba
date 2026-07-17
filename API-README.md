# Meu Baba API

API REST em TypeScript com NestJS, TypeORM, SQLite e autenticacao JWT.

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
      "password": "strong-password"
    }

Rotas protegidas:

- POST /api/users
- GET /api/users
- GET /api/users/:id
- PATCH /api/users/:id
- DELETE /api/users/:id

A senha aceita entre 8 e 72 caracteres, sempre e armazenada como hash e nunca aparece nas respostas.

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

O SQLite cria automaticamente as tabelas users, players, settings, draws, draw_teams e draw_team_players em data/meu-baba.sqlite.

## Testes

    npm test
