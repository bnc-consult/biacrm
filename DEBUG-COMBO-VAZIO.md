# 🔍 Debug - Combos não estão sendo preenchidos

## Problema
Os combos de seleção de páginas e formulários estão habilitados, mas não estão sendo preenchidos com as informações.

## Logs de Debug Adicionados

O código agora inclui logs detalhados que ajudam a identificar o problema:

### No Console do Navegador (F12)

**Logs esperados após conectar Facebook:**

1. `📄 Páginas disponíveis do callback:` - Mostra quantas páginas vieram do callback
2. `📄 Páginas encontradas via API:` - Se não houver no callback, tenta buscar via API
3. `✅ Definindo páginas no estado:` - Confirma que está setando as páginas
4. `🔄 Estado facebookPages atualizado no modal:` - Mostra quando o estado muda
5. `📄 Renderizando página no select:` - Mostra cada página sendo renderizada

## Verificações Necessárias

### 1. Verificar se os dados estão chegando

**No console do navegador, após conectar Facebook, verifique:**

```javascript
// Verificar se há páginas no estado
// (Execute no console quando o modal estiver aberto)
// Não é possível acessar diretamente, mas os logs devem mostrar
```

**Logs esperados:**
- `📄 Páginas disponíveis do callback: { count: X, pages: [...] }`
- `✅ Definindo páginas no estado: X`

### 2. Verificar se o React está re-renderizando

**Se os logs mostram que há páginas, mas o combo está vazio:**

- Pode ser problema de re-renderização do React
- Verifique se há erros no console
- Verifique se o componente está sendo re-renderizado

### 3. Verificar se há erros na API

**No console, verifique se há erros:**
- `❌ Erro ao buscar páginas`
- `❌ Erro ao buscar formulários`
- Erros de CORS ou autenticação

### 4. Verificar Network Tab

**No DevTools → Network:**
- Verifique se a requisição `/api/integrations/facebook/pages` está sendo feita
- Verifique se retorna status `200`
- Verifique a resposta JSON

## Possíveis Causas

### 1. **Estado não está sendo atualizado**
- O `setFacebookPages` pode não estar funcionando
- O React pode não estar re-renderizando

### 2. **Dados não estão chegando do backend**
- O endpoint `/pages` pode estar retornando vazio
- Pode haver erro de autenticação

### 3. **Problema com o formato dos dados**
- As páginas podem estar em formato diferente do esperado
- Pode haver problema com `access_token` das páginas

### 4. **Problema de timing**
- O modal pode estar abrindo antes dos dados serem carregados
- O estado pode estar sendo resetado após ser setado

## Solução Temporária para Teste

Para testar se o problema é com os dados ou com a renderização, você pode adicionar dados mock temporariamente:

```typescript
// No código, após setFacebookPages(pagesToUse), adicionar:
if (pagesToUse.length === 0) {
  // Dados mock para teste
  setFacebookPages([{
    id: 'test-123',
    name: 'Página de Teste',
    access_token: 'test-token'
  }]);
}
```

## Próximos Passos

1. **Fazer deploy do código atualizado** (com logs)
2. **Abrir console do navegador** (F12)
3. **Conectar Facebook novamente**
4. **Copiar TODOS os logs** que aparecem no console
5. **Verificar Network tab** para ver as requisições
6. **Enviar os logs** para análise

## Comandos para Verificar no Servidor

```powershell
# Verificar logs do backend
ssh root@92.113.33.226 'pm2 logs biacrm-backend --lines 50 --nostream | grep -i "facebook\|page\|form"'

# Verificar se o endpoint está funcionando
# (Precisa do token de acesso)
curl "https://biacrm.com/api/integrations/facebook/pages?access_token=TOKEN" -H "Authorization: Bearer TOKEN"
```

## Informações para Coletar

Se o problema persistir, colete:

1. **Todos os logs do console** (F12 → Console)
2. **Requisições da Network tab** (F12 → Network → Filtrar por "facebook")
3. **URL completa** após redirecionamento do Facebook
4. **Screenshot** do modal aberto
5. **Logs do backend** (`pm2 logs biacrm-backend`)

