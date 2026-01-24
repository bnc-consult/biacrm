# 🔍 Troubleshooting - Modal não aparece para outros usuários

## ❌ Problema: Modal aparece para você, mas não para outros usuários

### Possíveis Causas

#### 1. **Cache do Navegador** ⚠️ MAIS COMUM
Outros usuários podem ter uma versão antiga do código em cache.

**Solução:**
- Peça para outros usuários limparem o cache do navegador:
  - `Ctrl + Shift + Delete` → Limpar cache
  - Ou `Ctrl + F5` para recarregar forçando atualização
- Verifique se o build foi deployado corretamente

#### 2. **Build não foi deployado**
O código pode não ter sido enviado para produção.

**Verificar:**
```powershell
# Verificar data de modificação dos arquivos no servidor
ssh root@92.113.33.226 'ls -lrt /domains/biacrm.com/public_html/assets/index-*.js | tail -1'
```

**Solução:**
```powershell
# Fazer deploy novamente
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/
```

#### 3. **Parâmetros da URL não estão sendo passados**
O backend pode não estar redirecionando corretamente para outros usuários.

**Verificar no console do navegador (F12):**
- Abra o console após autorizar Facebook
- Procure por logs que começam com: `🔍`, `📋`, `✅`, `❌`
- Verifique se aparecem os parâmetros: `facebook_success`, `access_token`, `pages`

**Logs esperados:**
```
🔍 Parâmetros da URL detectados: {facebook_success: "true", access_token: "...", pages: "..."}
📋 Parâmetros do Facebook extraídos: {facebookSuccess: "true", facebookAccessToken: "presente", ...}
✅ Facebook callback detectado: {...}
🚀 Abrindo modal de seleção de formulários e usuários...
```

#### 4. **Problema com autenticação do backend**
Outros usuários podem não ter permissão para acessar os endpoints.

**Verificar logs do backend:**
```powershell
ssh root@92.113.33.226 'pm2 logs biacrm-backend --lines 100 --nostream | grep -i "facebook\|error\|401\|403"'
```

#### 5. **Facebook App em modo de desenvolvimento**
O app do Facebook pode estar restrito apenas para usuários de teste.

**Verificar:**
1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app
3. Vá em **Configurações** → **Básico**
4. Verifique se está em **Modo de Desenvolvimento** ou **Modo de Produção**

**Se estiver em Modo de Desenvolvimento:**
- Adicione outros usuários como **Testadores** em **Funções** → **Testadores**
- Ou altere para **Modo de Produção** (requer revisão do Facebook)

#### 6. **Problema com CORS ou autenticação**
Outros usuários podem ter problemas de autenticação na API.

**Verificar no console do navegador:**
- Abra **Network** (F12 → Network)
- Filtre por "facebook"
- Verifique se as requisições retornam `401` ou `403`
- Verifique se há erros de CORS

## 🔧 Soluções Passo a Passo

### Passo 1: Verificar se o código foi deployado

```powershell
# Verificar data do arquivo no servidor
ssh root@92.113.33.226 'ls -lrt /domains/biacrm.com/public_html/assets/index-*.js | tail -1'

# Se o arquivo for antigo, fazer deploy novamente
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/
```

### Passo 2: Pedir para outros usuários limparem o cache

**Instruções para outros usuários:**
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Imagens e arquivos em cache"
3. Clique em "Limpar dados"
4. Feche e abra o navegador novamente
5. Acesse `https://biacrm.com/entrada-saida`
6. Tente conectar o Facebook novamente

**Ou:**
1. Pressione `Ctrl + F5` na página
2. Tente conectar o Facebook novamente

### Passo 3: Verificar logs no console

**Peça para outros usuários:**
1. Abrir o console (F12 → Console)
2. Tentar conectar o Facebook
3. Copiar todos os logs que aparecem
4. Enviar os logs para análise

**Logs importantes a procurar:**
- `🔍 Parâmetros da URL detectados`
- `📋 Parâmetros do Facebook extraídos`
- `✅ Facebook callback detectado`
- `🚀 Abrindo modal de seleção`
- `❌ Erro` (qualquer erro)

### Passo 4: Verificar URL após redirecionamento

**Peça para outros usuários:**
1. Após autorizar no Facebook, copiar a URL completa
2. Verificar se contém os parâmetros:
   - `?facebook_success=true`
   - `&access_token=...`
   - `&pages=...`

**Exemplo de URL esperada:**
```
https://biacrm.com/entrada-saida?facebook_success=true&access_token=EAAB...&pages=%5B%7B%22id%22...
```

### Passo 5: Verificar configuração do Facebook App

1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app
3. Vá em **Configurações** → **Básico**
4. Verifique:
   - **Modo do App**: Deve estar em **Produção** ou ter outros usuários como **Testadores**
   - **Domínios do aplicativo**: Deve conter `biacrm.com`
   - **URIs de redirecionamento OAuth válidos**: Deve conter `https://biacrm.com/api/integrations/facebook/callback`

## 📊 Checklist de Diagnóstico

Peça para outros usuários verificarem:

- [ ] Cache do navegador foi limpo
- [ ] Console do navegador não mostra erros
- [ ] Logs de debug aparecem no console
- [ ] URL após redirecionamento contém `facebook_success=true`
- [ ] URL após redirecionamento contém `access_token=`
- [ ] URL após redirecionamento contém `pages=`
- [ ] Requisições para `/api/integrations/facebook/users` retornam sucesso
- [ ] Modal aparece mesmo sem formulários/usuários

## 🆘 Se ainda não funcionar

1. **Coletar informações:**
   - Screenshot do console do navegador
   - URL completa após redirecionamento do Facebook
   - Logs do backend (`pm2 logs biacrm-backend`)
   - Versão do navegador usado

2. **Verificar se é problema específico do usuário:**
   - Teste com outro navegador
   - Teste em modo anônimo/privado
   - Teste em outro dispositivo

3. **Verificar configuração do Facebook:**
   - App está em modo de produção?
   - Usuários estão como testadores?
   - Permissões estão corretas?

## 🔍 Logs de Debug Adicionados

O código agora inclui logs detalhados que ajudam a identificar o problema:

- `🔍 Parâmetros da URL detectados` - Mostra todos os parâmetros da URL
- `📋 Parâmetros do Facebook extraídos` - Mostra quais parâmetros do Facebook foram encontrados
- `✅ Facebook callback detectado` - Confirma que o callback foi processado
- `🚀 Abrindo modal` - Confirma que o modal está sendo aberto
- `⚠️ Parâmetros relacionados ao Facebook detectados mas não processados` - Indica problema na lógica

## 📝 Próximos Passos

1. **Deploy do código atualizado** (com logs de debug)
2. **Pedir para outros usuários limparem o cache**
3. **Coletar logs do console** de outros usuários
4. **Analisar os logs** para identificar o problema específico

