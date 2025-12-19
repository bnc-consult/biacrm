# Guia Completo: Configurar Facebook App para Produção

## 📋 Permissões Atualmente Usadas

Com base no código, o aplicativo usa as seguintes permissões e endpoints:

### Permissões OAuth:
- `public_profile` - Perfil público do usuário (não requer revisão)
- `pages_show_list` - Listar páginas do Facebook (pode requerer revisão para produção)

### Endpoints da API Usados:
- `/me` - Obter informações do usuário
- `/me/accounts` - Listar páginas do usuário
- `/{page_id}/leadgen_forms` - Obter formulários de leads
- `/{form_id}/leads` - Obter leads dos formulários

---

## 🔧 Passo a Passo para Configuração em Produção

### 1. Configurações Básicas do App

Acesse: https://developers.facebook.com/apps → Selecione seu app → **Configurações do app → Básico**

#### Campos Obrigatórios:

1. **ID do Aplicativo**: `1384557166556562` (já configurado)
2. **Chave Secreta do Aplicativo**: (já configurada)
3. **Nome de exibição**: `BIACRM - Test1` (ou o nome final)
4. **Domínios do aplicativo**: 
   ```
   biacrm.com
   ```
   ⚠️ **Importante**: Adicione apenas o domínio raiz, sem `http://` ou `https://`

5. **URL da Política de Privacidade**: 
   ```
   https://biacrm.com/privacy-policy
   ```
   ✅ **Já criada na aplicação** - Acesse: https://biacrm.com/privacy-policy

6. **URL dos Termos de Serviço**: 
   ```
   https://biacrm.com/terms-of-service
   ```
   ✅ **Já criada na aplicação** - Acesse: https://biacrm.com/terms-of-service

7. **Categoria**: `Negócio e Páginas` (já configurado)

---

### 2. Configurar Login do Facebook

Acesse: **Produtos → Login do Facebook → Configurações**

#### URLs de Redirecionamento OAuth Válidas:

Adicione todas as URLs de callback:

```
https://biacrm.com/api/integrations/facebook/callback
http://localhost:3000/api/integrations/facebook/callback
```

⚠️ **Importante**: 
- Adicione uma URL por linha
- Use `https://` para produção
- Use `http://localhost:3000` apenas para desenvolvimento local

#### Configurações Adicionais:

- **Modo de App**: Mude de "Desenvolvimento" para **"Produção"** quando estiver pronto
- **Permissões de Login**: Configure as permissões que você precisa

---

### 3. Solicitar Permissões que Requerem Revisão

Algumas permissões precisam ser revisadas pelo Facebook antes de serem usadas em produção.

#### Permissões que Podem Precisar de Revisão:

1. **`pages_show_list`** - Listar páginas do usuário
   - **Status**: Pode funcionar sem revisão, mas pode ser limitado
   - **Quando revisar**: Se você precisar listar páginas de outros usuários ou se houver limitações

2. **`pages_read_engagement`** - Ler engajamento de páginas
   - **Status**: Requer revisão para produção
   - **Uso**: Se você precisar ler métricas de engajamento

3. **`leads_retrieval`** - Acessar leads do Facebook
   - **Status**: **REQUER REVISÃO OBRIGATÓRIA** para produção
   - **Uso**: Para acessar leads dos formulários do Facebook
   - **⚠️ CRÍTICO**: Sem esta permissão aprovada, você não conseguirá acessar leads em produção

#### Como Solicitar Revisão de Permissões:

1. Acesse: **Produtos → Login do Facebook → Permissões e Recursos**
2. Encontre a permissão que precisa de revisão (ex: `leads_retrieval`)
3. Clique em **"Solicitar"** ou **"Revisar"**
4. Preencha o formulário de revisão:
   - **Como você usa esta permissão?**: Explique que você usa para sincronizar leads do Facebook com seu CRM
   - **Onde você usa esta permissão?**: Forneça screenshots da funcionalidade no seu app
   - **Política de Privacidade**: Deve estar configurada e acessível
   - **Termos de Serviço**: Devem estar configurados e acessíveis

---

### 4. Configurar Recursos que Requerem Revisão

Alguns recursos também precisam de revisão:

#### Recursos Necessários:

1. **Page Public Content Access** (se necessário)
   - Para acessar conteúdo público de páginas
   - Acesse: **Produtos → Recursos → Page Public Content Access**

2. **Page Public Metadata Access** (se necessário)
   - Para acessar metadados públicos de páginas
   - Acesse: **Produtos → Recursos → Page Public Metadata Access**

---

