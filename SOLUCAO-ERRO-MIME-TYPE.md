# 🔧 Solução: Erro MIME Type "text/html" em vez de JavaScript

## ⚠️ Problema

O erro `Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"` indica que o Nginx está retornando HTML em vez de JavaScript para os arquivos `.js`.

## 🔍 Causa

Isso geralmente acontece quando:
1. O Nginx está configurado com `try_files` que redireciona **tudo** para `index.html` (incluindo arquivos estáticos que existem)
2. A configuração de `location` para arquivos estáticos não está correta
3. Os arquivos JavaScript não foram enviados corretamente para o servidor

## ✅ Solução

### 1. Verificar se os arquivos foram enviados

```bash
ssh root@92.113.33.226
ls -lh /domains/biacrm.com/public_html/assets/*.js
```

Se não houver arquivos `.js`, você precisa enviá-los novamente:

```powershell
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/
```

### 2. Corrigir configuração do Nginx

A configuração do Nginx deve ter uma regra específica para arquivos estáticos **ANTES** da regra de SPA routing:

```nginx
server {
    listen 443 ssl http2;
    server_name biacrm.com www.biacrm.com;
    root /domains/biacrm.com/public_html;
    index index.html;

    # IMPORTANTE: Servir arquivos estáticos ANTES da regra de SPA
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$ {
        root /domains/biacrm.com/public_html;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Proxy para API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA Routing - APENAS para rotas que não são arquivos estáticos
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. Aplicar a correção

```bash
# Editar configuração
nano /etc/nginx/sites-available/biacrm.com

# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx
```

### 4. Verificar tipos MIME

Certifique-se de que o Nginx está configurado com tipos MIME corretos:

```bash
# Verificar se os tipos MIME estão configurados
grep -r "application/javascript" /etc/nginx/

# Se não estiver, adicionar em /etc/nginx/mime.types ou na configuração do site
```

### 5. Limpar cache do navegador

Após corrigir, limpe o cache do navegador:
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

## 🧪 Teste

Após aplicar a correção, teste se os arquivos JavaScript estão sendo servidos corretamente:

```bash
curl -I https://biacrm.com/assets/index-DeamxfB_.js
```

Deve retornar:
```
Content-Type: application/javascript
```

E não:
```
Content-Type: text/html
```

## 📋 Checklist

- [ ] Arquivos JavaScript existem em `/domains/biacrm.com/public_html/assets/`
- [ ] Configuração do Nginx tem regra para arquivos estáticos antes da regra de SPA
- [ ] Nginx foi recarregado (`systemctl reload nginx`)
- [ ] Cache do navegador foi limpo
- [ ] Teste com `curl` mostra `Content-Type: application/javascript`

## 🔗 Arquivos Relacionados

- Configuração do Nginx: `/etc/nginx/sites-available/biacrm.com`
- Frontend build: `frontend/dist/`
- Script de verificação: `corrigir-nginx-mime-types.sh`


