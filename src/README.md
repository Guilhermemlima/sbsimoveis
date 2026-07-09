# 📁 Estrutura do Src - SBS Imóveis

## Visão Geral

```
src/
├── app/              # Pages e API routes (Next.js App Router)
├── components/       # Componentes React reutilizáveis
├── lib/             # Utilitários, configs e integrações
├── types/           # Definições TypeScript
├── hooks/           # React hooks customizados
└── store/           # Gerenciamento de estado (Zustand)
```

---

## 📄 app/ - Páginas e Rotas

### Estrutura
```
app/
├── layout.tsx              # Layout raiz (Header + Footer)
├── page.tsx                # Homepage
├── globals.css             # Estilos globais
│
├── api/                    # API Routes (a implementar)
│   ├── auth/
│   ├── properties/
│   ├── leads/
│   ├── sales/
│   └── users/
│
├── public/                 # Páginas públicas
│   ├── imoveis/
│   │   └── page.tsx        # Listagem de imóveis
│   ├── imoveis/[id]/       # Detalhe do imóvel (a fazer)
│   ├── sobre/
│   │   └── page.tsx        # Página sobre
│   └── contato/
│       └── page.tsx        # Contato
│
├── auth/                   # Páginas de autenticação
│   ├── login/
│   │   └── page.tsx        # Página de login
│   └── signup/
│       └── page.tsx        # Página de cadastro
│
├── client/                 # Área do cliente
│   ├── layout.tsx          # Layout protegido
│   ├── dashboard/
│   │   └── page.tsx        # Dashboard cliente
│   ├── favorites/          # Imóveis favoritos (a fazer)
│   ├── proposals/          # Propostas (a fazer)
│   ├── profile/            # Perfil (a fazer)
│   └── preferences/        # Preferências (a fazer)
│
├── realtor/                # Área do corretor
│   ├── layout.tsx          # Layout protegido
│   ├── dashboard/
│   │   └── page.tsx        # Dashboard corretor
│   ├── properties/         # Meus imóveis (a fazer)
│   ├── properties/new/     # Novo imóvel (a fazer)
│   ├── leads/              # Leads (a fazer)
│   ├── sales/              # Vendas (a fazer)
│   ├── commissions/        # Comissões (a fazer)
│   ├── reports/            # Relatórios (a fazer)
│   └── profile/            # Perfil (a fazer)
│
└── admin/                  # Área administrativa
    ├── layout.tsx          # Layout protegido
    ├── dashboard/
    │   └── page.tsx        # Dashboard admin
    ├── properties/         # Gestão de imóveis (a fazer)
    ├── realtors/          # Gestão de corretores (a fazer)
    ├── clients/           # Gestão de clientes (a fazer)
    ├── sales/             # Gestão de vendas (a fazer)
    ├── carousel/          # Config carrossel (a fazer)
    ├── reports/           # Relatórios (a fazer)
    ├── settings/          # Configurações (a fazer)
    └── users/             # Gestão de usuários (a fazer)
```

### Padrão de Paginas
```typescript
// Cada página segue o padrão:
export default function PageName() {
  return (
    <div>
      {/* Conteúdo */}
    </div>
  );
}
```

---

## 🧩 components/ - Componentes

### Estrutura
```
components/
├── common/                 # Componentes globais
│   ├── Header.tsx         # Menu principal
│   ├── Footer.tsx         # Rodapé
│   ├── Sidebar.tsx        # Sidebar (a fazer)
│   ├── Loading.tsx        # Loader (a fazer)
│   └── ErrorBoundary.tsx  # Error handling (a fazer)
│
├── public/                # Componentes públicos
│   ├── PropertyCard.tsx   # Card de imóvel
│   ├── OpportunitiesCarousel.tsx  # Carrossel
│   ├── SearchBar.tsx      # Busca (a fazer)
│   └── FilterPanel.tsx    # Filtros (a fazer)
│
├── client/                # Componentes do cliente
│   ├── FavoritesList.tsx  # Lista favoritos (a fazer)
│   ├── ProposalList.tsx   # Lista propostas (a fazer)
│   └── ProfileForm.tsx    # Form perfil (a fazer)
│
├── realtor/               # Componentes do corretor
│   ├── PropertyForm.tsx   # Form imóvel (a fazer)
│   ├── LeadsList.tsx      # Lista leads (a fazer)
│   ├── SalesChart.tsx     # Gráfico vendas (a fazer)
│   └── CommissionTable.tsx # Tabela comissões (a fazer)
│
├── admin/                 # Componentes admin
│   ├── UserManagement.tsx # Gestão usuários (a fazer)
│   ├── AnalyticsDashboard.tsx # Dashboard análitico (a fazer)
│   └── ReportGenerator.tsx # Gerador relatórios (a fazer)
│
├── forms/                 # Componentes de formulário
│   ├── PropertyForm.tsx   # Form imóvel (a fazer)
│   ├── LoginForm.tsx      # Form login (a fazer)
│   └── ContactForm.tsx    # Form contato (a fazer)
│
└── charts/                # Componentes de gráficos
    ├── SalesChart.tsx     # Gráfico vendas (a fazer)
    ├── RevenueChart.tsx   # Gráfico receita (a fazer)
    └── ConversionChart.tsx # Gráfico conversão (a fazer)
```

### Padrão de Componente
```typescript
interface ComponentProps {
  // Props aqui
}

export default function Component({ prop }: ComponentProps) {
  return (
    <div>
      {/* Conteúdo */}
    </div>
  );
}
```

---

## 📚 lib/ - Utilitários e Integrações

