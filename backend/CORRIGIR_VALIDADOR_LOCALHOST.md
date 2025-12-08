# ❌ Erro: Localhost Não É Aceito no Validador

## ⚠️ Problema

Você tentou validar:
```
http://localhost:3000/api/integrations/instagram/callback
```

E recebeu o erro:
```
Este é um URI de redirecionamento inválido para este aplicativo
```

## 🔍 Por Que Isso Acontece?

O Facebook **NÃO aceita `localhost`** no validador de URI, mesmo em modo desenvolvimento. Isso acontece porque:

1. ❌ `localhost` não é um domínio público válido
2. ❌ O Facebook precisa validar a URI contra um domínio real
3. ❌ Mesmo com "Forçar HTTPS" desabilitado, `localhost` pode ser rejeitado

## ✅ Solução: Usar URI do ngrok

### Passo 1: Verificar se ngrok Está Rodando

Certifique-se de que o ngrok está ativo. No terminal do ngrok, você deve ver:

```
Forwarding: https://phraseological-curmudgeonly-trudi.ngrok-free.dev -> http://localhost:3000
```

### Passo 2: Usar URI do ngrok no Validador

No campo **"URI de redirecionamento para verificação"**, cole:

```
https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
```

**NÃO use:**
- ❌ `http://localhost:3000/api/integrations/instagram/callback`
- ❌ `http://127.0.0.1:3000/api/integrations/instagram/callback`
- ❌ Qualquer URI com `localhost` ou `127.0.0.1`

**USE:**
- ✅ `https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback`
- ✅ Qualquer URI do ngrok que comece com `https://`

### Passo 3: Adicionar URI do ngrok na Lista

Antes de validar, certifique-se de que a URI do ngrok está em **"URIs de redirecionamento OAuth válidos"**:

1. **Na mesma página**, procure por **"URIs de redirecionamento do OAuth válidos"**
2. **Adicione:**
   ```
   https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
   ```
3. **Salve as alterações**

### Passo 4: Validar

1. **Cole a URI do ngrok** no campo "URI de redirecionamento para verificação"
2. **Clique em "Verificar URI"**
3. **Deve validar com sucesso** ✅

## 🔄 Se o ngrok Mudou

Se você reiniciou o ngrok e ele gerou uma nova URL:

1. **Verifique a nova URL** no terminal do ngrok
2. **Atualize em "URIs de redirecionamento OAuth válidos"** com a nova URL
3. **Atualize o `.env`** com a nova URL:
   ```env
   INSTAGRAM_REDIRECT_URI=https://nova-url-ngrok.ngrok-free.dev/api/integrations/instagram/callback
   ```
4. **Reinicie o servidor backend**
5. **Use a nova URL no validador**

## 📋 Checklist

- [ ] Removi `localhost` do campo do validador
- [ ] Colei a URI completa do ngrok (com `https://`)
- [ ] A URI do ngrok está em "URIs de redirecionamento OAuth válidos"
- [ ] O ngrok está rodando e a URL está correta
- [ ] Cliquei em "Verificar URI" e validou com sucesso

## 💡 Dica

**Sempre use a URI do ngrok**, nunca `localhost`:
- ✅ No validador
- ✅ Em "URIs de redirecionamento OAuth válidos"
- ✅ No arquivo `.env`
- ✅ No código (via variável de ambiente)

O Facebook precisa de um domínio público válido para validar e processar OAuth!


