# 🚀 Solução com ngrok - Mais Confiável para Instagram

## Por que usar ngrok?

O Facebook frequentemente rejeita `localhost` e `127.0.0.1` mesmo em modo desenvolvimento. O ngrok cria um túnel público HTTPS que resolve esse problema.

## Passo a Passo Completo

### 1. Instalar ngrok

**Windows:**
- Baixe de: https://ngrok.com/download
- Extraia o arquivo `ngrok.exe`
- Coloque em uma pasta no PATH ou use o caminho completo

**Ou use Chocolatey:**
```powershell
choco install ngrok
```

**Ou use winget (Windows 11):**
```powershell
winget install ngrok
```

### 2. Iniciar o Servidor Backend

Abra um terminal e execute:
```bash
cd backend
npm run dev
```

Deixe rodando. O servidor deve estar em `http://localhost:3000`

### 3. Iniciar ngrok

Abra **OUTRO terminal** e execute:
```bash
ngrok http 3000
```

Você verá algo assim:
```
ngrok                                                                              
                                                                                   
Session Status                online                                               
Account                       seu-email@exemplo.com (Plan: Free)                   
Version                      3.x.x                                                 
Region                       United States (us)                                    
Latency                      45ms                                                  
Web Interface                http://127.0.0.1:4040                                
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000
                                                                                   
Connections                   ttl     opn     rt1     rt5     p50     p90          
                              0       0       0.00    0.00    0.00    0.00        
```

**Copie a URL:** `https://abc123def456.ngrok-free.app` (a sua será diferente)

### 4. Configurar no Facebook Developers

#### 4.1 Adicionar Domínio
1. Acesse: https://developers.facebook.com/
2. Vá em **Meus Apps** → Selecione seu App
3. **Configurações** → **Básico**
4. Role até **Domínios do App**
5. Adicione: `abc123def456.ngrok-free.app` (sem `https://`)
6. Clique em **Salvar alterações**

#### 4.2 Adicionar URL de Redirecionamento
1. Vá em **Produtos** → **Facebook Login** → **Configurações**
2. Em **Configurações de Cliente OAuth**
3. Em **URIs de redirecionamento OAuth válidos**
4. Clique em **Adicionar URI**
5. Adicione: `https://abc123def456.ngrok-free.app/api/integrations/instagram/callback`
6. Clique em **Salvar alterações**

### 5. Atualizar arquivo .env

Abra `backend/.env` e atualize:

```env
INSTAGRAM_REDIRECT_URI=https://abc123def456.ngrok-free.app/api/integrations/instagram/callback
FRONTEND_URL=https://abc123def456.ngrok-free.app
```

**Substitua `abc123def456.ngrok-free.app` pela sua URL do ngrok!**

### 6. Reiniciar Servidor Backend

1. Pare o servidor (Ctrl+C)
2. Inicie novamente:
```bash
npm run dev
```

### 7. Testar

1. Abra o frontend
2. Tente conectar o Instagram
3. Deve funcionar sem erro de domínio!

## ⚠️ IMPORTANTE: URL do ngrok Muda

**Na versão gratuita do ngrok:**
- A URL muda toda vez que você reinicia o ngrok
- Você precisará atualizar no Facebook Developers e no `.env` sempre que reiniciar

**Solução:**
- Use ngrok com domínio fixo (versão paga)
- OU mantenha o ngrok rodando sem fechar
- OU use um domínio de produção

## Comandos Úteis

### Ver interface web do ngrok:
Abra no navegador: `http://127.0.0.1:4040`

### Ver requisições em tempo real:
O ngrok mostra todas as requisições na interface web

### Parar ngrok:
Pressione `Ctrl+C` no terminal do ngrok

## Troubleshooting

### ngrok não inicia
- Verifique se a porta 3000 está livre
- Verifique se o servidor backend está rodando
- Tente outra porta: `ngrok http 3001`

### Erro "tunnel not found"
- Verifique se o ngrok está rodando
- Verifique se a URL está correta
- Reinicie o ngrok

### Facebook ainda rejeita
- Aguarde 2-3 minutos após configurar
- Limpe cache do navegador
- Verifique se a URL no Facebook está EXATAMENTE igual ao .env

## Alternativa: ngrok com Domínio Fixo (Pago)

Se você quiser uma URL que não muda:

1. Crie conta no ngrok: https://dashboard.ngrok.com/
2. Obtenha authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure:
```bash
ngrok config add-authtoken seu-token-aqui
```
4. Use domínio reservado:
```bash
ngrok http 3000 --domain=seu-dominio-fixo.ngrok-free.app
```

## Próximos Passos

Após configurar com ngrok:
1. ✅ Teste a conexão do Instagram
2. ✅ Se funcionar, considere usar domínio fixo
3. ✅ Ou migre para domínio de produção quando possível