### Estrutura
```
lib/
├── auth/
│   ├── auth.config.ts     # Configuração NextAuth
│   ├── middleware.ts      # Middleware de auth (a fazer)
│   └── permissions.ts     # Verificação permissões (a fazer)
│
├── db/
│   ├── supabase.ts        # Cliente Supabase
│   ├── user.queries.ts    # Queries de usuário (a fazer)
│   ├── property.queries.ts # Queries de imóvel (a fazer)
│   └── sale.queries.ts    # Queries de venda (a fazer)
│
├── validations/
│   ├── auth.validation.ts # Schemas Zod (a fazer)
│   ├── property.validation.ts # Schemas (a fazer)
│   └── form.validation.ts # Validações gerais (a fazer)
│
├── utils/
│   ├── helpers.ts         # Funções auxiliares (a fazer)
│   ├── formatters.ts      # Formatação de dados (a fazer)
│   └── api.ts             # Chamadas API (a fazer)
│
└── constants.ts           # Constantes globais (✅ Criado)
```

### Exemplos de Uso

**Constants:**
```typescript
import { APP_CONFIG, PROPERTY_TYPES } from '@/lib/constants';

console.log(APP_CONFIG.name); // 'SBS Imóveis'
```

**Supabase:**
```typescript
import { supabase } from '@/lib/db/supabase';

const { data, error } = await supabase
  .from('properties')
  .select('*');
```

---

## 🎯 types/ - Definições TypeScript

### Arquivo
```
types/
└── index.ts     # Todas as definições (✅ Criado)
```

### Categorias de Types
```typescript
// User Types
User, Realtor, Client, UserRole

// Property Types
Property, PropertyType, PropertyStatus, PropertyImage, PropertyFilters

// Lead Types
Lead, LeadStatus, LeadSource, LeadInteraction

// Transaction Types
Sale, Proposal, Favorite

// Settings
AppSettings, DashboardStats, SalesReport

// Filter Types
PropertyFilters
```

### Exemplo
```typescript
import type { Property, User } from '@/types';

const property: Property = {
  id: '123',
  title: 'Casa bonita',
  // ... outros campos
};
```

---

## 🪝 hooks/ - React Hooks Customizados

### Estrutura (a fazer)
```
hooks/
├── useAuth.ts          # Hook de autenticação
├── useProperty.ts      # Hook para imóveis
├── useLead.ts          # Hook para leads
├── useSale.ts          # Hook para vendas
├── useFilter.ts        # Hook de filtros
└── usePagination.ts    # Hook de paginação
```

### Exemplo
```typescript
// hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  // ... logic
  return { user, login, logout };
}
```

---

## 🏪 store/ - Zustand State Management

### Estrutura (a fazer)
```
store/
├── authStore.ts        # Estado de autenticação
├── propertyStore.ts    # Estado de imóveis
├── uiStore.ts          # Estado da UI
└── filterStore.ts      # Estado de filtros
```

### Exemplo
```typescript
// store/authStore.ts
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  login: (email) => { /* ... */ },
  logout: () => set({ user: null }),
}));
```

---

## 📏 Convenções de Código

### Nomes de Arquivo
- Componentes: `PascalCase.tsx`
  - ✅ `PropertyCard.tsx`
  - ✅ `OpportunitiesCarousel.tsx`
- Funções/Utils: `camelCase.ts`
  - ✅ `helpers.ts`
  - ✅ `formatters.ts`
- Types: `index.ts`
  - ✅ `types/index.ts`

### Imports
```typescript
// Ordenar imports:
// 1. React/Next
import { useState } from 'react';
import Link from 'next/link';

// 2. Dependências externas
import { Button } from 'react-ui';

// 3. Imports locais
import { APP_CONFIG } from '@/lib/constants';
import type { Property } from '@/types';
import PropertyCard from '@/components/public/PropertyCard';
```

### Componentes
```typescript
// Sempre use 'use client' em componentes interativos
'use client';

interface ComponentProps {
  property: Property;
  onSelect?: (id: string) => void;
}

export default function ComponentName({ 
  property, 
  onSelect 
}: ComponentProps) {
  return <div>{/* ... */}</div>;
}
```

---

## 🔄 Fluxo de Dados

```
App User
   ↓
Pages (src/app/*)
   ↓
Components (src/components/**)
   ↓
Hooks (src/hooks/*)
   ↓
Store (src/store/*)
   ↓
lib/ (constants, utils, db)
   ↓
Supabase API ↔ PostgreSQL
```

---

## 🚀 Próximos Passos

1. **Implementar Hooks**
   - [ ] useAuth - Autenticação
   - [ ] useProperty - Gerenciar imóveis
   - [ ] useLead - Gerenciar leads

2. **Implementar Store**
   - [ ] authStore - Autenticação
   - [ ] propertyStore - Imóveis
   - [ ] uiStore - UI state

3. **Implementar Queries**
   - [ ] user.queries.ts
   - [ ] property.queries.ts
   - [ ] sale.queries.ts

4. **Adicionar Validações**
   - [ ] auth.validation.ts
   - [ ] property.validation.ts

5. **Criar Componentes Faltando**
   - [ ] Formulários
   - [ ] Tabelas
   - [ ] Modais
   - [ ] Gráficos dinâmicos

---

## 📞 Referências

- Next.js Docs: https://nextjs.org/docs
- Tailwind Docs: https://tailwindcss.com/docs
- TypeScript Docs: https://www.typescriptlang.org/docs
- Supabase Docs: https://supabase.com/docs
- Recharts Docs: https://recharts.org

---

**Desenvolvido com ❤️**  
**SBS Imóveis © 2024**
