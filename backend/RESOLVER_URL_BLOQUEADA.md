# 🔧 Resolver Erro "URL bloqueada" do Facebook

## ⚠️ Erro Atual

O Facebook está retornando:
```
URL bloqueada
O redirecionamento falhou porque o URI usado não está na lista de liberação 
nas configurações de OAuth do cliente do app.
```

## ✅ Solução Passo a Passo

### Passo 1: Verificar URI Exata no Código

Primeiro, vamos ver qual URI o código está usando. Verifique o console do backend quando tentar conectar. Você verá um log como:

```
=== INSTAGRAM CONNECT-SIMPLE DEBUG ===
Redirect URI: https://...
```

**Copie essa URI exata.**

### Passo 2: Configurar no Facebook Developer

1. **Acesse:** https://developers.facebook.com/apps/
2. **Selecione seu App**
3. **Vá em:** Login do Facebook → Configurações
4. **Na seção "URIs de redirecionamento do OAuth válidos":**

   **IMPORTANTE:** Adicione a URI **EXATAMENTE** como aparece no log do backend, incluindo:
   - ✅ Protocolo (`https://`)
   - ✅ Domínio completo (`phraseological-curmudgeonly-trudi.ngrok-free.dev`)
   - ✅ Caminho completo (`/api/integrations/instagram/callback`)
   - ✅ Sem barra final (não adicione `/` no final)

   **Exemplo correto:**
   ```
   https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
   ```

   **Exemplos INCORRETOS:**
   ```
   ❌ https://phraseological-curmudgeonly-trudi.ngrok-free.dev
   ❌ https://phraseological-curmudgeonly-trudi.ngrok-free.dev/
   ❌ https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback/
   ❌ phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
   ```

5. **Clique em "Salvar alterações"**

### Passo 3: Verificar Configurações de OAuth

Na mesma página, verifique:

- ✅ **"Login do OAuth na Web"** deve estar **habilitado** (Sim)
- ✅ **"Login no OAuth do cliente"** deve estar **habilitado** (Sim)
- ✅ **"Usar modo estrito para URIs de redirecionamento"** está habilitado (isso é bom, mas exige correspondência exata)

### Passo 4: Adicionar Domínio do App

1. **Vá em:** Configurações → Básico
2. **Na seção "Domínios do App":**
   - Adicione: `phraseological-curmudgeonly-trudi.ngrok-free.dev` (sem `https://`)
   - Clique em **"Adicionar"**
3. **Salve as alterações**

### Passo 5: Verificar Variável de Ambiente

Certifique-se de que o `backend/.env` tem:

```env
INSTAGRAM_REDIRECT_URI=https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
```

**Execute o script para atualizar automaticamente:**
```powershell
.\backend\atualizar-ngrok-instagram.ps1
```

### Passo 6: Reiniciar Servidor

Após todas as alterações:

```bash
cd backend
npm run dev
```

### Passo 7: Testar Novamente

Tente conectar o Instagram novamente e verifique o console do backend para ver a URI exata sendo usada.

## 🔍 Diagnóstico Avançado

### Verificar URI no Console do Backend

Quando você tentar conectar, o backend vai logar a URI exata. Procure por:

```
=== INSTAGRAM CONNECT-SIMPLE DEBUG ===
Redirect URI: https://...
OAuth URL completa: https://...
```

**A URI no log DEVE corresponder EXATAMENTE à URI no Facebook.**

### Problema Comum: ngrok-free.dev

Alguns domínios `ngrok-free.dev` podem ter restrições. Se o problema persistir:

1. **Tente usar ngrok com domínio fixo** (requer conta paga)
2. **OU use ngrok com autenticação** para evitar warnings do navegador
3. **OU configure um domínio próprio** em produção

### Verificar se URI Foi Salva

1. **Volte em:** Login do Facebook → Configurações
2. **Verifique se a URI completa aparece na lista**
3. **Se não aparecer, adicione novamente e salve**

## ⚠️ Checklist Completo

- [ ] URI no Facebook corresponde EXATAMENTE à URI no código (verifique no log)
- [ ] URI inclui o caminho completo `/api/integrations/instagram/callback`
- [ ] URI não tem barra final `/`
- [ ] "Login do OAuth na Web" está habilitado
- [ ] "Login no OAuth do cliente" está habilitado
- [ ] Domínio do App foi adicionado em Configurações → Básico
- [ ] Variável `INSTAGRAM_REDIRECT_URI` está correta no `.env`
- [ ] Servidor backend foi reiniciado após alterações
- [ ] Testei novamente e verifiquei o log do backend

## 🆘 Se Ainda Não Funcionar

### Tentativa 1: Desabilitar Modo Estrito Temporariamente

1. **Em:** Login do Facebook → Configurações
2. **Desabilite:** "Usar modo estrito para URIs de redirecionamento"
3. **Salve e teste**
4. **Se funcionar, reabilite o modo estrito e adicione a URI correta**

### Tentativa 2: Verificar se ngrok Está Ativo

Certifique-se de que o ngrok ainda está rodando e a URL não mudou:

```bash
# Verifique o terminal do ngrok
# A URL deve ser a mesma que você configurou no Facebook
```

### Tentativa 3: Usar Validador de URI

No Facebook Developer, use o **"Validador da URI de redirecionamento"**:

1. **Cole a URI completa**
2. **Clique em "Verificar URI"**
3. **Veja se há algum erro específico**

## 💡 Dica Final

O erro "URL bloqueada" significa que o Facebook não reconhece a URI. Isso geralmente acontece porque:

1. ❌ A URI não foi adicionada corretamente
2. ❌ A URI não corresponde exatamente (diferença de maiúsculas/minúsculas, barras, etc.)
3. ❌ O domínio não foi adicionado em "Domínios do App"
4. ❌ O OAuth web não está habilitado

Verifique cada item do checklist acima!


