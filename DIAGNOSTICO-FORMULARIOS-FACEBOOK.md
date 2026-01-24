# 🔍 Diagnóstico - Formulários do Facebook não aparecem

## ✅ O que foi corrigido

1. **Logs detalhados** adicionados no frontend e backend
2. **Tratamento de erros** melhorado para identificar problemas específicos
3. **Validação de token** antes de buscar formulários

## 🧪 Como diagnosticar o problema

### Passo 1: Verificar logs do navegador

1. Abra o console do navegador (`F12` → Console)
2. Conecte o Facebook novamente
3. Quando o modal aparecer, procure por logs que começam com:
   - `🔍 Parâmetros da requisição`
   - `📋 Resposta completa da API`
   - `❌ Erro ao buscar formulários`

### Passo 2: Verificar logs do backend

No servidor, execute:
```bash
pm2 logs biacrm-backend --lines 100 | grep -i "formulário\|forms\|leadgen"
```

### Passo 3: Verificar permissões do Facebook

O problema mais comum é **falta de permissões**. Verifique:

1. **No Facebook Developer App:**
   - Vá em: https://developers.facebook.com/apps/[SEU_APP_ID]/settings/basic/
   - Verifique se o app está em modo **"Produção"** ou se o usuário está como **"Testador"**
   - Verifique se as permissões incluem:
     - `pages_show_list`
     - `pages_read_engagement`
     - `leads_retrieval` (para formulários)

2. **Verificar se a página tem formulários:**
   - Acesse: https://www.facebook.com/[SUA_PAGINA]/forms
   - Ou vá em: Facebook → Páginas → [Sua Página] → Formulários
   - Se não houver formulários cadastrados, é normal não aparecer nada

### Passo 4: Verificar token da página

O token usado deve ser o **token da página**, não o token do usuário. Verifique nos logs:

```
🔍 Parâmetros da requisição: {
  page_id: "...",
  hasAccessToken: true,
  accessTokenLength: ...
}
```

Se `accessTokenLength` for muito pequeno (< 50 caracteres), pode ser um problema.

## 🔧 Possíveis causas e soluções

### Causa 1: Página não tem formulários cadastrados
**Sintoma:** Logs mostram sucesso mas `formsCount: 0`

**Solução:** 
- Criar formulários no Facebook primeiro
- Acesse: Facebook → Páginas → [Sua Página] → Formulários → Criar formulário

### Causa 2: Token sem permissões
**Sintoma:** Logs mostram erro com `permission` ou `Permission denied`

**Solução:**
1. No Facebook Developer App, adicionar permissão `leads_retrieval`
2. Fazer nova autorização do Facebook
3. Verificar se o token da página tem as permissões necessárias

### Causa 3: Token da página incorreto
**Sintoma:** Erro ao validar acesso à página

**Solução:**
- Verificar se o `access_token` passado é realmente o token da página
- O token deve ser obtido de `/me/accounts` com `access_token` da página

### Causa 4: App em modo desenvolvimento
**Sintoma:** Funciona para alguns usuários mas não para outros

**Solução:**
- Adicionar usuários como "Testadores" no Facebook App
- Ou mudar o app para modo "Produção"

## 📊 Informações para reportar

Se o problema persistir, colete:

1. **Logs do console do navegador** (F12 → Console)
   - Procure por: `🔍`, `📋`, `❌`, `⚠️`
   - Copie TODOS os logs relacionados a formulários

2. **Logs do backend** (servidor)
   ```bash
   pm2 logs biacrm-backend --lines 200 | grep -i "form\|leadgen\|facebook"
   ```

3. **Screenshot do modal** mostrando o problema

4. **Verificar se a página tem formulários:**
   - Acesse: https://www.facebook.com/[SUA_PAGINA]/forms
   - Tire screenshot mostrando se há formulários cadastrados

5. **Informações do erro específico:**
   - Mensagem de erro completa
   - Código de erro (se houver)
   - Status HTTP da resposta

## 🎯 Checklist de verificação

- [ ] Console do navegador foi verificado
- [ ] Logs do backend foram verificados
- [ ] Página do Facebook tem formulários cadastrados
- [ ] App do Facebook está em modo Produção ou usuário é Testador
- [ ] Permissões `leads_retrieval` estão configuradas
- [ ] Token da página está sendo usado (não token do usuário)

## 🆘 Próximos passos

1. Execute o deploy do backend e frontend
2. Teste novamente e colete os logs
3. Verifique se a página tem formulários cadastrados
4. Envie os logs coletados para análise
