# ❌ Erro: URI Incompleta no Validador

## ⚠️ Problema

Você colocou no validador:
```
https://phraseological-curmudgeonly-trudi.ngrok-free.dev
```

Mas isso está **incompleto**! Falta o caminho do callback.

## ✅ Solução: URI Completa

### URI Correta (Completa)

No campo **"URI de redirecionamento para verificação"**, cole a URI **COMPLETA**:

```
https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
```

### O Que Está Faltando?

A URI completa precisa ter:

1. ✅ **Protocolo:** `https://`
2. ✅ **Domínio:** `phraseological-curmudgeonly-trudi.ngrok-free.dev`
3. ✅ **Caminho completo:** `/api/integrations/instagram/callback`

**Você tinha apenas os itens 1 e 2. Faltava o item 3!**

## 📋 Passo a Passo Correto

1. **No campo "URI de redirecionamento para verificação":**
   - Remova: `https://phraseological-curmudgeonly-trudi.ngrok-free.dev`
   - Cole: `https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback`

2. **Clique em "Verificar URI"**

3. **Antes de validar, certifique-se de que a URI completa está em "URIs de redirecionamento OAuth válidos":**
   - Vá na seção **"URIs de redirecionamento do OAuth válidos"** (acima do validador)
   - Adicione: `https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback`
   - Salve as alterações

4. **Agora valide novamente**

## 🔍 Por Que Precisa do Caminho Completo?

O Facebook precisa saber **exatamente** para onde redirecionar após a autorização OAuth. O caminho `/api/integrations/instagram/callback` é onde o seu backend vai receber o código de autorização.

Sem o caminho completo, o Facebook não sabe para onde redirecionar!

## ✅ Checklist

- [ ] Removi a URI incompleta do validador
- [ ] Colei a URI completa com o caminho `/api/integrations/instagram/callback`
- [ ] Adicionei a URI completa em "URIs de redirecionamento OAuth válidos"
- [ ] Salvei as alterações
- [ ] Cliquei em "Verificar URI" e validou com sucesso

## 💡 Lembrete

**Sempre use a URI completa**, nunca apenas o domínio:
- ✅ `https://domínio.com/caminho/completo/callback`
- ❌ `https://domínio.com`
- ❌ `https://domínio.com/`

A URI deve corresponder **EXATAMENTE** ao que está configurado no código!


