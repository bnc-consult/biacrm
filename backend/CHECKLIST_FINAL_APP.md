# ✅ Checklist Final: Resolver Erro "App não está disponível"

## ⚠️ Erro Persistente

```
Parece que esse app não está disponível
Este app precisa pelo menos do supported permission.
```

Este erro persiste mesmo com a URI correta, indicando problema na **configuração fundamental do App**.

## 📋 Checklist Completo - Verifique Cada Item

### ✅ 1. Status e Configuração Básica do App

**Vá em:** Configurações → Básico

- [ ] **ID do App:** Está presente e correto
- [ ] **Chave secreta do App:** Está presente e correta
- [ ] **Modo do App:** "Desenvolvimento" OU "Em produção" (não "Desativado")
- [ ] **Status:** "Ativo" (não "Bloqueado" ou "Desativado")
- [ ] **Categoria:** Está configurada (ex: "Negócios", "Entretenimento")
- [ ] **Email de contato:** Está configurado e válido
- [ ] **URL do site:** Pode estar vazio, mas se preenchido, deve ser válido

### ✅ 2. Facebook Login - Configurações Obrigatórias

**Vá em:** Login do Facebook → Configurações

- [ ] **"Login no OAuth do cliente":** Deve estar **Sim** (habilitado)
- [ ] **"Login do OAuth na Web":** Deve estar **Sim** (habilitado)
- [ ] **"Forçar HTTPS":** Pode estar Sim ou Não (recomendado Sim)
- [ ] **"Usar modo estrito para URIs de redirecionamento":** Pode estar Sim ou Não

### ✅ 3. URIs de Redirecionamento

**Na mesma página (Login do Facebook → Configurações):**

- [ ] **"URIs de redirecionamento do OAuth válidos":**
  - Deve ter: `https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback`
  - A URI deve corresponder **EXATAMENTE** à usada no código
  - Sem barra final `/`
  - Com `https://`

### ✅ 4. Domínios do App

**Vá em:** Configurações → Básico → Domínios do App

- [ ] **Domínio adicionado:** `phraseological-curmudgeonly-trudi.ngrok-free.dev`
  - Sem `https://`
  - Apenas o domínio

### ✅ 5. Casos de Uso

**Vá em:** Casos de uso

- [ ] **"Gerenciar mensagens e conteúdo no Instagram":** Está adicionado
- [ ] **"Login do Facebook":** Pode estar listado separadamente (verifique)

### ✅ 6. Variáveis de Ambiente

**Verifique o arquivo `backend/.env`:**

- [ ] **`FACEBOOK_APP_ID`** ou **`INSTAGRAM_APP_ID`:** Está configurado
- [ ] **`FACEBOOK_APP_SECRET`** ou **`INSTAGRAM_APP_SECRET`:** Está configurado
- [ ] **`INSTAGRAM_REDIRECT_URI`:** Está configurado com a URI completa do ngrok
- [ ] **`FRONTEND_URL`:** Está configurado

**Exemplo correto:**
```env
FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui
INSTAGRAM_REDIRECT_URI=https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
FRONTEND_URL=https://phraseological-curmudgeonly-trudi.ngrok-free.dev
```

### ✅ 7. Servidor Backend

- [ ] **Servidor está rodando:** `npm run dev` no backend
- [ ] **ngrok está rodando:** `ngrok http 3000`
- [ ] **URL do ngrok está correta:** Verifique no terminal do ngrok
- [ ] **Servidor foi reiniciado** após alterar `.env`

## 🔧 Se Todos os Itens Estão Corretos e Ainda Não Funciona

### Solução 1: Verificar Logs do Backend

Quando tentar conectar, verifique o console do backend:

```
=== INSTAGRAM CONNECT-SIMPLE DEBUG ===
App ID: ✅ Configurado
Redirect URI: https://...
```

**Verifique:**
- O App ID está correto?
- A Redirect URI está correta?
- Há algum erro adicional nos logs?

### Solução 2: Criar Novo App do Zero

Se **TODOS** os itens acima estão corretos e ainda não funciona, pode ser necessário criar um novo App:

1. **Crie um novo App** do tipo "Negócios"
2. **IMEDIATAMENTE após criar:**
   - Vá em Login do Facebook → Configurações
   - Habilite "Login no OAuth do cliente": Sim
   - Habilite "Login do OAuth na Web": Sim
   - Adicione a URI de redirecionamento
   - Salve
3. **Adicione caso de uso:** "Gerenciar mensagens e conteúdo no Instagram"
4. **Atualize o `.env`** com o novo App ID e Secret
5. **Reinicie o servidor** e teste

### Solução 3: Verificar Se Há Bloqueios

1. **Vá em:** Configurações → Básico
2. **Procure por:** Avisos, bloqueios ou restrições
3. **Se houver:**
   - Leia as mensagens
   - Resolva os problemas indicados
   - Pode ser necessário verificar identidade ou completar revisão

## 🆘 Próximos Passos

1. ✅ **Revise cada item do checklist acima**
2. ✅ **Marque os itens que estão corretos**
3. ✅ **Corrija os itens que estão incorretos**
4. ✅ **Se todos estão corretos e ainda não funciona, crie um novo App**

## 💡 Por Que Isso Acontece?

O erro "supported permission" geralmente acontece quando:

1. O App foi criado mas o Facebook Login não foi configurado imediatamente
2. O App está em um estado intermediário ou bloqueado
3. Há alguma configuração obrigatória faltando
4. O tipo de App não suporta OAuth web corretamente

**A solução mais comum é criar um novo App e configurar o Facebook Login IMEDIATAMENTE após a criação.**


