# ⚡ Guia Rápido - Configurar Permissões

## 🎯 Caminho Mais Direto

### Opção 1: Via Menu Lateral (Mais Fácil)

```
1. https://developers.facebook.com/
   ↓
2. Clique em "Meus Apps" (canto superior direito)
   ↓
3. Selecione seu App na lista
   ↓
4. No MENU LATERAL ESQUERDO, procure por:
   📋 "Permissões e Recursos"
   ↓
5. Clique em "Permissões e Recursos"
   ↓
6. Você verá uma lista de permissões
   ↓
7. Use a BARRA DE BUSCA no topo
   ↓
8. Digite cada permissão e clique em "Adicionar":
   - pages_show_list
   - pages_read_engagement  
   - pages_manage_metadata
   - business_management
```

### Opção 2: Via Facebook Login

```
1. https://developers.facebook.com/
   ↓
2. Meus Apps → Seu App
   ↓
3. Menu lateral → "Produtos"
   ↓
4. Clique em "Facebook Login"
   ↓
5. No submenu, clique em "Configurações"
   ↓
6. Role a página até encontrar "Permissões e Recursos"
   ↓
7. Adicione as permissões usando a busca
```

## 🔍 Onde Está a Barra de Busca?

Na página de **Permissões e Recursos**, você verá:

```
┌─────────────────────────────────────────────┐
│ Permissões e Recursos                      │
├─────────────────────────────────────────────┤
│                                             │
│ 🔍 [Buscar permissões...]  ← DIGITE AQUI   │
│                                             │
│ Permissões Básicas:                        │
│ ✓ email                                    │
│ ✓ public_profile                           │
│                                             │
│ Permissões Avançadas:                      │
│ [Lista de permissões...]                   │
│                                             │
└─────────────────────────────────────────────┘
```

## 📝 Passo a Passo Detalhado

### 1. Acesse o Facebook Developers
- URL: https://developers.facebook.com/
- Faça login se necessário

### 2. Vá para Meus Apps
- Clique no botão **"Meus Apps"** no canto superior direito
- Ou no menu superior, se disponível

### 3. Selecione seu App
- Clique no nome do seu App na lista
- Se não tiver App, crie um primeiro

### 4. Encontre "Permissões e Recursos"
**Método A - Menu Lateral:**
- Olhe para o **menu lateral esquerdo**
- Procure por **"Permissões e Recursos"** ou **"Permissions"**
- Pode estar em inglês: **"App Review"** → **"Permissions and Features"**

**Método B - Se não encontrar no menu:**
- Vá em **"Produtos"** no menu lateral
- Clique em **"Facebook Login"**
- Depois clique em **"Configurações"**
- Role a página até encontrar a seção de permissões

### 5. Adicionar Permissões

Na página de permissões:

1. **Encontre a barra de busca** (geralmente no topo)
2. **Digite o nome da permissão** (ex: `pages_show_list`)
3. **Clique no resultado** ou no botão **"Adicionar"**
4. **Repita para cada permissão:**
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_metadata`
   - `business_management`

## 🎨 Como Identificar a Página Correta

A página de **Permissões e Recursos** geralmente tem:

- ✅ Título: "Permissões e Recursos" ou "Permissions and Features"
- ✅ Barra de busca no topo
- ✅ Lista de permissões divididas em:
  - Permissões Básicas
  - Permissões Avançadas
- ✅ Botões "Adicionar" ou "+" ao lado de cada permissão

## ⚠️ Se Não Encontrar

### Verifique se Facebook Login está adicionado:

1. Vá em **Produtos** no menu lateral
2. Verifique se **Facebook Login** está listado
3. Se não estiver:
   - Clique em **"+ Adicionar Produto"**
   - Procure por **"Facebook Login"**
   - Clique em **"Configurar"**

### Verifique o modo do App:

1. Vá em **Configurações** → **Básico**
2. Verifique se o **Modo do App** está como **"Desenvolvimento"**
3. Se estiver em "Produção", mude para "Desenvolvimento"

## 🔗 URL Direta (Se Souber o ID do App)

Se você souber o ID do seu App:

```
https://developers.facebook.com/apps/SEU_APP_ID/permissions/
```

**Como encontrar o ID do App:**
1. Vá em **Configurações** → **Básico**
2. O **ID do App** está no topo da página
3. Copie o número
4. Substitua `SEU_APP_ID` na URL acima

## ✅ Checklist

Marque cada item:

- [ ] Acessei https://developers.facebook.com/
- [ ] Fiz login
- [ ] Cliquei em "Meus Apps"
- [ ] Selecionei meu App
- [ ] Encontrei "Permissões e Recursos" no menu lateral
- [ ] OU encontrei via "Produtos" → "Facebook Login" → "Configurações"
- [ ] Encontrei a barra de busca de permissões
- [ ] Adicionei `pages_show_list`
- [ ] Adicionei `pages_read_engagement`
- [ ] Adicionei `pages_manage_metadata`
- [ ] Adicionei `business_management`
- [ ] Salvei as alterações (se necessário)

## 🆘 Ainda Não Encontrou?

### Tente estas alternativas:

1. **Busca no Facebook Developers:**
   - Use a barra de busca no topo do site
   - Digite: "permissions" ou "permissões"
   - Isso pode levar você diretamente à página

2. **Via Configurações:**
   - Vá em **Configurações** → **Básico**
   - Role até encontrar links relacionados a permissões

3. **Verifique se está no App correto:**
   - Certifique-se de que está no App que você criou
   - Não está em outro App ou página errada

4. **Tente em outro navegador:**
   - Às vezes o cache pode esconder elementos
   - Tente Chrome, Firefox ou Edge

## 📸 Descrição Visual da Página

Quando você encontrar a página correta, verá algo assim:

```
┌─────────────────────────────────────────────────┐
│ Facebook Developers                              │
├─────────────────────────────────────────────────┤
│                                                  │
│ Menu Lateral:          │ Conteúdo Principal:    │
│                        │                         │
│ • Painel               │ Permissões e Recursos  │
│ • Produtos             │                         │
│ • Configurações        │ 🔍 [Buscar...]          │
│ • Permissões e         │                         │
│   Recursos ← AQUI      │ Permissões Básicas:     │
│ • Revisão              │ ✓ email                 │
│ • ...                  │ ✓ public_profile       │
│                        │                         │
│                        │ Permissões Avançadas:  │
│                        │ [ ] pages_show_list    │
│                        │     [Adicionar]        │
│                        │ [ ] pages_read_...     │
│                        │     [Adicionar]        │
│                        │ ...                    │
└─────────────────────────────────────────────────┘
```

## 🎯 Dica Final

**A forma mais fácil:**
1. Acesse seu App
2. No menu lateral, procure por qualquer coisa que tenha "Permiss" ou "Permissão"
3. Clique nele
4. Use a busca para encontrar cada permissão

Se ainda não conseguir, me avise qual parte específica está difícil de encontrar!


