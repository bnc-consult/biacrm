# 🌐 Configurar bncconsultoria.com

## 📋 Objetivo

Configurar o domínio `bncconsultoria.com` para servir a página da BNC Consultoria que está em `/bncconsultoria` na aplicação React.

## 🔧 Passo a Passo

### 1. Configurar DNS

No seu provedor de domínio (Hostinger, Registro.br, etc.), configure os registros DNS:

```
Tipo: A
Nome: @ (ou bncconsultoria.com)
Valor: 92.113.33.226
TTL: 3600

Tipo: A
Nome: www
Valor: 92.113.33.226
TTL: 3600
```

### 2. Executar Script de Configuração

**No servidor:**

```bash
# Enviar script
scp configurar-bncconsultoria-com.sh root@92.113.33.226:/tmp/

# Executar
ssh root@92.113.33.226
bash /tmp/configurar-bncconsultoria-com.sh
```

### 3. Configurar SSL (Let's Encrypt)

**Após o DNS propagar (pode levar algumas horas):**

```bash
# Instalar certbot se não tiver
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d bncconsultoria.com -d www.bncconsultoria.com

# Seguir as instruções do certbot
```

### 4. Atualizar Configuração do Nginx

Após obter o certificado SSL, o certbot deve atualizar automaticamente. Se não atualizar, edite manualmente:

```bash
nano /etc/nginx/sites-available/bncconsultoria.com
```

Descomente e ajuste as linhas SSL:

```nginx
ssl_certificate /etc/letsencrypt/live/bncconsultoria.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/bncconsultoria.com/privkey.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
```

### 5. Recarregar Nginx

```bash
nginx -t  # Validar
systemctl reload nginx
```

## 🧪 Testar

### Teste Local (no servidor):

```bash
# Testar HTTP (deve redirecionar para HTTPS)
curl -I http://localhost/bncconsultoria

# Testar se a página carrega
curl http://localhost/bncconsultoria | head -20
```

### Teste em Produção:

1. Acesse: `https://bncconsultoria.com`
2. Deve redirecionar automaticamente para: `https://bncconsultoria.com/bncconsultoria`
3. A página da BNC Consultoria deve aparecer

## 📝 Configuração Atual

A configuração criada:
- Redireciona `http://bncconsultoria.com` → `https://bncconsultoria.com`
- Redireciona `/` → `/bncconsultoria`
- Serve os mesmos arquivos estáticos de `/domains/biacrm.com/public_html`
- Configurado para SPA (Single Page Application)

## ⚠️ Importante

1. **DNS**: O DNS precisa estar configurado antes de obter o certificado SSL
2. **SSL**: Sem SSL configurado, o site não funcionará corretamente em produção
3. **Build**: Certifique-se de que o build mais recente foi enviado para `/domains/biacrm.com/public_html/`

## 🔄 Atualizar Conteúdo

Para atualizar o conteúdo da página BNC Consultoria:

1. Edite: `frontend/src/pages/BNCConsultoria.tsx`
2. Gere build: `cd frontend && npm run build`
3. Envie para produção: `scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/`

## 🆘 Troubleshooting

### Erro: "SSL certificate problem"
- Verifique se o DNS está configurado corretamente
- Aguarde a propagação do DNS (pode levar até 48 horas)
- Verifique se o certificado SSL foi obtido: `certbot certificates`

### Erro: "502 Bad Gateway"
- Verifique se o Nginx está rodando: `systemctl status nginx`
- Verifique os logs: `tail -50 /var/log/nginx/error.log`

### Página não aparece
- Verifique se o build foi enviado: `ls -lh /domains/biacrm.com/public_html/index.html`
- Verifique se a rota `/bncconsultoria` existe no build
- Limpe o cache do navegador: `Ctrl + Shift + R`

## 📞 Suporte

Se tiver problemas, execute o diagnóstico:

```bash
bash /tmp/verificar-build-producao.sh
```

