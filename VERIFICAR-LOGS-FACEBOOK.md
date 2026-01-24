# 🔍 Como Verificar Logs do Facebook

## 1. Verificar se o código foi deployado

```bash
ssh root@92.113.33.226 "grep -A 5 'isDifferentFromUserToken' /var/www/biacrm/api/dist/routes/facebook.js | head -10"
```

Se retornar algo, o código foi deployado. Se não retornar nada, faça o deploy:

```powershell
scp backend/dist/routes/facebook.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/
ssh root@92.113.33.226 "pm2 restart biacrm-backend"
```

## 2. Verificar logs gerais

```bash
ssh root@92.113.33.226 "pm2 logs biacrm-backend --lines 200 --nostream | grep -i 'facebook\|page\|token\|form' | tail -50"
```

## 3. Testar e verificar logs em tempo real

1. **Abra dois terminais:**
   - Terminal 1: Para ver logs em tempo real
   - Terminal 2: Para fazer o teste no navegador

2. **No Terminal 1, execute:**
   ```bash
   ssh root@92.113.33.226 "pm2 logs biacrm-backend --lines 0"
   ```

3. **No navegador:**
   - Conecte o Facebook novamente
   - Selecione uma página no modal
   - Observe os logs no Terminal 1

## 4. O que procurar nos logs

Procure por estas mensagens:

- `📄 Páginas obtidas no callback com tokens:` - Mostra se os tokens da página estão sendo retornados
- `isDifferentFromUserToken:` - Mostra se o token da página é diferente do token do usuário
- `accessTokenPreview:` - Mostra uma prévia dos tokens para comparação
- `⚠️ Página ... tem o mesmo token do usuário!` - Indica problema

## 5. Se os tokens forem iguais

Se o token da página for igual ao token do usuário, significa que o Facebook não está retornando o token da página. Isso pode acontecer se:

1. O usuário não é **Admin** da página
2. O app não tem permissões suficientes
3. A página não está configurada corretamente

## 6. Solução alternativa

Se mesmo com o token da página correto ainda der erro #200, o problema é que o Facebook **exige** a permissão `pages_manage_ads` que requer revisão. Não há como contornar isso no código.

Nesse caso, você precisa:
1. Solicitar revisão da permissão `pages_manage_ads` no Facebook Developer Console
2. Ou usar uma abordagem diferente (ex: webhook para receber leads)
