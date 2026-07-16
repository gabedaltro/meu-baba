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
      "position": "OUTFIELD"
    }

Rotas publicas:

- GET /api/players
- GET /api/players/:id

Rotas protegidas:

- POST /api/players
- PATCH /api/players/:id
- PATCH /api/players/:id/deactivate
- PATCH /api/players/:id/activate

Não existe exclusao fisica de player. A inativacao define isActive como false e preenche deactivatedAt. A reativacao restaura isActive e limpa deactivatedAt. A listagem inclui ativos e inativos, ordenando os ativos primeiro.

Campos obrigatorios:

- name
- position: GOALKEEPER ou OUTFIELD

Campos opcionais, que tambem aceitam null:

- nickname
- jerseyNumber: numero inteiro entre 1 e 999, unico quando informado
- jerseySize: XS, S, M, L, XL ou XXL
- photoUrl: URL HTTP ou HTTPS

## Banco de dados

O SQLite cria automaticamente as tabelas users e players em data/meu-baba.sqlite.

## Testes

    npm test


