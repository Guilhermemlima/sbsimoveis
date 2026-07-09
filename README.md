# SBS Imóveis - Plataforma Imobiliária Profissional

Uma plataforma completa e moderna para gerenciamento e venda de imóveis, desenvolvida com Next.js 14, TypeScript, Tailwind CSS e Supabase.

## 🎯 Funcionalidades

### Área Pública
- ✅ Homepage moderna com banner e busca rápida
- ✅ Listagem de imóveis com filtros avançados
- ✅ Carrossel de oportunidades automático
- ✅ Página individual de imóvel com galeria
- ✅ Mapa com localização
- ✅ Formulário de interesse

### Área do Cliente
- ✅ Cadastro e autenticação segura
- ✅ Painel do cliente
- ✅ Favoritar imóveis
- ✅ Histórico de visualizações
- ✅ Propostas de negociação

### Área do Corretor
- ✅ Dashboard com estatísticas
- ✅ Cadastro de imóveis
- ✅ Gerenciamento de leads
- ✅ Registro de vendas

### Área Administrativa
- ✅ Dashboard com gráficos
- ✅ Relatórios financeiros
- ✅ Gestão de corretores
- ✅ Carrossel de oportunidades

## 🚀 Quick Start

### 1. Setup Supabase
- Crie projeto em [supabase.com](https://supabase.com)
- Copie URL e chaves de API

### 2. Configurar .env.local
```bash
cp .env.local.example .env.local
# Editar com suas credenciais Supabase
```

### 3. Setup Banco de Dados
- Abra SQL Editor no Supabase
- Execute `scripts/schema.sql`

### 4. Instalar e rodar
```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura

```
src/
├── app/          # Pages (Next.js 14 App Router)
├── components/   # Componentes React
├── lib/          # Utilitários e integração
├── types/        # TypeScript definitions
└── store/        # State management
```

## 🛠️ Stack Técnico

- **Next.js 14** + TypeScript
- **Tailwind CSS** para styling
- **PostgreSQL** via Supabase
- **NextAuth** para autenticação
- **Recharts** para gráficos
- **Zustand** para estado global

## 📞 Deploy

```bash
vercel
```
