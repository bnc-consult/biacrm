# 🌐 Configurar Domínio bncconsultoria.com

## 📋 Objetivo

Configurar o domínio `https://bncconsultoria.com/` para servir a página da BNC Consultoria criada na aplicação.

## 🔧 Passo a Passo

### 1. Configurar DNS

No seu provedor de DNS (onde o domínio `bncconsultoria.com` está registrado):

**Adicionar registros A:**
- **Nome/Host:** `@` ou `bncconsultoria.com`
- **Tipo:** A
- **Valor/IP:** `92.113.33.226`
- **TTL:** 3600 (ou padrão)

- **Nome/Host:** `www`
- **Tipo:** A
- **Valor/IP:** `92.113.33.226`
- **TTL:** 3600 (ou padrão)

**Ou usando CNAME para www:**
- **Nome/Host:** `www`
- **Tipo:** CNAME
- **Valor:** `bncconsultoria.com`
- **TTL:** 3600

### 2. Executar Script de Configuração do Nginx

**No servidor:**

```bash
# Enviar script
scp configurar-bncconsultoria-domain.sh root@92.113.33.226:/tmp/

# Executar
ssh root@92.113.33.226
bash /tmp/configurar-bncconsultoria-domain.sh
```

### 3. Configurar Certificado SSL

Após o DNS propagar (pode levar algumas horas), configure o certificado SSL:

```bash
# Instalar certbot se não tiver
apt-get update
apt-get install certbot python3-certbot-nginx -y

# Gerar certificado SSL
certbot --nginx -d bncconsultoria.com -d www.bncconsultoria.com
```

O certbot vai:
- Gerar o certificado SSL automaticamente
- Configurar o Nginx automaticamente
- Configurar renovação automática

### 4. Atualizar Configuração do Nginx (se necessário)

Se o certbot não atualizar automaticamente, edite manualmente:

```bash
nano /etc/nginx/sites-available/bncconsultoria.com
```

Descomente e atualize as linhas SSL:
```nginx
ssl_certificate /etc/letsencrypt/live/bncconsultoria.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/bncconsultoria.com/privkey.pem;
```

### 5. Recarregar Nginx

```bash
nginx -t  # Validar configuração
systemctl reload nginx  # Recarregar
```

## ✅ Verificação

Após configurar tudo, teste:

```bash
# Testar localmente
curl -I http://localhost/bncconsultoria

# Testar com domínio (após DNS propagar)
curl -I https://bncconsultoria.com/
```

Deve retornar `HTTP/2 301` (redirecionamento para `/bncconsultoria`) ou `HTTP/2 200`.

## 🔍 Como Funciona

1. **Acesso a `https://bncconsultoria.com/`:**
   - Nginx redireciona para `/bncconsultoria`
   - A aplicação React Router carrega a página `BNCConsultoria.tsx`

2. **Arquivos estáticos:**
   - Servidos do mesmo diretório `/domains/biacrm.com/public_html`
   - Compartilha o mesmo build do biacrm.com

3. **SPA Routing:**
   - Todas as rotas são redirecionadas para `index.html`
   - React Router gerencia o roteamento

## 📝 Notas Importantes

- **DNS pode levar até 48 horas para propagar completamente**
- **Certificado SSL só pode ser gerado após DNS estar funcionando**
- **O build precisa estar atualizado** com a página `/bncconsultoria`
- **Ambos os domínios compartilham o mesmo build** (biacrm.com e bncconsultoria.com)

## 🆘 Troubleshooting

### DNS não está resolvendo

```bash
# Verificar DNS
dig bncconsultoria.com
nslookup bncconsultoria.com

# Deve retornar: 92.113.33.226
```

### Certificado SSL não funciona

```bash
# Verificar certificado
certbot certificates

# Renovar manualmente se necessário
certbot renew --dry-run
```

### Página não carrega

```bash
# Verificar logs do Nginx
tail -50 /var/log/nginx/error.log

# Verificar se a rota está correta
curl -I http://localhost/bncconsultoria
```

## 🚀 Após Configurar

A página estará disponível em:
- `https://bncconsultoria.com/` → Redireciona para `/bncconsultoria`
- `https://bncconsultoria.com/bncconsultoria` → Página da BNC Consultoria
- `https://www.bncconsultoria.com/` → Mesmo comportamento






