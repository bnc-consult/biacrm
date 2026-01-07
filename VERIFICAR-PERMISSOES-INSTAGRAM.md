# 🔍 Verificar Permissões no Instagram.js

## ✅ Arquivo Foi Enviado

O arquivo foi enviado com sucesso para o servidor!

---

## 🔍 Comandos para Verificar Permissões

### Opção 1: Verificar Ambas as Permissões (Recomendado)

```bash
ssh root@92.113.33.226 "grep -E 'public_profile|pages_show_list' /var/www/biacrm/api/routes/instagram.js"
```

**Ou usando aspas simples com escape:**

```bash
ssh root@92.113.33.226 'grep -E "public_profile|pages_show_list" /var/www/biacrm/api/routes/instagram.js'
```

---

### Opção 2: Verificar Separadamente (Mais Simples)

```bash
# Verificar public_profile
ssh root@92.113.33.226 'grep public_profile /var/www/biacrm/api/routes/instagram.js'

# Verificar pages_show_list
ssh root@92.113.33.226 'grep pages_show_list /var/www/biacrm/api/routes/instagram.js'
```

---

### Opção 3: Verificar Ambas em Uma Linha

```bash
ssh root@92.113.33.226 "grep public_profile /var/www/biacrm/api/routes/instagram.js && grep pages_show_list /var/www/biacrm/api/routes/instagram.js"
```

---

## ✅ Resultado Esperado

Se as permissões estiverem no arquivo, você deve ver algo como:

```
'public_profile', // Perfil público do usuário (sempre válida)
'pages_show_list' // Listar páginas do Facebook (necessária para Instagram Business)
```

Ou:

```
const scopes = [
    'public_profile',
    'pages_show_list'
].join(',');
```

---

## 📋 Próximos Passos

### 1. Verificar Permissões

Execute um dos comandos acima para confirmar que as permissões estão no arquivo.

### 2. Reiniciar Backend

```bash
ssh root@92.113.33.226 'pm2 restart biacrm-backend --update-env'
```

### 3. Verificar Logs

```bash
ssh root@92.113.33.226 'pm2 logs biacrm-backend --lines 30 | grep -i "instagram\|scope"'
```

Procure por logs que mostrem:
```
Scopes: public_profile,pages_show_list
```

### 4. Testar Integração

Após reiniciar, teste a integração do Instagram novamente. O erro "supported permission" deve ser resolvido.

---

## ⚠️ Se Permissões Não Aparecerem

Se o grep não encontrar as permissões:

1. **Verifique se o arquivo foi enviado corretamente:**
   ```bash
   ssh root@92.113.33.226 'ls -lrt /var/www/biacrm/api/routes/instagram.js'
   ```
   - Data deve ser recente (agora)

2. **Verifique tamanho do arquivo:**
   ```bash
   ssh root@92.113.33.226 'wc -l /var/www/biacrm/api/routes/instagram.js'
   ```
   - Deve ter aproximadamente 800+ linhas

3. **Envie novamente:**
   ```bash
   scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/routes/instagram.js
   ```

---

## 🎯 Comando Completo (Verificar + Reiniciar)

```bash
# Verificar permissões
ssh root@92.113.33.226 'grep public_profile /var/www/biacrm/api/routes/instagram.js'

# Se aparecer, reiniciar
ssh root@92.113.33.226 'pm2 restart biacrm-backend --update-env'
```

---

## ✅ Checklist

- [ ] Arquivo foi enviado para servidor
- [ ] Permissões foram verificadas no servidor
- [ ] Backend foi reiniciado
- [ ] Logs mostram as permissões sendo usadas
- [ ] Testou a integração do Instagram





