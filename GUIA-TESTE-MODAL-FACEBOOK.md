# 📋 Guia de Teste - Modal de Seleção Facebook

## ✅ O que foi implementado

1. **Modal de seleção** aparece após conectar Facebook
2. **Primeiro combo**: Mostra todas as páginas do Facebook do usuário
3. **Segundo combo**: Mostra formulários da página selecionada
4. **Seleção automática**: Primeira página e primeiro formulário são selecionados automaticamente

## 🧪 Como testar

### Passo 1: Limpar cache do navegador
- Pressione `Ctrl + Shift + Delete`
- Selecione "Imagens e arquivos em cache"
- Clique em "Limpar dados"
- Feche e abra o navegador novamente

### Passo 2: Conectar Facebook
1. Acesse: `https://biacrm.com/entrada-saida`
2. Clique em **"+ Adicionar integração"**
3. Selecione **"Facebook"**
4. Clique em **"Conectar Facebook"**
5. Autorize com suas credenciais do Facebook

### Passo 3: Verificar o modal
Após autorizar, o modal deve aparecer com:

**✅ Primeiro combo (Páginas):**
- Deve mostrar todas as páginas do Facebook que você gerencia
- Exemplo: "Minha Página", "Página Empresarial", etc.
- Se não houver páginas, mostrará "Conta Pessoal"

**✅ Segundo combo (Formulários):**
- Deve estar desabilitado inicialmente
- Após selecionar uma página, deve mostrar os formulários dessa página
- Se não houver formulários, mostrará "Nenhum formulário disponível"

### Passo 4: Selecionar e continuar
1. Selecione uma página no primeiro combo (se não estiver selecionada)
2. Aguarde os formulários carregarem
3. Selecione um formulário no segundo combo (se não estiver selecionado)
4. Clique em **"Próximo"**
5. A integração deve ser criada com sucesso

## 🔍 Verificar logs (se algo não funcionar)

### Abrir console do navegador
1. Pressione `F12` para abrir DevTools
2. Vá na aba **"Console"**
3. Procure por logs que começam com:
   - `📄` - Informações sobre páginas
   - `✅` - Confirmações de sucesso
   - `🔍` - Buscas em andamento
   - `❌` - Erros

### Logs esperados (sucesso):
```
🚀 Abrindo modal de seleção de páginas e formulários...
✅ Modal aberto. showFacebookFormModal: true
📄 Páginas parseadas do callback: { pagesCount: X, pages: [...] }
✅ Usando páginas do callback: X
✅ Definindo páginas no estado: { count: X, pages: [...] }
📄 Selecionando primeira página: { id: "...", name: "..." }
🔍 Buscando formulários da primeira página...
✅ Formulários recebidos: { count: X, forms: [...] }
✅ Carregamento concluído. Modal deve estar visível com dados.
```

### Se aparecer erro:
- Copie a mensagem de erro completa
- Verifique na aba **Network** (F12 → Network) se há requisições falhando
- Envie os logs para análise

## ⚠️ Problemas comuns

### Modal não aparece
- **Solução**: Limpar cache do navegador e tentar novamente
- **Verificar**: Console do navegador para erros

### Combos estão vazios
- **Verificar**: Console do navegador para logs
- **Verificar**: Network tab para ver se as requisições estão sendo feitas
- **Possível causa**: Token do Facebook inválido ou sem permissões

### Formulários não aparecem
- **Verificar**: Se a página selecionada tem formulários cadastrados no Facebook
- **Verificar**: Console para erros ao buscar formulários
- **Nota**: É normal não ter formulários se a página não tiver nenhum cadastrado

## 📊 Informações para reportar problemas

Se algo não funcionar, colete:

1. **Screenshot do modal** (se aparecer)
2. **Todos os logs do console** (F12 → Console → Copiar tudo)
3. **Screenshot da aba Network** (F12 → Network → Filtrar por "facebook")
4. **URL completa** após redirecionamento do Facebook
5. **Descrição do problema** (o que aconteceu vs o que deveria acontecer)

## ✅ Checklist de verificação

Após testar, verifique:

- [ ] Modal aparece após autorizar Facebook
- [ ] Primeiro combo mostra páginas do Facebook
- [ ] É possível selecionar uma página diferente
- [ ] Segundo combo mostra formulários após selecionar página
- [ ] É possível selecionar um formulário
- [ ] Botão "Próximo" fica habilitado quando ambos estão selecionados
- [ ] Integração é criada com sucesso ao clicar em "Próximo"

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs no console
2. Verifique a aba Network
3. Limpe o cache e tente novamente
4. Reporte o problema com as informações coletadas acima

