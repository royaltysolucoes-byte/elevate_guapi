# Elevate Control

Sistema de gerenciamento para administração de TI empresarial.

## 🚀 Características

- **Autenticação**: Login seguro com JWT tokens
- **Gestão de Usuários**: Criação e gerenciamento de usuários com níveis de acesso
- **Dashboard**: Visualização de estatísticas e métricas
- **Perfil do Usuário**: Edição de perfil e alteração de senha
- **Interface Moderna**: Design limpo e responsivo com tema dark

## 🛠️ Tecnologias

- **Next.js 14+** - Framework React
- **TypeScript** - Tipagem estática
- **MongoDB** - Banco de dados NoSQL
- **Tailwind CSS** - Estilização
- **bcryptjs** - Hash de senhas
- **jose** - Tokens JWT

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta MongoDB (cloud ou local)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd elevate_control
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente (crie um arquivo `.env.local`):
```bash
# MongoDB Connection
MONGODB_URI=sua-string-de-conexao-mongodb-aqui

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Encryption Key for storing passwords (64 hex characters or any string)
ENCRYPTION_KEY=your-encryption-key-for-storing-passwords-change-in-production
```

⚠️ **IMPORTANTE**: Altere todas as chaves em produção! A chave `ENCRYPTION_KEY` deve ser mantida em segredo para que as senhas criptografadas possam ser descriptografadas.

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse `http://localhost:3000`

## 👤 Credenciais Padrão

O usuário administrador padrão já foi criado:

- **Usuário**: `admin`
- **Senha**: `admin123`

⚠️ **Importante**: Alterar a senha após o primeiro acesso em produção!

## 📝 Estrutura do Projeto

```
elevate_control/
├── app/
│   ├── api/           # API Routes
│   │   ├── auth/      # Autenticação
│   │   ├── users/     # Gestão de usuários
│   │   └── categorias/ # Gestão de categorias (Parâmetros)
│   ├── (protected)/   # Rotas protegidas
│   │   └── dashboard/ # Dashboard e páginas internas
│   ├── layout.tsx     # Layout principal
│   ├── page.tsx       # Página de login
│   └── globals.css    # Estilos globais
├── lib/
│   ├── models/        # Modelos do MongoDB
│   │   ├── User.ts    # Modelo de usuário
│   │   └── Categoria.ts # Modelo de categoria
│   ├── db.ts          # Conexão com o banco
│   └── auth.ts        # Utilidades de autenticação
└── README.md
```

## 🔐 Funcionalidades de Segurança

- Hash de senhas de usuários com bcrypt (10 rounds)
- **Criptografia AES-256-CBC** para senhas de equipamentos (Emails e Senhas)
- Tokens JWT com expiração de 7 dias
- Cookies HTTP-only para armazenar tokens
- Validação de autenticação em rotas protegidas
- Níveis de acesso (Admin/Analista/Suporte)
- Controle de acesso granular por usuário

## 📊 Dashboard

O dashboard fornece:

- Total de usuários cadastrados
- Usuários ativos
- Estatísticas de administradores
- Acesso rápido às principais funcionalidades

## 👥 Gestão de Usuários

Funcionalidades disponíveis:

- Listar todos os usuários
- Criar novos usuários
- Definir nível de acesso (Admin/Usuário)
- Excluir usuários
- Visualizar data de criação e última atualização

## ⚙️ Perfil do Usuário

Opções disponíveis:

- Editar nome completo
- Alterar senha
- Visualizar informações da conta
- Ver tipo de usuário

## 🎨 Design

O sistema utiliza um design moderno inspirado em interfaces profissionais:

- **Paleta de cores**: Dark gray (#282c34) + Green accent (#4CAF50)
- **Tipografia**: Geist Sans (Vercel)
- **Layout**: Sidebar fixa + conteúdo principal
- **Responsivo**: Adapta-se a diferentes tamanhos de tela

## 🚀 Deploy

Para produção (especialmente na Vercel), configure:

1. **Variáveis de ambiente seguras** na Vercel:
   - `MONGODB_URI`: Sua string de conexão MongoDB
   - `JWT_SECRET`: Uma string aleatória forte para autenticação JWT
   - `ENCRYPTION_KEY`: Uma chave de 64 caracteres hex ou qualquer string (mantenha em segredo!)

2. **⚠️ IMPORTANTE PARA SEGURANÇA**:
   - Gere uma chave `ENCRYPTION_KEY` forte e única em produção
   - NUNCA compartilhe ou publique essa chave
   - Se você perder essa chave, NÃO poderá descriptografar senhas existentes
   - A chave deve ser a mesma entre deploys para preservar dados criptografados

3. HTTPS e SSL certificados (automático na Vercel)

4. Backup automático do MongoDB

5. Rate limiting nas APIs (opcional)

Para gerar uma chave segura, execute no Node.js:
```javascript
require('crypto').randomBytes(32).toString('hex')
```

## 📄 Licença

Este projeto foi desenvolvido como solução de gestão empresarial.

## 👨‍💻 Desenvolvedor

Desenvolvido por Felipe Duarte como sistema de consultoria em TI.

---

© 2025 Elevate Control - Sistema de Gestão de TI
