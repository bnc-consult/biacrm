# 🔍 Troubleshooting - Modal de Seleção do Facebook

## ❌ Problema: Modal não aparece após integração

### Possíveis Causas e Soluções

#### 1. **Verificar se o código foi deployado corretamente**

```powershell
# Verificar se o arquivo foi atualizado no servidor
ssh root@92.113.33.226 'grep -c "showFacebookFormModal" /domains/biacrm.com/public_html/assets/index-*.js'
```

#### 2. **Verificar logs do console do navegador**

Abra o DevTools (F12) e verifique:
- Console para mensagens de erro
- Network para ver se as requisições `/forms` e `/users` estão sendo feitas
- Se há erros de CORS ou autenticação

**Logs esperados:**
```
🚀 Abrindo modal de seleção de formulários e usuários...
✅ Modal aberto. showFacebookFormModal: true
🔍 Buscando formulários e usuários do Facebook...
✅ Dados recebidos: { formsCount: X, usersCount: Y }
✅ Carregamento concluído. Modal deve estar visível.
```

#### 3. **Verificar se há páginas do Facebook**

O modal só aparece se houver **pelo menos uma página** do Facebook conectada.

**Verificar no console:**
```javascript
// No console do navegador, após autorizar Facebook
console.log('Pages:', JSON.parse(decodeURIComponent(new URLSearchParams(window.location.search).get('pages') || '[]')))
```

#### 4. **Verificar endpoints do backend**

Teste manualmente os endpoints:

```powershell
# Testar endpoint de formulários (substitua ACCESS_TOKEN e PAGE_ID)
ssh root@92.113.33.226 'curl "https://biacrm.com/api/integrations/facebook/forms?access_token=ACCESS_TOKEN&page_id=PAGE_ID" -H "Authorization: Bearer SEU_TOKEN"'

# Testar endpoint de usuários
ssh root@92.113.33.226 'curl "https://biacrm.com/api/integrations/facebook/users?access_token=ACCESS_TOKEN&page_id=PAGE_ID" -H "Authorization: Bearer SEU_TOKEN"'
```

#### 5. **Verificar se o modal está sendo renderizado**

No console do navegador:
```javascript
// Verificar se o estado está correto
// (precisa estar dentro do componente React)
document.querySelector('[class*="showFacebookFormModal"]')
```

#### 6. **Limpar cache do navegador**

- Pressione `Ctrl + Shift + Delete`
- Selecione "Imagens e arquivos em cache"
- Limpar dados
- Recarregar a página com `Ctrl + F5`

#### 7. **Verificar z-index do modal**

O modal usa `z-[9999]` para garantir que fique acima de outros elementos. Se ainda assim não aparecer, pode haver conflito com outros modais.

#### 8. **Verificar se há erros no backend**

```powershell
# Verificar logs do PM2
ssh root@92.113.33.226 'pm2 logs biacrm-backend --lines 50 --nostream | grep -i "facebook\|form\|user\|error"'
```

## 🔧 Correções Aplicadas

### Versão Atual (Corrigida)

1. ✅ **Modal abre imediatamente** - Não espera carregar dados primeiro
2. ✅ **Parâmetros da URL limpos antes** - Evita re-execução do useEffect
3. ✅ **Tratamento de erros melhorado** - Modal aparece mesmo se buscar dados falhar
4. ✅ **Logs de debug adicionados** - Facilita identificação de problemas
5. ✅ **Z-index aumentado** - Garante que modal fique visível

### Mudanças no Código

```typescript
// ANTES: Modal só abria se buscar dados funcionasse
try {
  const [formsResponse, usersResponse] = await Promise.all([...]);
  setShowFacebookFormModal(true); // ❌ Só abria aqui
} catch {
  // Não abria modal
}

// DEPOIS: Modal abre imediatamente
setShowFacebookFormModal(true); // ✅ Abre primeiro
try {
  const [formsResponse, usersResponse] = await Promise.all([...]);
  // Carrega dados depois
} catch {
  // Modal continua aberto mesmo com erro
}
```

## 🧪 Teste Manual

1. **Acesse:** `https://biacrm.com/entrada-saida`
2. **Clique em:** "Conectar Facebook"
3. **Autorize** com Facebook
4. **Após redirecionamento**, o modal deve aparecer **imediatamente**
5. **Verifique no console** se há logs de debug
6. **Aguarde** o carregamento dos formulários e usuários

## 📊 Checklist de Verificação

- [ ] Build do frontend foi deployado
- [ ] Build do backend foi deployado
- [ ] Backend foi reiniciado (`pm2 restart`)
- [ ] Cache do navegador foi limpo
- [ ] Console do navegador não mostra erros
- [ ] Requisições `/forms` e `/users` estão sendo feitas
- [ ] Há pelo menos uma página do Facebook conectada
- [ ] Modal aparece mesmo sem formulários/usuários

## 🆘 Se ainda não funcionar

1. **Verifique os logs do console** do navegador
2. **Verifique os logs do backend** no servidor
3. **Teste os endpoints manualmente** com curl/Postman
4. **Verifique se há erros de CORS** nas requisições
5. **Verifique se o token do Facebook está válido**

## 📝 Informações para Debug

Se o problema persistir, colete estas informações:

1. **Console do navegador** (F12 → Console)
2. **Network tab** (F12 → Network → Filtrar por "facebook")
3. **Logs do backend** (`pm2 logs biacrm-backend`)
4. **URL completa** após redirecionamento do Facebook
5. **Screenshot** da tela quando deveria aparecer o modal

