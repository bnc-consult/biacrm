# 🔧 Solução: Links de Termo de Serviço e Política de Privacidade não aparecem em produção

## ⚠️ Problema

Os links de Termo de Serviço e Política de Privacidade não estão aparecendo ou não estão funcionando em produção.

## 🔍 Possíveis Causas

1. **Build não foi enviado para produção**
2. **Nginx não configurado para rotas SPA** (já tivemos esse problema)
3. **Cache do navegador**
4. **Permissões incorretas nos arquivos**

## ✅ Solução Passo a Passo

### Passo 1: Verificar se o build foi enviado

```bash
ssh root@92.113.33.226
ls -lh /domains/biacrm.com/public_html/index.html
```

Se o arquivo não existir ou estiver muito antigo, você precisa enviar o build.

### Passo 2: Enviar build para produção

**No seu computador (Windows PowerShell):**

```powershell
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/
```

**Ou use SFTP/FTP** para enviar os arquivos.

### Passo 3: Corrigir permissões

**No servidor:**

```bash
ssh root@92.113.33.226
chmod 755 /domains/biacrm.com/public_html
find /domains/biacrm.com/public_html -type d -exec chmod 755 {} \;
find /domains/biacrm.com/public_html -type f -exec chmod 644 {} \;
```

### Passo 4: Corrigir configuração do Nginx (CRÍTICO!)

Este é provavelmente o problema principal. O Nginx precisa estar configurado para rotas SPA.

**Enviar script de correção:**

```powershell
scp corrigir-tudo-spa.sh root@92.113.33.226:/tmp/
```

**Executar no servidor:**

```bash
ssh root@92.113.33.226
bash /tmp/corrigir-tudo-spa.sh
```

### Passo 5: Verificar se está funcionando

**Testar rotas:**

```bash
curl -I https://biacrm.com/terms-of-service
curl -I https://biacrm.com/privacy-policy
```

Ambos devem retornar `HTTP/2 200`.

**No navegador:**

1. Limpe o cache: `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)
2. Acesse: `https://biacrm.com`
3. Role até o final da página - deve aparecer um rodapé com os links
4. Ou verifique o rodapé da sidebar (quando expandida)

### Passo 6: Executar diagnóstico completo

**Enviar script de diagnóstico:**

```powershell
scp verificar-links-producao.sh root@92.113.33.226:/tmp/
```

**Executar:**

```bash
ssh root@92.113.33.226
bash /tmp/verificar-links-producao.sh
```

## 📋 Checklist Rápido

- [ ] Build foi gerado localmente (`npm run build` no frontend)
- [ ] Arquivos foram enviados para `/domains/biacrm.com/public_html/`
- [ ] Permissões estão corretas (755 para diretórios, 644 para arquivos)
- [ ] Nginx está configurado para SPA (`try_files $uri $uri/ /index.html;`)
- [ ] Nginx foi recarregado (`systemctl reload nginx`)
- [ ] Cache do navegador foi limpo
- [ ] Rotas respondem com 200 (`curl -I https://biacrm.com/terms-of-service`)

## 🎯 Onde os Links Devem Aparecer

### 1. Rodapé Fixo (Parte Inferior da Página)
- **Sempre visível** na parte inferior da área de conteúdo principal
- Links: `Termos de Serviço | Política de Privacidade`

### 2. Rodapé da Sidebar
- Quando sidebar **expandida**: texto completo com links
- Quando sidebar **fechada**: ícones clicáveis (📄 🔒)

### 3. Página de Login
- Rodapé do formulário com links clicáveis

## 🔧 Comandos Rápidos (Tudo de Uma Vez)

```bash
# 1. Conectar ao servidor
ssh root@92.113.33.226

# 2. Verificar build atual
ls -lh /domains/biacrm.com/public_html/index.html

# 3. Corrigir Nginx (se necessário)
bash /tmp/corrigir-tudo-spa.sh

# 4. Corrigir permissões
chmod 755 /domains/biacrm.com/public_html
find /domains/biacrm.com/public_html -type d -exec chmod 755 {} \;
find /domains/biacrm.com/public_html -type f -exec chmod 644 {} \;

# 5. Testar rotas
curl -I https://biacrm.com/terms-of-service
curl -I https://biacrm.com/privacy-policy

# 6. Ver logs se houver erro
tail -50 /var/log/nginx/error.log
```

## ⚠️ Problema Mais Comum

O problema mais comum é que o **Nginx não está configurado para rotas SPA**. 

Quando você acessa `/terms-of-service`, o Nginx precisa redirecionar para `index.html` para que o React Router possa gerenciar a rota.

**Solução:** Execute `bash /tmp/corrigir-tudo-spa.sh` no servidor.

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs do Nginx:**
   ```bash
   tail -100 /var/log/nginx/error.log | grep -i "terms\|privacy\|404"
   ```

2. **Verifique se os componentes estão no build:**
   ```bash
   grep -i "TermsOfService\|PrivacyPolicy" /domains/biacrm.com/public_html/assets/*.js
   ```

3. **Teste localmente primeiro:**
   - Execute `npm run dev` no frontend
   - Acesse `http://localhost:5173/terms-of-service`
   - Se funcionar localmente, o problema é de deploy/configuração

4. **Verifique o console do navegador:**
   - Abra DevTools (F12)
   - Vá para a aba Console
   - Procure por erros JavaScript

## 📞 Suporte

Se nada funcionar, execute o diagnóstico completo e compartilhe os resultados:

```bash
bash /tmp/verificar-links-producao.sh > diagnostico-links.txt
cat diagnostico-links.txt
```






