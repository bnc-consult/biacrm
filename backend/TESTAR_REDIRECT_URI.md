# 🧪 Como Testar se a URL de Redirecionamento Está Funcionando

## Teste Rápido

### 1. Verificar se o servidor está rodando
```bash
cd backend
npm run dev
```

O servidor deve estar rodando em `http://localhost:3000`

### 2. Testar o endpoint de callback diretamente
Abra no navegador:
```
http://localhost:3000/api/integrations/instagram/callback
```

**Resultado esperado:**
- Se aparecer uma mensagem de erro sobre "Código de autorização não fornecido", significa que o endpoint está funcionando ✅
- Se aparecer erro 404, o endpoint não está configurado ❌

### 3. Verificar a URL configurada no código
A URL que você configurar no Facebook Developers deve ser **exatamente igual** à URL no arquivo `.env`.

**Verificar no `.env`:**
```env
INSTAGRAM_REDIRECT_URI=http://127.0.0.1:3000/api/integrations/instagram/callback
```

**Configurar no Facebook Developers:**
- Deve ser: `http://127.0.0.1:3000/api/integrations/instagram/callback`
- **Exatamente igual**, incluindo `http://` e a porta `:3000`

## Checklist de Configuração no Facebook Developers

### Passo 1: Configurações Básicas
- [ ] Vá em **Configurações** → **Básico**
- [ ] **Modo do App**: Deve estar como **Desenvolvimento**
- [ ] **Domínios do App**: Adicione:
  - `localhost`
  - `127.0.0.1`
  - Seu domínio de produção (ex: `biacrm.com`)

### Passo 2: Facebook Login
- [ ] Vá em **Produtos** → **Facebook Login** → **Configurações**
- [ ] Em **Configurações de Cliente OAuth**:
  - [ ] **URIs de redirecionamento OAuth válidos**: Adicione:
    - `http://127.0.0.1:3000/api/integrations/instagram/callback`
    - `http://localhost:3000/api/integrations/instagram/callback`
    - `https://biacrm.com/api/integrations/instagram/callback` (produção)

### Passo 3: Instagram Graph API
- [ ] Vá em **Produtos** → **Instagram Graph API**
- [ ] Certifique-se de que está **Configurado**

## Erros Comuns e Soluções

### Erro: "URL de redirecionamento inválida"
**Causa:** URL não está configurada ou está diferente
**Solução:**
1. Verifique se a URL está exatamente igual no Facebook e no `.env`
2. Certifique-se de usar `http://` para localhost
3. Verifique se não há espaços extras

### Erro: "O domínio da URL não está na lista de domínios do app"
**Causa:** Domínio não foi adicionado nas configurações básicas
**Solução:**
1. Vá em **Configurações** → **Básico** → **Domínios do App**
2. Adicione `localhost` e `127.0.0.1`

### Erro: "App não está em modo de desenvolvimento"
**Causa:** App está em modo de produção
**Solução:**
1. Vá em **Configurações** → **Básico**
2. Altere o **Modo do App** para **Desenvolvimento**

## URLs Recomendadas por Ambiente

### Desenvolvimento Local
```
http://127.0.0.1:3000/api/integrations/instagram/callback
```
ou
```
http://localhost:3000/api/integrations/instagram/callback
```

### Desenvolvimento com ngrok
```
https://seu-subdominio.ngrok.io/api/integrations/instagram/callback
```

### Produção
```
https://biacrm.com/api/integrations/instagram/callback
```

## Verificação Final

Após configurar tudo:

1. ✅ Verifique se o servidor está rodando
2. ✅ Verifique se a URL no `.env` está correta
3. ✅ Verifique se a URL no Facebook Developers está igual
4. ✅ Verifique se os domínios estão adicionados
5. ✅ Reinicie o servidor backend
6. ✅ Tente conectar o Instagram novamente

Se ainda não funcionar, verifique os logs do servidor para mensagens de erro específicas.


