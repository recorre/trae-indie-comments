# Documentação Oficial: NoCodeBackend

## 1. Visão Geral e Criação de APIs com IA

O NoCodeBackend é uma plataforma que permite a criação de bancos de dados e a geração automática de APIs (Application Programming Interfaces) sem a necessidade de escrever código.

### 1.1 Criação Rápida de Bancos de Dados via IA

A funcionalidade principal do NoCodeBackend é a utilização de um **Agente de IA (AI Agentic Call)** para configurar um banco de dados completo.

| Passo | Descrição |
| :--- | :--- |
| **1. Acesso** | No painel principal, utilize a opção de **"Usar IA para configurar o banco de dados"** (Setup Database using AI). |
| **2. Prompt** | Insira uma descrição em linguagem natural do banco de dados que você deseja. |
| **3. Geração** | Em um único clique, a IA irá gerar: **O esquema do banco de dados**, **as tabelas necessárias** e **todos os Endpoints de API (CRUD)** para as operações de Leitura, Criação, Atualização e Exclusão. |
| **4. Documentação**| A documentação dos endpoints da API também é gerada automaticamente. |

## 2. Gerenciamento de Dados e Integração Frontend

Esta seção detalha o processo de criação de um banco de dados e sua integração com uma aplicação frontend (ex: usando uma ferramenta como Greta).

### 2.1 Exemplo: Criando um Banco de Dados de Livros (`bookDB`)

1.  **Criação da Base de Dados:** Inicie o processo de criação do banco de dados, nomeando-o (ex: `bookDB`).
2.  **Definição do Esquema:** Defina as colunas essenciais para a tabela de Livros:
    * `book name` (Varchar)
    * `author` (Varchar)
    * `price` (Integer)
    * `image` (Varchar - para a URL da imagem/capa)
3.  **Geração de Endpoints:** O NoCodeBackend gera imediatamente todos os endpoints de API (GET, POST, PUT, DELETE) para esta tabela.
4.  **Integração Frontend:**
    * Utilize uma ferramenta de *frontend* (como o Greta) para criar o visual da aplicação (ex: um formulário para adicionar novos livros).
    * Conecte o formulário ao endpoint `POST` do NoCodeBackend para persistir os dados no banco.
    * Conecte a listagem de livros ao endpoint `GET` para buscar e exibir os dados armazenados.

## 3. Autenticação de Usuários

O NoCodeBackend simplifica a criação de um sistema completo de gerenciamento de usuários, incluindo Sign Up (cadastro), Sign In (login) e funcionalidades de reset de senha.

### 3.1 Sign Up, Sign In e Sign Out

O sistema de autenticação é criado integrando formulários *frontend* diretamente aos endpoints de autenticação gerados pelo NoCodeBackend.

| Funcionalidade | Endpoint Utilizado (Exemplo) | Ação de Integração |
| :--- | :--- | :--- |
| **Cadastro (Sign Up)** | `/auth/signup` | O formulário envia credenciais para este endpoint para criar um novo usuário. |
| **Login (Sign In)** | `/auth/signin` | O formulário envia credenciais para este endpoint para autenticar o usuário e gerar um token de sessão. |
| **Logout (Sign Out)**| Não é um endpoint, mas uma ação *frontend* | Simplesmente limpa o token de sessão armazenado no navegador ou no *frontend*. |

### 3.2 Implementação de Reset de Senha (Esqueci a Senha)

O NoCodeBackend oferece um recurso simplificado para enviar e-mails de reset de senha, eliminando a necessidade de serviços de *backend* customizados (como SMTP e JWT).

1.  **Acesso ao Gerador:** Utilize a interface do NoCodeBackend dedicada à funcionalidade de reset de senha.
2.  **Configurações Necessárias:**
    * Informe a **URL da Página de Reset de Senha** no seu *frontend* (para onde o usuário será redirecionado pelo link do e-mail).
    * Forneça o Nome da Aplicação e a URL do Logotipo (para customizar o e-mail).
3.  **Geração de Blocos de Código:** A ferramenta gera dois blocos de código essenciais que devem ser implementados no seu *frontend*:
    * **Código 1 (Enviar Email de Reset):** Usado para disparar o envio do e-mail contendo o *link* e o *token* de reset.
    * **Código 2 (Atualizar Senha):** Usado na página de reset final (*frontend URL* fornecida no passo 2), para atualizar o banco de dados com a nova senha, utilizando o *token* de segurança.

## 4. Segurança: Chaves Secretas com Escopo (Scoped Secret Keys)

O NoCodeBackend permite criar múltiplas chaves de API (`Secret Keys`) com permissões específicas, melhorando a segurança e o controle de acesso.

| Tipo de Escopo | Descrição | Restrições de Ação |
| :--- | :--- | :--- |
| **Escopo Global**| A chave tem acesso a **todas as tabelas** do banco de dados. | Você define as ações permitidas (ex: apenas `Read`, ou `Read` e `Write`). Se for configurada apenas para `Read`, ela não poderá criar, atualizar ou deletar registros em **nenhuma** tabela. |
| **Escopo de Tabela**| Permite o controle mais granular. | Você define exatamente **quais tabelas** a chave pode acessar e **quais ações (Read, Write, Update, Delete)** são permitidas para cada endpoint daquela tabela. |

### 4.1 Como Criar uma Chave com Escopo

1.  Acesse a seção de **Chaves Secretas** da sua base de dados.
2.  Clique em **"Criar nova chave"**.
3.  Defina um nome para a chave.
4.  Selecione o **Tipo de Escopo** desejado (Global ou de Tabela) e configure as permissões de ação.
5.  A chave gerada só poderá executar as ações e acessar as tabelas para as quais foi explicitamente autorizada.