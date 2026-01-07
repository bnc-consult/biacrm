# ⚠️ Configuração do Facebook App ID

## Problema Atual

O erro "ID do app inválido" ocorre porque o `FACEBOOK_APP_ID` não está configurado no arquivo `.env` do backend.

## ✅ Solução

O desenvolvedor/admin precisa configurar o `FACEBOOK_APP_ID` e `FACEBOOK_APP_SECRET` **uma única vez** no arquivo `.env` do servidor. Depois disso, todos os usuários poderão usar a integração sem precisar configurar nada.

### Passo 1: Obter as Credenciais do Facebook

1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app (ou crie um novo)
3. Vá em **Configurações** → **Básico**
4. Copie o **ID do App**
5. Clique em **"Mostrar"** ao lado de "Chave Secreta do App" e copie

### Passo 2: Configurar no Backend

Edite o arquivo `backend/.env` e adicione:

```env
FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui
```

**Exemplo:**
```env
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abc123def456ghi789jkl012mno345pq
```

### Passo 3: Reiniciar o Backend

Após configurar, reinicie o servidor backend para carregar as novas variáveis de ambiente.

## 🔒 Segurança

- O `.env` **NÃO** deve ser commitado no Git
- Apenas o desenvolvedor/admin tem acesso ao `.env`
- Os usuários finais **NÃO precisam** conhecer essas credenciais
- Uma vez configurado, funciona para todos os usuários

## 📝 Nota

O código já está preparado para validar essas credenciais e mostrar uma mensagem clara caso não estejam configuradas, orientando o usuário a entrar em contato com o administrador.







