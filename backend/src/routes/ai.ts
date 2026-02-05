import express from 'express';
import axios from 'axios';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../database/connection';

const router = express.Router();

const buildLeadScope = (isAdmin: boolean, userId?: number | null) => {
  if (isAdmin || !userId) {
    return { where: 'WHERE deleted_at IS NULL', params: [] as any[] };
  }
  return { where: 'WHERE deleted_at IS NULL AND user_id = $1', params: [userId] as any[] };
};

const getUserId = (req: AuthRequest) => (req.user && req.user.id ? Number(req.user.id) : null);

router.get('/integrations', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    const result = await query(
      `
        SELECT id, title, model, status, provider, created_at, updated_at, api_key
        FROM openai_integrations
        WHERE user_id = $1
        ORDER BY updated_at DESC
      `,
      [userId]
    );
    const integrations = (result.rows || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      model: row.model,
      status: row.status,
      provider: row.provider || 'openai',
      created_at: row.created_at,
      updated_at: row.updated_at,
      api_key_masked: row.api_key ? `****${String(row.api_key).slice(-4)}` : null
    }));
    return res.json({ integrations });
  } catch (error: any) {
    console.error('AI integrations list failed:', error?.message || error);
    return res.status(500).json({ message: 'Erro ao listar integrações de IA.' });
  }
});

