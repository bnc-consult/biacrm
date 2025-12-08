# ✅ Corrigir URI de Redirecionamento no Facebook

## 🔍 Problema Identificado

No seu Facebook Developer, a URI de redirecionamento está configurada como:
```
https://phraseological-curmudgeonly-trudi.ngrok-free.dev
```

Mas precisa incluir o **caminho completo do callback**:
```
https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
```

## ✅ Solução: Adicionar Caminho Completo

### Passo 1: No Facebook Developer

1. **Vá em:** Login do Facebook → Configurações
2. **Na seção "URIs de redirecionamento do OAuth válidos":**
   - **Remova** a URI atual: `https://phraseological-curmudgeonly-trudi.ngrok-free.dev`
   - **Adicione** a URI completa:
     ```
     https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
     ```
3. **Clique em "Salvar alterações"**

### Passo 2: Configurar Variável de Ambiente

Adicione ou atualize no arquivo `backend/.env`:

```env
INSTAGRAM_REDIRECT_URI=https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
FRONTEND_URL=https://phraseological-curmudgeonly-trudi.ngrok-free.dev
```

### Passo 3: Reiniciar Servidor

Após atualizar o `.env`, reinicie o servidor backend:

```bash
cd backend
npm run dev
```

## ⚠️ Importante

- ✅ A URI no Facebook **DEVE corresponder EXATAMENTE** à URI usada no código
- ✅ Como "Usar modo estrito" está habilitado, qualquer diferença causará erro
- ✅ O caminho completo é: `/api/integrations/instagram/callback`

## 🔄 Se a URL do ngrok Mudar

Se você reiniciar o ngrok e ele gerar uma nova URL:

1. **Atualize no Facebook Developer** com a nova URL completa
2. **Atualize o `.env`** com a nova URL
3. **Reinicie o servidor backend**

## ✅ Checklist

- [ ] Removi a URI incompleta do Facebook
- [ ] Adicionei a URI completa com `/api/integrations/instagram/callback`
- [ ] Atualizei `INSTAGRAM_REDIRECT_URI` no `.env`
- [ ] Reiniciei o servidor backend
- [ ] Testei a conexão do Instagram

A URI precisa corresponder **EXATAMENTE** ao que está no código!


