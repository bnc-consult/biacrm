# 🔍 Diagnosticar Erro "Código de Autorização Não Fornecido" - Facebook

## ❌ Erro Atual

Você está vendo o erro:
> **"Erro na autenticação do Facebook - Código de autorização não fornecido."**

Este erro significa que o callback do Facebook foi chamado, mas o código de autorização não foi incluído na URL.

---

## 🔍 Possíveis Causas e Soluções

### Causa 1: Usuário Cancelou a Autorização

**Sintoma:** O usuário clicou em "Cancelar" ou fechou a janela antes de autorizar.

**Solução:**
- Peça ao usuário para tentar novamente
- Certifique-se de que o usuário completa todo o fluxo de autorização
- Não feche a janela durante a autorização

---

### Causa 2: URL de Callback Não Configurada Corretamente

**Sintoma:** O callback é chamado, mas sem código.

**Verificação:**
1. **Acesse:** https://developers.facebook.com/apps → Seu App
2. **Vá em:** **Produtos → Login do Facebook → Configurações**
3. **Verifique "URIs de redirecionamento OAuth válidos":**

Deve conter **exatamente**:
```
https://biacrm.com/api/integrations/facebook/callback
```

**Solução:**
- Certifique-se de que a URL está configurada corretamente
- Use `https://` (não `http://`)
- Sem barra final `/`
- URL completa com caminho `/api/integrations/facebook/callback`

---

### Causa 3: App em Modo Desenvolvimento (Usuário Não é Testador)

**Sintoma:** Funciona para você, mas não para outros usuários.

**Verificação:**
1. **Acesse:** https://developers.facebook.com/apps → Seu App
2. **Vá em:** **Configurações → Básico**
3. **Verifique "Modo do App":**
   - Se estiver em **"Desenvolvimento"**, apenas testadores podem usar

**Solução:**
- Adicione usuários como testadores em **Funções do app → Testadores**
- Ou mude para produção (se estiver pronto)

---

### Causa 4: Problema com HTTPS/HTTP

**Sintoma:** Facebook bloqueia por conexão não segura.

**Verificação:**
1. Verifique se `FACEBOOK_REDIRECT_URI` no `.env` usa `https://`
2. Verifique se a URL no Facebook App usa `https://`

**Solução:**
- Certifique-se de que todas as URLs usam `https://`
- Reinicie o backend após alterar `.env`

---

### Causa 5: Erro do Facebook Não Capturado

**Sintoma:** O callback é chamado sem código e sem parâmetros de erro.

**Verificação:**
- Verifique os logs do backend para ver os parâmetros recebidos
- Procure por mensagens de erro do Facebook

**Solução:**
- Verifique os logs: `pm2 logs biacrm-backend --lines 50 | grep -i "facebook\|callback"`
- Procure por erros específicos do Facebook

---

## 🔧 Verificação Rápida no Servidor

Execute no servidor para diagnosticar:

```bash
ssh root@92.113.33.226

# 1. Verificar variável no .env
echo "=== Verificando .env ==="
grep "FACEBOOK_REDIRECT_URI\|FRONTEND_URL\|CORS_ORIGIN" /var/www/biacrm/api/.env

# 2. Verificar logs recentes
echo ""
echo "=== Últimas chamadas de callback ==="
pm2 logs biacrm-backend --lines 100 --nostream | grep -i "facebook.*callback\|codigo.*fornecido" | tail -10

# 3. Verificar código compilado
echo ""
echo "=== Verificando código ==="
grep -n "Código de autorização não fornecido" /var/www/biacrm/api/dist/routes/facebook.js
```

---

## 📋 Checklist de Diagnóstico

Marque cada item ao verificar:

- [ ] URL de callback está configurada no Facebook App
- [ ] URL usa `https://` (não `http://`)
- [ ] URL está exatamente como: `https://biacrm.com/api/integrations/facebook/callback`
- [ ] Variável `FACEBOOK_REDIRECT_URI` no `.env` usa `https://`
- [ ] Usuário completou todo o fluxo de autorização
- [ ] Usuário não cancelou a autorização
- [ ] Se app está em desenvolvimento, usuário é testador
- [ ] Logs do backend foram verificados
- [ ] Backend foi reiniciado após alterações

---

## 🎯 Solução Rápida

**Se o erro persistir, tente:**

1. ✅ **Verificar URL no Facebook App:**
   - Deve ser: `https://biacrm.com/api/integrations/facebook/callback`
   - Sem barra final, com `https://`

2. ✅ **Verificar variável no servidor:**
   ```bash
   grep "FACEBOOK_REDIRECT_URI" /var/www/biacrm/api/.env
   ```
   - Deve usar `https://`

3. ✅ **Reiniciar backend:**
   ```bash
   pm2 restart biacrm-backend --update-env
   ```

4. ✅ **Testar novamente:**
   - Peça ao usuário para tentar novamente
   - Certifique-se de que completa todo o fluxo

---

## 📝 Logs Úteis

O backend agora registra informações detalhadas quando o código não é fornecido:

```
Facebook callback - Código não fornecido. Query params: { ... }
```

Verifique esses logs para ver quais parâmetros foram recebidos e identificar o problema.

---

## 🔗 Links Úteis

- [Facebook Developers](https://developers.facebook.com/apps)
- [Configuração de OAuth](https://developers.facebook.com/docs/facebook-login/web)
- [Troubleshooting OAuth](https://developers.facebook.com/docs/facebook-login/troubleshooting)

---

## ✅ Próximos Passos

1. ✅ Verifique a URL de callback no Facebook App
2. ✅ Verifique a variável no `.env` do servidor
3. ✅ Verifique os logs do backend
4. ✅ Teste novamente com um usuário testador
5. ✅ Se necessário, adicione mais usuários como testadores





