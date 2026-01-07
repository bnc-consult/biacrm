# 🔧 Corrigir URL do Instagram em Produção

## ❌ Problema

Você está vendo o erro "URL bloqueada" mesmo com as configurações corretas no Facebook App.

**Causa provável:** A variável de ambiente `INSTAGRAM_REDIRECT_URI` no servidor pode estar diferente ou não estar definida.

---

## ✅ Solução: Verificar e Corrigir Variável de Ambiente

### Passo 1: Conectar ao Servidor

```bash
ssh root@92.113.33.226
```

### Passo 2: Verificar Variável Atual

```bash
cd /var/www/biacrm/api
grep "INSTAGRAM_REDIRECT_URI" .env
```

**Resultado esperado:**
```
INSTAGRAM_REDIRECT_URI=https://biacrm.com/api/integrations/instagram/callback
```

### Passo 3: Se a Variável Não Estiver Definida ou Estiver Diferente

Edite o arquivo `.env`:

```bash
nano /var/www/biacrm/api/.env
```

Adicione ou corrija a linha:

```env
INSTAGRAM_REDIRECT_URI=https://biacrm.com/api/integrations/instagram/callback
```

⚠️ **IMPORTANTE:**
- ✅ Use `https://` (não `http://`)
- ✅ URL completa: `/api/integrations/instagram/callback`
- ❌ **NÃO** adicione barra final `/` no final
- ✅ Sem espaços extras

### Passo 4: Salvar e Reiniciar Backend

1. Salve o arquivo: `Ctrl+O`, `Enter`, `Ctrl+X`
2. Reinicie o backend com atualização de variáveis:

```bash
pm2 restart biacrm-backend --update-env
```

### Passo 5: Verificar Logs

Verifique se a URL correta está sendo usada:

```bash
pm2 logs biacrm-backend --lines 50 | grep -i "redirect\|instagram"
```

Procure por uma linha que mostre:
```
🔗 REDIRECT URI (COPIE ESTA URI EXATA PARA O FACEBOOK):
   https://biacrm.com/api/integrations/instagram/callback
```

---

## 🔍 Verificação Completa

Execute este script no servidor para verificar tudo:

```bash
bash /tmp/verificar-url-instagram-producao.sh
```

Ou execute manualmente:

```bash
echo "=== Verificando .env ==="
grep "INSTAGRAM_REDIRECT_URI\|FACEBOOK_REDIRECT_URI" /var/www/biacrm/api/.env

echo ""
echo "=== Verificando código compilado ==="
grep -n "INSTAGRAM_REDIRECT_URI" /var/www/biacrm/api/dist/routes/instagram.js | head -3

echo ""
echo "=== Verificando logs ==="
pm2 logs biacrm-backend --lines 30 --nostream | grep -i "redirect\|instagram" | tail -5
```

---

## 📋 Checklist

Antes de testar novamente:

- [ ] Variável `INSTAGRAM_REDIRECT_URI` está definida no `.env` do servidor
- [ ] URL no `.env` é exatamente: `https://biacrm.com/api/integrations/instagram/callback`
- [ ] URL no Facebook App é exatamente: `https://biacrm.com/api/integrations/instagram/callback`
- [ ] Backend foi reiniciado com `--update-env`
- [ ] Logs mostram a URL correta sendo usada
- [ ] Aguardou alguns minutos após reiniciar

---

## ⚠️ Erros Comuns

### Erro: "URL bloqueada" persiste após corrigir
- **Causa**: Backend não foi reiniciado ou variável não foi atualizada
- **Solução**: 
  1. Verifique se salvou o `.env`
  2. Reinicie com `pm2 restart biacrm-backend --update-env`
  3. Aguarde alguns minutos
  4. Verifique os logs para confirmar a URL

### Erro: Variável não encontrada
- **Causa**: Variável não está no `.env`
- **Solução**: Adicione a linha completa no `.env`

### Erro: URL diferente nos logs
- **Causa**: Pode haver lógica de fallback no código
- **Solução**: Defina explicitamente `INSTAGRAM_REDIRECT_URI` no `.env`

---

## 🎯 Resumo Rápido

**No servidor, execute:**

```bash
# 1. Editar .env
nano /var/www/biacrm/api/.env

# 2. Adicionar/corrigir linha:
INSTAGRAM_REDIRECT_URI=https://biacrm.com/api/integrations/instagram/callback

# 3. Salvar (Ctrl+O, Enter, Ctrl+X)

# 4. Reiniciar backend
pm2 restart biacrm-backend --update-env

# 5. Verificar logs
pm2 logs biacrm-backend --lines 30 | grep -i "redirect"
```

---

## 📝 Nota Importante

O modo estrito no Facebook App requer que a URL seja **EXATAMENTE** igual. Qualquer diferença (espaços, maiúsculas/minúsculas, barras finais) causará o erro "URL bloqueada".

Certifique-se de que:
- ✅ URL no `.env` do servidor = URL no Facebook App
- ✅ Ambas são exatamente: `https://biacrm.com/api/integrations/instagram/callback`
- ✅ Sem espaços extras
- ✅ Sem barras finais
- ✅ Backend reiniciado após alterar `.env`