router.post('/integrations', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    const title = String(req.body?.title || '').trim() || 'OpenAI';
    const apiKey = String(req.body?.apiKey || '').trim();
    const model = String(req.body?.model || '').trim();
    const rawProvider = String(req.body?.provider || '').trim().toLowerCase();
    const provider = rawProvider === 'deepseek' || rawProvider === 'qwen' ? rawProvider : 'openai';
    if (!apiKey) {
      return res.status(400).json({ message: 'Token da IA é obrigatório.' });
    }
    const result = await query(
      `
        INSERT INTO openai_integrations (user_id, title, api_key, model, provider, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [userId, title, apiKey, model || null, provider, 'active']
    );
    const row = result.rows?.[0] || {};
    return res.status(201).json({
      integration: {
        id: row.id,
        title,
        model,
        provider,
        status: 'active',
        api_key_masked: `****${apiKey.slice(-4)}`
      }
    });
  } catch (error: any) {
    console.error('AI integration create failed:', error?.message || error);
    return res.status(500).json({ message: 'Erro ao criar integração de IA.' });
  }
});

router.put('/integrations/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    const integrationId = Number(req.params.id);
    if (!integrationId) {
      return res.status(400).json({ message: 'Integração inválida.' });
    }
    const status = req.body?.status ? String(req.body.status) : undefined;
    const title = req.body?.title ? String(req.body.title).trim() : undefined;
    const model = req.body?.model ? String(req.body.model).trim() : undefined;
    const apiKey = req.body?.apiKey ? String(req.body.apiKey).trim() : undefined;
    const providerRaw = req.body?.provider ? String(req.body.provider).trim().toLowerCase() : undefined;
    const provider = providerRaw === 'openai' || providerRaw === 'deepseek' || providerRaw === 'qwen'
      ? providerRaw
      : undefined;
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (status) {
      updates.push(`status = $${idx++}`);
      params.push(status);
    }
    if (title) {
      updates.push(`title = $${idx++}`);
      params.push(title);
    }
    if (model) {
      updates.push(`model = $${idx++}`);
      params.push(model);
    }
    if (apiKey) {
      updates.push(`api_key = $${idx++}`);
      params.push(apiKey);
    }
    if (provider) {
      updates.push(`provider = $${idx++}`);
      params.push(provider);
    }
    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nada para atualizar.' });
    }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(integrationId, userId);
    await query(
      `
        UPDATE openai_integrations
        SET ${updates.join(', ')}
        WHERE id = $${idx++} AND user_id = $${idx}
      `,
      params
    );
    return res.json({ success: true });
  } catch (error: any) {
    console.error('AI integration update failed:', error?.message || error);
    return res.status(500).json({ message: 'Erro ao atualizar integração de IA.' });
  }
});

router.delete('/integrations/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    const integrationId = Number(req.params.id);
    if (!integrationId) {
      return res.status(400).json({ message: 'Integração inválida.' });
    }
    await query(
      `DELETE FROM openai_integrations WHERE id = $1 AND user_id = $2`,
      [integrationId, userId]
    );
    return res.json({ success: true });
  } catch (error: any) {
    console.error('AI integration delete failed:', error?.message || error);
    return res.status(500).json({ message: 'Erro ao excluir integração de IA.' });
  }
});

router.post('/ask', authenticate, async (req: AuthRequest, res) => {
  try {
    const question = String(req.body?.question || '').trim();
    if (!question) {
      return res.status(400).json({ message: 'Pergunta é obrigatória.' });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    const integrationResult = await query(
      `
        SELECT api_key, model, provider
        FROM openai_integrations
        WHERE user_id = $1 AND status = 'active'
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      [userId]
    );
    const integration = integrationResult.rows?.[0];
    if (!integration?.api_key) {
      return res.status(400).json({ message: 'Integração de IA não configurada ou inativa.' });
    }
    const apiKey = String(integration.api_key);
    const provider = String(integration.provider || 'openai').toLowerCase();
    const model = String(integration.model || '');
    const defaultModel = provider === 'deepseek'
      ? 'deepseek-chat'
      : provider === 'qwen'
        ? 'qwen-plus'
        : 'gpt-4o-mini';
    const modelToUse = model.trim() || defaultModel;

    const isAdmin = req.user?.role === 'admin';
    const { where, params } = buildLeadScope(isAdmin, userId);

    const leadsResult = await query(
      `
        SELECT id, name, phone, email, status, origin, created_at, updated_at, notes
        FROM leads
        ${where}
        ORDER BY created_at DESC
        LIMIT 200
      `,
      params
    );

    const statusCountsResult = await query(
      `
        SELECT status, COUNT(*) as count
        FROM leads
        ${where}
        GROUP BY status
      `,
      params
    );

    const originCountsResult = await query(
      `
        SELECT origin, COUNT(*) as count
        FROM leads
        ${where}
        GROUP BY origin
      `,
      params
    );

    const totalResult = await query(
      `
        SELECT COUNT(*) as count
        FROM leads
        ${where}
      `,
      params
    );

    const summary = {
      total: Number(totalResult.rows?.[0]?.count || 0),
      byStatus: statusCountsResult.rows || [],
      byOrigin: originCountsResult.rows || [],
      sampleSize: (leadsResult.rows || []).length
    };

    const history = Array.isArray(req.body?.history)
      ? req.body.history
          .slice(-6)
          .map((item: any) => ({
            role: item?.role === 'assistant' ? 'assistant' : 'user',
            content: String(item?.content || '').slice(0, 2000)
          }))
      : [];

    const messages = [
      {
        role: 'system',
        content:
          'Você é a IA do BIA CRM. Responda APENAS com base nos dados fornecidos. ' +
          'Se a pergunta não puder ser respondida com os dados disponíveis, explique a limitação. ' +
          'Seja direto, objetivo e em português.'
      },
      ...history,
      {
        role: 'user',
        content: `Pergunta: ${question}\n\nResumo dos leads (JSON):\n${JSON.stringify(summary)}\n\nLeads (até 200 mais recentes, JSON):\n${JSON.stringify(leadsResult.rows || [])}`
      }
    ];

    const providerUrl = provider === 'deepseek'
      ? 'https://api.deepseek.com/v1/chat/completions'
      : provider === 'qwen'
        ? 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    const response = await axios.post(
      providerUrl,
      {
        model: modelToUse,
        messages,
        temperature: 0.2,
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const answer = response.data?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return res.status(502).json({ message: 'Resposta da IA indisponível.' });
    }

    return res.json({ answer, summary });
  } catch (error: any) {
    console.error('AI ask failed:', error?.response?.data || error?.message || error);
    return res.status(500).json({ message: 'Erro ao processar a pergunta de IA.' });
  }
});

export default router;
