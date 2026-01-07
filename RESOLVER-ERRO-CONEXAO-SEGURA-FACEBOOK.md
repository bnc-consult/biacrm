# 🔒 Resolver Erro "Conexão Segura" - Facebook

## ❌ Erro Atual

Você está vendo o erro:
> **"O Facebook detectou que o BIACRM não está usando uma conexão segura para a transferência de informações."**

Este erro significa que o Facebook está detectando que alguma parte da comunicação está usando **HTTP** ao invés de **HTTPS**.

---

## ✅ Solução: Garantir HTTPS em Todas as URLs

### Passo 1: Verificar Variável no Servidor

Conecte ao servidor e verifique a variável `FACEBOOK_REDIRECT_URI`:

```bash
ssh root@92.113.33.226
cd /var/www/biacrm/api
grep "FACEBOOK_REDIRECT_URI" .env
```

**Deve ser:**
```
FACEBOOK_REDIRECT_URI=https://biacrm.com/api/integrations/facebook/callback
```

⚠️ **IMPORTANTE:** Deve usar `https://` (não `http://`)

### Passo 2: Corrigir se Estiver Usando HTTP

Se a variável estiver usando `http://`, edite o arquivo:

```bash
nano /var/www/biacrm/api/.env
```

Altere para:
```env
FACEBOOK_REDIRECT_URI=https://biacrm.com/api/integrations/facebook/callback
```

Salve: `Ctrl+O`, `Enter`, `Ctrl+X`

### Passo 3: Verificar URLs no Facebook App

1. **Acesse:** https://developers.facebook.com/apps
2. **Selecione seu app**
3. **Vá em:** **Produtos → Login do Facebook → Configurações**
4. **Verifique "URIs de redirecionamento OAuth válidos":**

Deve conter **APENAS** URLs com `https://`:
```
https://biacrm.com/api/integrations/facebook/callback
https://biacrm.com/api/integrations/instagram/callback
```

⚠️ **Remova qualquer URL com `http://`** da lista

### Passo 4: Verificar Configuração do Nginx

O Nginx precisa passar o header `x-forwarded-proto` corretamente. Verifique:

```bash
ssh root@92.113.33.226
cat /etc/nginx/sites-available/biacrm.com | grep -A 10 "location /api"
```

Deve conter:
```nginx
proxy_set_header X-Forwarded-Proto $scheme;
```

Se não tiver, adicione na configuração do Nginx.

### Passo 5: Reiniciar Backend

Após corrigir o `.env`, reinicie o backend:

```bash
pm2 restart biacrm-backend --update-env
```

### Passo 6: Verificar Logs

Verifique se a URL correta está sendo usada:

```bash
pm2 logs biacrm-backend --lines 50 | grep -i "redirect\|facebook"
```

Procure por logs que mostrem a URL sendo usada. Deve aparecer `https://`.

---

## 📋 Checklist Completo

Antes de testar novamente:

- [ ] Variável `FACEBOOK_REDIRECT_URI` no `.env` usa `https://`
- [ ] URL no Facebook App usa `https://`
- [ ] Não há URLs com `http://` no Facebook App
- [ ] Nginx está configurado com `X-Forwarded-Proto`
- [ ] Backend foi reiniciado com `--update-env`
- [ ] Logs mostram URLs usando `https://`
- [ ] Aguardou alguns minutos após reiniciar

---

## 🔍 Verificação Rápida

Execute no servidor:

```bash
# 1. Verificar .env
echo "=== Verificando .env ==="
grep "FACEBOOK_REDIRECT_URI\|FRONTEND_URL\|CORS_ORIGIN" /var/www/biacrm/api/.env

# 2. Verificar código compilado
echo ""
echo "=== Verificando código ==="
grep -n "FACEBOOK_REDIRECT_URI\|redirect.*facebook" /var/www/biacrm/api/dist/routes/facebook.js | head -5

# 3. Verificar logs
echo ""
echo "=== Últimas URLs usadas ==="
pm2 logs biacrm-backend --lines 30 --nostream | grep -i "redirect\|facebook" | tail -5
```

---

## ⚠️ Erros Comuns

### Erro: "Conexão não segura" persiste
- **Causa**: Variável no `.env` ainda usa `http://` ou não foi reiniciado
- **Solução**: 
  1. Verifique o `.env` novamente
  2. Reinicie com `pm2 restart biacrm-backend --update-env`
  3. Aguarde alguns minutos

### Erro: URL no Facebook App usa HTTP
- **Causa**: URL foi adicionada com `http://` ao invés de `https://`
- **Solução**: Remova a URL com `http://` e adicione novamente com `https://`

### Erro: Nginx não passa header correto
- **Causa**: Configuração do Nginx não inclui `X-Forwarded-Proto`
- **Solução**: Adicione `proxy_set_header X-Forwarded-Proto $scheme;` na configuração

---

## 🎯 Resumo Rápido

**No servidor, execute:**

```bash
# 1. Verificar/corrigir .env
nano /var/www/biacrm/api/.env
# Certifique-se que FACEBOOK_REDIRECT_URI usa https://

# 2. Reiniciar backend
pm2 restart biacrm-backend --update-env

# 3. Verificar logs
pm2 logs biacrm-backend --lines 30 | grep -i "redirect"
```

**No Facebook App:**
- Verifique que todas as URLs usam `https://`
- Remova qualquer URL com `http://`

---

## 📝 Nota Importante

O Facebook **requer HTTPS** para todas as URLs de callback em produção. Mesmo que o servidor esteja configurado corretamente, se a URL no Facebook App ou no `.env` usar `http://`, o erro persistirá.

**Certifique-se de que:**
- ✅ Todas as URLs usam `https://`
- ✅ Nenhuma URL usa `http://` (exceto localhost em desenvolvimento)
- ✅ Backend foi reiniciado após alterar `.env`

---

## 🔗 Links Úteis

- [Facebook Developers](https://developers.facebook.com/apps)
- [Requisitos de Segurança do Facebook](https://developers.facebook.com/docs/facebook-login/security)





