# 🧪 Testar e Verificar Logs

## Passo 1: Testar no navegador

1. Abra o console do navegador (F12 → Console)
2. Limpe o console (Ctrl + L)
3. Conecte o Facebook novamente
4. Quando o modal aparecer, selecione uma página
5. Observe os logs no console

## Passo 2: Verificar logs do servidor

Execute este comando em um terminal separado para ver os logs em tempo real:

```bash
ssh root@92.113.33.226 "pm2 logs biacrm-backend --lines 0"
```

Ou para ver os últimos logs:

```bash
ssh root@92.113.33.226 "pm2 logs biacrm-backend --lines 100 --nostream | grep -E 'Páginas obtidas|isDifferentFromUserToken|accessTokenPreview|Facebook pages response'"
```

## Passo 3: O que procurar

### No console do navegador:
- `🔑 Token a ser usado:` - Deve mostrar `source: 'page_token'`
- `🔍 Parâmetros da requisição:` - Deve mostrar o token da página

### Nos logs do servidor:
- `📄 Páginas obtidas no callback com tokens:` - Deve mostrar se os tokens estão sendo retornados
- `isDifferentFromUserToken: true` - Indica que o token da página é diferente do token do usuário
- `⚠️ Página ... tem o mesmo token do usuário!` - Indica problema

## Passo 4: Interpretar os resultados

### Se `isDifferentFromUserToken: true`:
✅ O token da página está sendo retornado corretamente
❌ Mas ainda dá erro #200 → O problema é permissão do Facebook (requer `pages_manage_ads`)

### Se `isDifferentFromUserToken: false` ou não aparecer:
❌ O Facebook não está retornando o token da página
- Verifique se o usuário é **Admin** da página
- Verifique se o app tem permissões suficientes

## Passo 5: Se o problema persistir

Se mesmo com o token da página correto ainda der erro `#200`, o Facebook **exige** a permissão `pages_manage_ads` que requer revisão. Não há como contornar isso apenas no código.

Nesse caso, você precisa:
1. Solicitar revisão da permissão `pages_manage_ads` no Facebook Developer Console
2. Ou usar uma abordagem diferente (ex: webhook para receber leads)
