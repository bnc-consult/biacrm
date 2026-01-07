# Configurar Facebook App para OAuth

## ⚠️ IMPORTANTE: Adicionar URIs de Redirecionamento

O código agora detecta automaticamente o ambiente, mas você **PRECISA** adicionar os URIs de redirecionamento no Facebook App:

### URIs que devem estar configurados no Facebook App:

1. **Desenvolvimento:**
   ```
   http://localhost:3000/api/integrations/facebook/callback
   ```

2. **Produção:**
   ```
   https://biacrm.com/api/integrations/facebook/callback
   ```

## 📋 Passo a Passo:

1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app do Facebook
3. Vá em **Configurações** → **Básico**
4. Role até **"URIs de redirecionamento OAuth válidos"**
5. Clique em **"Adicionar URI"**
6. Adicione ambos os URIs acima
7. Salve as alterações

## ✅ Como Funciona Agora:

- **Em desenvolvimento (localhost):** Usa automaticamente `http://localhost:3000/api/integrations/facebook/callback`
- **Em produção:** Usa automaticamente `https://biacrm.com/api/integrations/facebook/callback`
- **Se definir no .env:** Usa o valor do `FACEBOOK_REDIRECT_URI` (opcional)

**Não é mais necessário alterar o .env manualmente!** O código detecta automaticamente o ambiente.







