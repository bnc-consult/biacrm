# 🔍 Como Encontrar Facebook Login no Painel do Facebook Developers

## ⚠️ Problema Atual

Você já adicionou todos os casos de uso, incluindo:
- ✅ "Gerenciar mensagens e conteúdo no Instagram"

Mas o erro persiste porque o **Facebook Login** precisa estar configurado **separadamente** para OAuth web.

## 🎯 O Que Você Precisa Encontrar

Procure por **"Facebook Login"** ou **"Login do Facebook"** no menu lateral do seu App.

## 📍 Onde Pode Estar

### Opção 1: Menu Lateral Direto

No menu lateral esquerdo do seu App, procure por:

```
📱 [Nome do seu App]
├── 📊 Visão geral
├── 🔐 Login do Facebook  ← PROCURE AQUI
├── 📱 Casos de uso
├── ⚙️ Configurações
└── ...
```

### Opção 2: Dentro de "Casos de uso"

1. **Clique em "Casos de uso"** no menu lateral
2. **Procure na lista** por:
   - "Login do Facebook"
   - "Facebook Login"
   - "Autenticação"
   - Qualquer coisa com "Login" ou "OAuth"

### Opção 3: Em "Produtos" ou "Funções do app"

1. **Expanda "Produtos"** ou **"Funções do app"** no menu lateral
2. **Procure por:**
   - "Facebook Login"
   - "Login"
   - "OAuth"

### Opção 4: Botão "Adicionar casos de uso"

1. **Clique no botão "Adicionar casos de uso"** (canto superior direito)
2. **Procure na lista** por:
   - "Login do Facebook"
   - "Facebook Login"
   - Se encontrar, clique em **"Adicionar"** ou **"Configurar"**

## ✅ Quando Encontrar Facebook Login

### Passo 1: Clique em "Facebook Login"

### Passo 2: Vá em "Configurações" ou "Settings"

### Passo 3: Configure URIs de Redirecionamento

Procure por uma seção chamada:
- **"URIs de redirecionamento OAuth válidos"**
- **"Valid OAuth Redirect URIs"**
- **"OAuth Redirect URIs"**
- **"Redirect URIs"**

**Adicione sua URL:**

Se usando **ngrok**:
```
https://sua-url-ngrok.ngrok-free.app/api/integrations/instagram/callback
```

Se usando **localhost**:
```
http://127.0.0.1:3000/api/integrations/instagram/callback
```

Se usando **produção**:
```
https://biacrm.com/api/integrations/instagram/callback
```

### Passo 4: Verifique se Está Habilitado para Web

Procure por opções como:
- ✅ **"Web OAuth"** → Deve estar **habilitado**
- ✅ **"OAuth para Web"** → Deve estar **habilitado**
- ✅ **"Client OAuth Login"** → Deve estar **habilitado**

### Passo 5: Salve Todas as Alterações

Clique em **"Salvar alterações"** ou **"Save Changes"**

## 🔍 Se NÃO Encontrar Facebook Login

### Tentativa 1: Adicionar Manualmente

1. **Clique em "Adicionar casos de uso"** (botão no canto superior direito)
2. **Procure por "Facebook Login"** na lista
3. **Se encontrar**, clique em **"Adicionar"** ou **"Configurar"**

### Tentativa 2: Verificar em Configurações Básicas

1. **Vá em "Configurações"** → **"Básico"**
2. **Procure por:**
   - "Login do Facebook"
   - "OAuth"
   - "Redirect URIs"
   - Qualquer seção relacionada a autenticação

### Tentativa 3: Verificar Status do App

1. **Vá em "Configurações"** → **"Básico"**
2. **Verifique:**
   - ✅ **Modo do App:** Deve estar "Desenvolvimento"
   - ✅ **Status:** Deve estar "Ativo"
   - ✅ **Categoria:** Deve estar configurada

## 📋 Checklist Completo

- [ ] Encontrei "Facebook Login" no menu lateral?
- [ ] Cliquei nele e fui para "Configurações"?
- [ ] Adicionei a URL de redirecionamento em "URIs de redirecionamento OAuth válidos"?
- [ ] Verifiquei se está habilitado para "Web OAuth"?
- [ ] Salvei todas as alterações?
- [ ] Reiniciei o servidor backend?
- [ ] Tentei conectar Instagram novamente?

## 🆘 Se Ainda Não Encontrar

### Alternativa: Configurar no Caso de Uso do Instagram

1. **Clique em "Gerenciar mensagens e conteúdo no Instagram"**
2. **Clique em "Personalizar"**
3. **Procure por:**
   - "Configurações de OAuth"
   - "URL de redirecionamento"
   - "Redirect URI"
   - "Web OAuth"
4. **Configure a URL de redirecionamento lá**

## 💡 Importante

**Casos de uso ≠ Facebook Login**

- ✅ **Casos de uso** = Funcionalidades e permissões (você já tem)
- ❌ **Facebook Login** = OAuth web (ainda precisa ser configurado)

São coisas **diferentes** e precisam ser configuradas **separadamente**!

## 🔄 Próximos Passos

1. ✅ Encontre "Facebook Login" no menu
2. ✅ Configure a URL de redirecionamento
3. ✅ Habilite para uso web
4. ✅ Salve as alterações
5. ✅ Reinicie o servidor backend
6. ✅ Tente conectar Instagram novamente

O problema é que o **Facebook Login não está configurado para OAuth web**, mesmo com todos os casos de uso adicionados!


