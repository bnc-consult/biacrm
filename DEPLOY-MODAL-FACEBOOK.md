# 🚀 Deploy - Modal de Seleção de Formulários e Usuários do Facebook

## 📋 Arquivos Modificados

### Backend
- ✅ `backend/src/routes/facebook.ts` - Novos endpoints `/forms` e `/users`
- ✅ `backend/dist/routes/facebook.js` - Build atualizado

### Frontend
- ✅ `frontend/src/pages/Integrations.tsx` - Modal de seleção implementado
- ✅ `frontend/dist/` - Build atualizado

## 🔧 Comandos de Deploy

### 1. Deploy do Backend

```powershell
# Deploy do arquivo facebook.js atualizado
scp backend/dist/routes/facebook.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/facebook.js
```

### 2. Deploy do Frontend

```powershell
# Deploy de todos os arquivos do frontend
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/
```

### 3. Reiniciar Backend no Servidor

```powershell
# Reiniciar PM2 com atualização de variáveis de ambiente
ssh root@92.113.33.226 'pm2 restart biacrm-backend --update-env'
```

## 📝 Comandos Completos (Copiar e Colar)

### Windows PowerShell (Execute um por vez)

```powershell
# 1. Deploy Backend
scp backend/dist/routes/facebook.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/facebook.js

# 2. Deploy Frontend
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/

# 3. Reiniciar Backend
ssh root@92.113.33.226 'pm2 restart biacrm-backend --update-env'
```

## ✅ Verificação Pós-Deploy

### Verificar se o arquivo foi atualizado no servidor:

```powershell
ssh root@92.113.33.226 'grep -A 5 "/forms\|/users" /var/www/biacrm/api/dist/routes/facebook.js | head -20'
```

### Verificar logs do backend:

```powershell
ssh root@92.113.33.226 'pm2 logs biacrm-backend --lines 20 --nostream'
```

### Verificar se o backend está rodando:

```powershell
ssh root@92.113.33.226 'pm2 status'
```

## 🧪 Teste Após Deploy

1. Acesse: `https://biacrm.com/entrada-saida`
2. Vá em **Integrações** → **Facebook**
3. Clique em **"Conectar Facebook"**
4. Autorize com Facebook quando solicitado
5. ✅ Após autorização, o modal de seleção deve aparecer com:
   - Dropdown de formulários
   - Dropdown de usuários
   - Botões "Cancelar" e "Próximo"
6. Selecione um formulário e um usuário
7. Clique em **"Próximo"**
8. ✅ A integração será criada com sucesso

## 🔍 O que foi implementado?

### Backend
- ✅ Endpoint `GET /api/integrations/facebook/forms` - Busca formulários de uma página
- ✅ Endpoint `GET /api/integrations/facebook/users` - Busca usuários/administradores de uma página
- ✅ Tratamento de erros e fallback para buscar dados do usuário autenticado

### Frontend
- ✅ Modal de seleção de formulários e usuários
- ✅ Busca automática após autenticação bem-sucedida
- ✅ Loading state durante carregamento
- ✅ Seleção automática do primeiro item (se disponível)
- ✅ Design consistente com o restante da aplicação

## ⚠️ Notas Importantes

- O modal só aparece se houver páginas do Facebook conectadas
- Se não houver páginas, o fluxo antigo continua funcionando (cria integração direto)
- Se a busca de formulários/usuários falhar, o sistema continua sem o modal
- Os formulários e usuários selecionados são exibidos no modal, mas não são salvos no banco ainda (pode ser implementado futuramente)

## 🆘 Em caso de problemas

Se algo não funcionar após o deploy:

1. Verifique os logs: `ssh root@92.113.33.226 'pm2 logs biacrm-backend --lines 50'`
2. Verifique se o arquivo foi atualizado: `ssh root@92.113.33.226 'ls -lrt /var/www/biacrm/api/dist/routes/facebook.js'`
3. Verifique se o frontend foi atualizado: `ssh root@92.113.33.226 'ls -lrt /domains/biacrm.com/public_html/assets/ | tail -5'`
4. Reinicie o backend novamente: `ssh root@92.113.33.226 'pm2 restart biacrm-backend'`
5. Limpe o cache do navegador e teste novamente

## 📊 Endpoints Criados

### GET `/api/integrations/facebook/forms`
**Query Parameters:**
- `access_token` (obrigatório) - Token de acesso do Facebook
- `page_id` (obrigatório) - ID da página do Facebook

**Resposta:**
```json
{
  "success": true,
  "forms": [
    {
      "id": "123456789",
      "name": "Formulário de Contato",
      "status": "ACTIVE",
      "leads_count": 150,
      "created_time": "2024-01-01T00:00:00+0000"
    }
  ]
}
```

### GET `/api/integrations/facebook/users`
**Query Parameters:**
- `access_token` (obrigatório) - Token de acesso do Facebook
- `page_id` (obrigatório) - ID da página do Facebook

**Resposta:**
```json
{
  "success": true,
  "users": [
    {
      "id": "987654321",
      "name": "José Anderson Silva",
      "email": "jose@example.com",
      "role": "ADMIN"
    }
  ]
}
```