### 5. Checklist para Produção

Antes de mudar para produção, verifique:

- [ ] **Domínios do aplicativo** configurados corretamente
- [ ] **URLs de redirecionamento OAuth** configuradas
- [ ] **Política de Privacidade** criada e acessível
- [ ] **Termos de Serviço** criados e acessíveis
- [ ] **Permissões básicas** (`public_profile`) funcionando
- [ ] **Permissões avançadas** (`pages_show_list`, `leads_retrieval`) solicitadas para revisão
- [ ] **Screenshots e documentação** preparados para revisão
- [ ] **App testado** em modo de desenvolvimento
- [ ] **Modo de App** mudado para "Produção" após aprovação

---

### 6. Mudar para Modo de Produção

⚠️ **ATENÇÃO**: Só mude para produção após:
1. Todas as permissões necessárias serem aprovadas
2. Testes completos em modo de desenvolvimento
3. Política de privacidade e termos de serviço estarem acessíveis

**Como mudar:**

1. Acesse: **Configurações do app → Básico**
2. Role até a seção **"Modo de App"**
3. Clique em **"Mudar para Produção"**
4. Confirme a mudança

---

### 7. Documentação Necessária para Revisão

Quando solicitar revisão de permissões, você precisará fornecer:

#### Para `leads_retrieval`:

1. **Screenshots** mostrando:
   - Onde os leads aparecem no seu CRM
   - Como o usuário autoriza a integração
   - Como os dados são usados

2. **Descrição do uso**:
   ```
   Nosso aplicativo sincroniza leads do Facebook com nosso sistema CRM. 
   Quando um usuário autoriza a integração, buscamos leads dos formulários 
   do Facebook associados às suas páginas e os importamos para o CRM, 
   permitindo que o usuário gerencie todos os seus leads em um único lugar.
   ```

3. **URLs de demonstração** (se aplicável):
   - Link para uma demo do app
   - Vídeo mostrando o fluxo completo

---

### 8. Permissões que NÃO Precisam de Revisão

Estas permissões funcionam imediatamente:

- ✅ `public_profile` - Perfil público do usuário
- ✅ `email` - Email do usuário (se configurado no app)

---

### 9. Troubleshooting

#### Erro: "App não está em modo de produção"
- **Solução**: Mantenha em modo de desenvolvimento até que todas as permissões sejam aprovadas

#### Erro: "Permissão não aprovada"
- **Solução**: Solicite revisão da permissão específica

#### Erro: "Domínio não autorizado"
- **Solução**: Verifique se o domínio está exatamente como `biacrm.com` (sem espaços, sem protocolo)

#### Erro: "URL de redirecionamento inválida"
- **Solução**: Verifique se a URL está exatamente como configurada no código

---

### 10. Links Úteis

- [Documentação do Facebook Login](https://developers.facebook.com/docs/facebook-login/)
- [Revisão de Permissões](https://developers.facebook.com/docs/apps/review/login-permissions)
- [Política de Privacidade - Template](https://developers.facebook.com/docs/apps/review/login-permissions#privacy-policy)
- [Termos de Serviço - Template](https://developers.facebook.com/docs/apps/review/login-permissions#terms-of-service)

---

## 📝 Resumo das Configurações Necessárias

### Configurações Básicas:
```
Domínios do aplicativo: biacrm.com
Política de Privacidade: https://biacrm.com/privacy-policy
Termos de Serviço: https://biacrm.com/terms-of-service
```

### URLs de Redirecionamento:
```
https://biacrm.com/api/integrations/facebook/callback
http://localhost:3000/api/integrations/facebook/callback
```

### Permissões a Solicitar:
1. `pages_show_list` - Listar páginas (pode precisar de revisão)
2. `leads_retrieval` - Acessar leads (REQUER revisão obrigatória)

---

## ⚠️ IMPORTANTE

1. **Não mude para produção** até que todas as permissões necessárias sejam aprovadas
2. **Crie as páginas** de Política de Privacidade e Termos de Serviço antes de solicitar revisão
3. **Teste tudo** em modo de desenvolvimento antes de solicitar revisão
4. **A revisão pode levar alguns dias** - planeje com antecedência

---

## 🚀 Próximos Passos

1. ✅ Configure os domínios e URLs de redirecionamento
2. ✅ Crie as páginas de Política de Privacidade e Termos de Serviço
3. ✅ Teste a integração em modo de desenvolvimento
4. ✅ Solicite revisão das permissões necessárias
5. ✅ Aguarde aprovação do Facebook
6. ✅ Mude para modo de produção após aprovação


