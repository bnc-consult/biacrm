# 🔧 Resolver Erro: "Domínio não incluído nos domínios do app"

## Erro Apresentado
```
Não é possível carregar a URL
O domínio dessa URL não está incluído nos domínios do app. 
Para carregar essa URL, adicione todos os domínios e subdomínios 
ao campo Domínios do app nas configurações do app.
```

## Solução Passo a Passo

### Passo 1: Acessar Facebook Developers
1. Acesse: https://developers.facebook.com/
2. Faça login com sua conta do Facebook
3. Vá em **Meus Apps** e selecione seu App

### Passo 2: Configurar Domínios do App

1. **Vá em Configurações → Básico**
   - Role até a seção **Domínios do App**

2. **Adicione os seguintes domínios:**
   ```
   localhost
   127.0.0.1
   biacrm.com
   www.biacrm.com
   ```
   
   **Como adicionar:**
   - Clique no campo **Domínios do App**
   - Digite um domínio por vez
   - Pressione Enter após cada domínio
   - Repita para todos os domínios listados acima

3. **Salve as alterações**
   - Clique em **Salvar alterações** no final da página

### Passo 3: Configurar URLs de Redirecionamento OAuth

1. **Vá em Produtos → Facebook Login → Configurações**
   - Se não tiver o produto Facebook Login, clique em **+ Adicionar Produto** e adicione

2. **Em Configurações de Cliente OAuth:**
   - Role até **URIs de redirecionamento OAuth válidos**
   - Clique em **Adicionar URI**

3. **Adicione as seguintes URLs (uma por vez):**
   ```
   http://127.0.0.1:3000/api/integrations/instagram/callback
   http://localhost:3000/api/integrations/instagram/callback
   https://biacrm.com/api/integrations/instagram/callback
   ```

4. **Salve as alterações**

### Passo 4: Verificar Modo do App

1. **Vá em Configurações → Básico**
2. **Verifique o Modo do App:**
   - Deve estar como **Desenvolvimento** para aceitar localhost
   - Se estiver em **Produção**, mude para **Desenvolvimento**

### Passo 5: Verificar Configurações Adicionais

1. **Vá em Produtos → Instagram Graph API**
   - Certifique-se de que está **Configurado**

2. **Verifique Permissões:**
   - Vá em **Permissões e Recursos**
   - Certifique-se de que tem as permissões:
     - `pages_show_list` - Listar páginas do Facebook
     - `pages_read_engagement` - Ler engajamento das páginas
     - `pages_manage_metadata` - Gerenciar metadados das páginas
     - `business_management` - Gerenciar negócios (necessário para Instagram Business)
     
     **NOTA:** As permissões específicas do Instagram (`instagram_basic`, `instagram_content_publish`, etc.) não são mais válidas.

## Checklist de Configuração

Marque cada item após configurar:

- [ ] Domínios adicionados: `localhost`, `127.0.0.1`, `biacrm.com`
- [ ] URLs de redirecionamento OAuth configuradas
- [ ] Modo do App está como **Desenvolvimento**
- [ ] Produto Instagram Graph API está adicionado
- [ ] Permissões necessárias estão configuradas
- [ ] Alterações foram salvas

## Teste Após Configurar

1. **Aguarde alguns minutos** para as alterações serem propagadas
2. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
3. **Tente conectar o Instagram novamente**

## Se Ainda Não Funcionar

### Opção 1: Usar apenas 127.0.0.1
No arquivo `.env`, use apenas:
```env
INSTAGRAM_REDIRECT_URI=http://127.0.0.1:3000/api/integrations/instagram/callback
```

E no Facebook Developers, adicione apenas:
- Domínio: `127.0.0.1`
- URL de redirecionamento: `http://127.0.0.1:3000/api/integrations/instagram/callback`

### Opção 2: Usar ngrok para desenvolvimento
1. Instale ngrok: https://ngrok.com/download
2. Execute: `ngrok http 3000`
3. Use a URL gerada (ex: `https://abc123.ngrok.io`)
4. Configure no Facebook:
   - Domínio: `abc123.ngrok.io` (sem https://)
   - URL de redirecionamento: `https://abc123.ngrok.io/api/integrations/instagram/callback`

### Opção 3: Usar domínio de produção
Se você tem um servidor de produção:
1. Configure o domínio de produção no Facebook
2. Use a URL de produção no `.env`

## Erros Comuns

### "Domínio inválido"
- Não use `http://` ou `https://` no campo Domínios do App
- Use apenas: `localhost`, `127.0.0.1`, `biacrm.com`

### "URL de redirecionamento inválida"
- Certifique-se de que a URL está exatamente igual no Facebook e no `.env`
- Use `http://` para localhost e `https://` para produção

### "App não está em modo de desenvolvimento"
- Vá em Configurações → Básico
- Altere o Modo do App para **Desenvolvimento**

## Suporte Adicional

Se ainda tiver problemas:
1. Verifique os logs do servidor backend
2. Verifique o console do navegador (F12)
3. Verifique se o servidor está rodando na porta correta
4. Verifique se o arquivo `.env` está configurado corretamente

