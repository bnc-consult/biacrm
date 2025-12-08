# 🔐 Como Configurar Permissões no Facebook Developers

## Passo a Passo Detalhado

### Passo 1: Acessar o Facebook Developers

1. Acesse: https://developers.facebook.com/
2. Faça login com sua conta do Facebook
3. Clique em **Meus Apps** (no canto superior direito ou menu)

### Passo 2: Selecionar ou Criar seu App

1. Se você já tem um App:
   - Clique no nome do App na lista
   
2. Se não tem um App:
   - Clique em **Criar App**
   - Escolha o tipo: **Negócios** ou **Outro**
   - Preencha o nome do App
   - Clique em **Criar App**

### Passo 3: Acessar Permissões e Recursos

**Opção A - Menu Lateral:**
1. No menu lateral esquerdo, procure por **Permissões e Recursos**
2. Clique nele

**Opção B - Menu de Produtos:**
1. No menu lateral, clique em **Produtos**
2. Procure por **Facebook Login**
3. Clique em **Facebook Login**
4. No submenu, clique em **Configurações**
5. Role a página até encontrar **Permissões e Recursos**

**Opção C - URL Direta:**
1. Após selecionar seu App, a URL será algo como:
   ```
   https://developers.facebook.com/apps/SEU_APP_ID/dashboard/
   ```
2. Adicione `/permissions/` no final:
   ```
   https://developers.facebook.com/apps/SEU_APP_ID/permissions/
   ```

### Passo 4: Adicionar Permissões

Na página **Permissões e Recursos**, você verá:

1. **Seção "Permissões do Facebook Login"**
   - Lista de permissões disponíveis
   - Campo de busca para encontrar permissões

2. **Para adicionar cada permissão:**

   **a) pages_show_list:**
   - Digite "pages_show_list" no campo de busca
   - OU procure na lista por "pages" ou "Show list of Pages"
   - Clique em **Adicionar** ao lado da permissão
   - Descrição: "Provides access to the list of Pages that the user manages"

   **b) pages_read_engagement:**
   - Digite "pages_read_engagement" no campo de busca
   - OU procure por "Read engagement"
   - Clique em **Adicionar**
   - Descrição: "Provides access to read Page engagement data"

   **c) pages_manage_metadata:**
   - Digite "pages_manage_metadata" no campo de busca
   - OU procure por "Manage metadata"
   - Clique em **Adicionar**
   - Descrição: "Provides access to manage Page metadata"

   **d) business_management:**
   - Digite "business_management" no campo de busca
   - OU procure por "Business Management"
   - Clique em **Adicionar**
   - Descrição: "Manage business settings"

3. **Salvar alterações:**
   - Após adicionar todas as permissões, clique em **Salvar alterações** (se houver)

### Passo 5: Verificar Permissões Adicionadas

Após adicionar, você deve ver as permissões listadas em:
- **Permissões Básicas** (se aplicável)
- **Permissões Avançadas** (a maioria estará aqui)

### Passo 6: Configurar Revisão de Permissões (Opcional)

Algumas permissões podem precisar de revisão do Facebook para uso em produção:

1. **Para desenvolvimento:**
   - Você pode usar todas as permissões sem revisão
   - Certifique-se de que o App está em modo **Desenvolvimento**

2. **Para produção:**
   - Vá em **Revisão de Aplicativo**
   - Submeta as permissões para revisão
   - Aguarde aprovação do Facebook

## Localização Alternativa: Via Configurações do Facebook Login

### Método Alternativo:

1. **Vá em Produtos → Facebook Login → Configurações**
2. Role até a seção **Permissões e Recursos**
3. Você verá uma lista de permissões
4. Clique em **+ Adicionar Permissão** ou use o campo de busca
5. Adicione cada permissão uma por uma

## Permissões Mínimas Necessárias

Se você não conseguir encontrar todas, comece com estas (mais básicas):

1. ✅ **pages_show_list** - Essencial para listar páginas
2. ✅ **pages_read_engagement** - Essencial para ler dados

As outras podem ser adicionadas depois se necessário.

## Verificação Rápida

Para verificar se as permissões estão configuradas:

1. Vá em **Permissões e Recursos**
2. Procure na lista por:
   - [ ] pages_show_list
   - [ ] pages_read_engagement
   - [ ] pages_manage_metadata
   - [ ] business_management

Se todas estiverem listadas, está correto!

## Problemas Comuns

### "Não encontro a seção Permissões e Recursos"
- Certifique-se de que o produto **Facebook Login** está adicionado
- Vá em **Produtos** → **+ Adicionar Produto** → **Facebook Login**

### "A permissão não aparece na busca"
- Algumas permissões podem ter nomes diferentes
- Tente buscar por palavras-chave: "pages", "business", "management"
- Verifique se você está no App correto

### "Não consigo adicionar a permissão"
- Certifique-se de que o App está em modo **Desenvolvimento**
- Algumas permissões podem precisar de revisão primeiro
- Tente adicionar uma por vez

## Screenshots de Referência (Descrição)

### Tela Principal do App:
```
┌─────────────────────────────────────┐
│ Facebook Developers                 │
├─────────────────────────────────────┤
│ Meus Apps > Seu App                 │
│                                     │
│ Menu Lateral:                       │
│ ├─ Painel                            │
│ ├─ Produtos                         │
│ ├─ Configurações                    │
│ ├─ Permissões e Recursos ← AQUI     │
│ ├─ Revisão de Aplicativo            │
│ └─ ...                              │
└─────────────────────────────────────┘
```

### Tela de Permissões:
```
┌─────────────────────────────────────┐
│ Permissões e Recursos               │
├─────────────────────────────────────┤
│                                     │
│ [Buscar permissões...]              │
│                                     │
│ Permissões Básicas:                 │
│ ✓ email                             │
│ ✓ public_profile                    │
│                                     │
│ Permissões Avançadas:               │
│ [ ] pages_show_list        [Adicionar]│
│ [ ] pages_read_engagement  [Adicionar]│
│ [ ] pages_manage_metadata  [Adicionar]│
│ [ ] business_management    [Adicionar]│
│                                     │
│ [Salvar alterações]                 │
└─────────────────────────────────────┘
```

## URL Direta para Permissões

Se você souber o ID do seu App, pode acessar diretamente:

```
https://developers.facebook.com/apps/SEU_APP_ID/permissions/
```

Substitua `SEU_APP_ID` pelo ID do seu App (encontre em **Configurações → Básico → ID do App**).

## Próximos Passos

Após configurar as permissões:

1. ✅ Salve as alterações
2. ✅ Reinicie o servidor backend
3. ✅ Tente conectar o Instagram novamente
4. ✅ As permissões corretas serão solicitadas durante o OAuth

## Ajuda Adicional

Se ainda não conseguir encontrar:

1. **Verifique se o Facebook Login está adicionado:**
   - Vá em **Produtos**
   - Deve ter **Facebook Login** listado
   - Se não tiver, clique em **+ Adicionar Produto** → **Facebook Login**

2. **Use a busca do Facebook Developers:**
   - No topo da página, há uma barra de busca
   - Digite "permissions" ou "permissões"
   - Isso pode levar você diretamente à página

3. **Verifique o modo do App:**
   - Vá em **Configurações → Básico**
   - Certifique-se de que está em modo **Desenvolvimento**
   - Algumas opções podem estar ocultas em modo Produção


