# ✅ Correções Aplicadas - Formulários do Facebook

## 🔧 O que foi corrigido

### 1. **Logs detalhados adicionados**
- Frontend: Logs mostram parâmetros da requisição, resposta da API e erros detalhados
- Backend: Logs mostram validação de token, acesso à página e erros específicos
- Identificação clara da origem do problema (token, permissões, etc.)

### 2. **Tratamento de erros melhorado**
- Frontend captura e exibe erros específicos do Facebook
- Backend retorna erros detalhados com código e tipo
- Mensagens mais claras para identificar problemas de permissão

### 3. **Validação de token**
- Backend valida acesso à página antes de buscar formulários
- Verifica se o token tem as permissões necessárias
- Logs mostram qual token está sendo usado (página vs usuário)

### 4. **Verificação de token da página**
- Logs mostram se o token da página está presente
- Identifica se está usando token do usuário ou da página
- Ajuda a diagnosticar problemas de autenticação

## 📋 Próximos passos

### 1. Deploy do Backend
```bash
# No servidor
cd /var/www/biacrm/api
npm run build
pm2 restart biacrm-backend
```

Ou copiar arquivo compilado:
```bash
# Do seu computador
scp backend/dist/routes/facebook.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/
ssh root@92.113.33.226 'pm2 restart biacrm-backend'
```

### 2. Deploy do Frontend
```bash
# Do seu computador
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/
```

### 3. Testar e coletar logs

Após o deploy, quando o usuário testar:

1. **Abrir console do navegador** (F12 → Console)
2. **Conectar Facebook** novamente
3. **Quando o modal aparecer**, procurar por logs:
   - `📄 Páginas encontradas via API` - Verificar se `hasAccessToken: true`
   - `📄 Página selecionada` - Verificar se tem `access_token`
   - `🔑 Token a ser usado` - Verificar qual token está sendo usado
   - `🔍 Parâmetros da requisição` - Verificar `page_id` e `access_token`
   - `📋 Resposta completa da API` - Verificar se há erros

4. **Se houver erro**, procurar por:
   - `❌ Erro ao buscar formulários`
   - Mensagens com `permission` ou `Permission`
   - Códigos de erro do Facebook

## 🔍 Diagnóstico comum

### Problema: Token da página não está presente
**Sintoma:** Logs mostram `hasAccessToken: false` nas páginas

**Solução:** 
- Verificar se o endpoint `/pages` está retornando `access_token`
- Verificar se o Facebook está retornando o token nas páginas

### Problema: Erro de permissão
**Sintoma:** Logs mostram erro com `permission` ou código 200

**Solução:**
- Adicionar permissão `leads_retrieval` no Facebook App
- Fazer nova autorização do Facebook

### Problema: Página não tem formulários
**Sintoma:** Logs mostram sucesso mas `formsCount: 0`

**Solução:**
- Verificar se a página realmente tem formulários cadastrados
- Criar formulários no Facebook primeiro

## 📊 Informações para coletar

Se o problema persistir, coletar:

1. **Todos os logs do console** que começam com:
   - `📄`, `🔍`, `📋`, `🔑`, `❌`, `⚠️`

2. **Logs do backend** (servidor):
   ```bash
   pm2 logs biacrm-backend --lines 200 | grep -i "form\|leadgen\|facebook"
   ```

3. **Screenshot do modal** mostrando o problema

4. **Verificar se a página tem formulários:**
   - Acessar: https://www.facebook.com/[SUA_PAGINA]/forms
   - Verificar se há formulários cadastrados

## ✅ Checklist

- [ ] Backend deployado e reiniciado
- [ ] Frontend deployado
- [ ] Cache do navegador limpo
- [ ] Teste realizado
- [ ] Logs coletados
- [ ] Verificado se página tem formulários cadastrados
