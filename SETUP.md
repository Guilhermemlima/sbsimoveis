# 🚀 Guia de Setup - SBS Imóveis

## Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase (gratuita em supabase.com)
- Git

## 📋 Passo a Passo

### 1. Criar Conta Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub ou email
4. Crie um novo projeto
5. Aguarde o projeto ser criado (leva alguns minutos)

### 2. Obter Credenciais

1. Na dashboard do Supabase, vá para **Settings → API**
2. Copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.local.example .env.local

# Edite .env.local e adicione suas credenciais
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=suas-chaves-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-key-aqui
NEXTAUTH_SECRET=gere-uma-string-aleatoria
NEXTAUTH_URL=http://localhost:3000
```

### 4. Gerar NEXTAUTH_SECRET

```bash
# No terminal
openssl rand -base64 32

# Ou use este comando para gerar
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Criar Banco de Dados

**Opção A: Execução Manual (Recomendado)**

1. Abra o SQL Editor no Supabase
2. Copie todo o conteúdo de `scripts/schema.sql`
3. Cole no SQL Editor
4. Clique em "Run"

**Opção B: Via Script**

```bash
# Instale o Supabase CLI
npm install -g supabase

# Faça login
supabase login

# Execute as migrações
supabase db push
```

### 6. Instalar Dependências

```bash
npm install
# ou
yarn install
```

### 7. Executar Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🧪 Testar o Projeto

### Teste Área Pública
- Homepage: [http://localhost:3000](http://localhost:3000)
- Listagem de imóveis: [http://localhost:3000/imoveis](http://localhost:3000/imoveis)

### Teste Autenticação
- Login: [http://localhost:3000/login](http://localhost:3000/login)
- Signup: [http://localhost:3000/signup](http://localhost:3000/signup)

### Teste Dashboards
- Dashboard Cliente: [http://localhost:3000/client/dashboard](http://localhost:3000/client/dashboard)
- Dashboard Corretor: [http://localhost:3000/realtor/dashboard](http://localhost:3000/realtor/dashboard)
- Dashboard Admin: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)

## 📦 Build para Produção

```bash
npm run build
npm start
```

## 🌐 Deploy no Vercel

### Opção 1: Via CLI

```bash
npm i -g vercel
vercel
```

### Opção 2: Via GitHub

1. Faça push do código para GitHub
2. Vá para [vercel.com](https://vercel.com)
3. Importe o repositório
4. Configure as variáveis de ambiente
5. Deploy automático

### Configurar Variáveis no Vercel

No dashboard do Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://seu-dominio.vercel.app
```

## 🔧 Troubleshooting

### Erro: "Missing Supabase environment variables"

**Solução:** Verifique se as variáveis em `.env.local` estão corretas.

### Erro ao conectar ao Supabase

**Solução:** 
1. Verifique a URL e chaves
2. Certifique-se de que o projeto Supabase está ativo
3. Teste a conexão no Supabase Dashboard

### Banco de dados vazio

**Solução:** Reexecute o script `scripts/schema.sql` no SQL Editor

### NextAuth not working

**Solução:**
1. Verifique `NEXTAUTH_SECRET` está definido
2. Verifique `NEXTAUTH_URL` está correto
3. Limpe cache do navegador

## 📚 Documentação Adicional

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [NextAuth Docs](https://next-auth.js.org/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)

## 💬 Suporte

Para dúvidas ou reportar problemas, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para SBS Imóveis**
