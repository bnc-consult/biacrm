# ✅ Como Usar o Validador de URI do Facebook

## 📍 Onde Está

No Facebook Developer:
- **Login do Facebook** → **Configurações**
- Seção: **"Validador da URI de redirecionamento"** (Redirect URI Validator)

## 🔗 O Que Colocar

No campo **"URI de redirecionamento para verificação"**, cole a URI completa do callback do Instagram:

```
https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
```

## ✅ Como Verificar a URI Correta

### Opção 1: Verificar no Console do Backend

Quando você tentar conectar o Instagram, o backend vai logar a URI exata. Procure por:

```
=== INSTAGRAM CONNECT-SIMPLE DEBUG ===
🔗 REDIRECT URI (COPIE ESTA URI EXATA PARA O FACEBOOK):
   https://...
```

**Use essa URI exata.**

### Opção 2: Verificar no .env

Verifique o arquivo `backend/.env`:

```env
INSTAGRAM_REDIRECT_URI=https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
```

**Use essa URI exata.**

## 📋 Passo a Passo

1. **Copie a URI completa:**
   ```
   https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
   ```

2. **Cole no campo "URI de redirecionamento para verificação"**

3. **Clique em "Verificar URI"**

4. **O Facebook vai verificar se:**
   - ✅ A URI está na lista de "URIs de redirecionamento OAuth válidos"
   - ✅ A URI está formatada corretamente
   - ✅ O domínio está configurado em "Domínios do App"

## ⚠️ Importante

- ✅ Use a URI **EXATA** que está configurada no código
- ✅ Inclua o protocolo `https://`
- ✅ Inclua o caminho completo `/api/integrations/instagram/callback`
- ✅ Não adicione barra final `/` no final
- ✅ Se o ngrok mudou, use a nova URL

## 🔍 Se a Validação Falhar

Se o validador retornar erro:

1. **Verifique se a URI está em "URIs de redirecionamento OAuth válidos":**
   - Deve estar listada EXATAMENTE como você colou no validador
   - Se não estiver, adicione e salve

2. **Verifique se o domínio está em "Domínios do App":**
   - Vá em: Configurações → Básico → Domínios do App
   - Adicione: `phraseological-curmudgeonly-trudi.ngrok-free.dev` (sem `https://`)

3. **Verifique se o ngrok ainda está rodando:**
   - A URL do ngrok pode ter mudado se você reiniciou
   - Verifique o terminal do ngrok para ver a URL atual

## 💡 Dica

O validador é útil para:
- ✅ Verificar se a URI está configurada corretamente
- ✅ Diagnosticar problemas de redirecionamento
- ✅ Confirmar que a URI corresponde exatamente ao esperado

Mas lembre-se: **a URI DEVE estar configurada em "URIs de redirecionamento OAuth válidos"** para funcionar, não apenas validada!


