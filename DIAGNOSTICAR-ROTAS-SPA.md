# 🔍 Diagnóstico: Rotas SPA não funcionando

## ⚠️ Problema

As URLs `/terms-of-service` e `/privacy-policy` não estão abrindo em produção.

## 🔍 Causa Provável

O Nginx não está configurado corretamente para servir uma SPA (Single Page Application). Em uma SPA, todas as rotas devem ser redirecionadas para `index.html`, permitindo que o React Router gerencie o roteamento no lado do cliente.

## ✅ Solução

### Passo 1: Verificar se os arquivos foram enviados

```bash
ssh root@92.113.33.226
ls -la /domains/biacrm.com/public_html/index.html
ls -la /domains/biacrm.com/public_html/assets/
```

Se os arquivos não existirem, envie o build:

```powershell
# No Windows (PowerShell)
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/
```

### Passo 2: Corrigir configuração do Nginx

Execute o script criado:

```bash
# 1. Enviar script
scp corrigir-nginx-spa-routes.sh root@92.113.33.226:/tmp/

# 2. Executar no servidor
ssh root@92.113.33.226
bash /tmp/corrigir-nginx-spa-routes.sh
```

### Passo 3: Verificar configuração manualmente (alternativa)

Se preferir fazer manualmente, edite o arquivo:

```bash
nano /etc/nginx/sites-available/biacrm.com
```

A configuração deve ter esta estrutura:

```nginx
server {
    listen 443 ssl http2;
    server_name biacrm.com www.biacrm.com;
    root /domains/biacrm.com/public_html;
    index index.html;

    # 1. PRIMEIRO: Servir arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$ {
        root /domains/biacrm.com/public_html;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 2. SEGUNDO: Proxy para API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. TERCEIRO: SPA Routing - CRÍTICO!
    # Esta linha faz TODAS as rotas redirecionarem para index.html
    location / {
        root /domains/biacrm.com/public_html;
        try_files $uri $uri/ /index.html;
    }
}
```

**IMPORTANTE**: A ordem das `location` blocks é crucial! Arquivos estáticos primeiro, depois API, depois SPA routing.

### Passo 4: Testar configuração e recarregar

```bash
# Testar configuração
nginx -t

# Se OK, recarregar
systemctl reload nginx
```

### Passo 5: Testar as rotas

```bash
# Testar se retorna HTML (não 404)
curl -I https://biacrm.com/terms-of-service
curl -I https://biacrm.com/privacy-policy

# Deve retornar:
# HTTP/2 200
# Content-Type: text/html
```

## 🧪 Testes

### Teste 1: Verificar se index.html existe
```bash
curl https://biacrm.com/ | head -20
```

### Teste 2: Verificar se arquivos estáticos são servidos
```bash
curl -I https://biacrm.com/assets/index-BhKHPTj0.js
# Deve retornar: Content-Type: application/javascript
```

### Teste 3: Verificar se rotas SPA funcionam
```bash
curl -I https://biacrm.com/terms-of-service
curl -I https://biacrm.com/privacy-policy
# Ambos devem retornar: HTTP/2 200
```

## 🔧 Troubleshooting

### Erro: 404 Not Found
- **Causa**: `try_files` não está configurado ou está incorreto
- **Solução**: Garanta que `location /` tem `try_files $uri $uri/ /index.html;`

### Erro: Arquivos estáticos retornam HTML
- **Causa**: Regra de arquivos estáticos não está antes da regra de SPA
- **Solução**: Reordene as `location` blocks (estáticos primeiro)

### Erro: Página em branco
- **Causa**: Arquivos JavaScript não estão sendo carregados
- **Solução**: Verifique permissões e se os arquivos existem em `/domains/biacrm.com/public_html/assets/`

### Erro: Console mostra erros de extensões do navegador
- **Causa**: Normal! Erros de ad blockers, MetaMask, etc. não afetam a aplicação
- **Solução**: Ignore esses erros, eles são de extensões do navegador

## 📋 Checklist

- [ ] Arquivos do build foram enviados para `/domains/biacrm.com/public_html/`
- [ ] `index.html` existe no diretório raiz
- [ ] Arquivos em `/domains/biacrm.com/public_html/assets/` existem
- [ ] Nginx tem regra para arquivos estáticos ANTES da regra de SPA
- [ ] Nginx tem `try_files $uri $uri/ /index.html;` na regra `location /`
- [ ] Nginx foi recarregado (`systemctl reload nginx`)
- [ ] Teste com `curl` mostra HTTP 200 para as rotas
- [ ] Cache do navegador foi limpo (Ctrl+Shift+R)

## 🚀 Após corrigir

As seguintes URLs devem funcionar:
- ✅ `https://biacrm.com/` (dashboard)
- ✅ `https://biacrm.com/login`
- ✅ `https://biacrm.com/terms-of-service`
- ✅ `https://biacrm.com/privacy-policy`
- ✅ `https://biacrm.com/leads`
- ✅ Qualquer outra rota do React Router

