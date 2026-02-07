import fs from 'fs';
import path from 'path';
import { DisconnectReason, downloadMediaMessage, fetchLatestBaileysVersion, makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { query } from '../database/connection';

type SessionStatus = 'connecting' | 'qr' | 'connected' | 'disconnected';

interface WhatsAppSession {
  socket: any;
  qr: string | null;
  status: SessionStatus;
  updatedAt: number;
  reconnecting?: boolean;
}

interface WhatsAppMessageEvent {
  id: string;
  phone: string;
  text: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  direction: 'out' | 'in';
  at: string;
}

const sessions = new Map<string, WhatsAppSession>();
const AUTH_DIR = path.join(process.cwd(), 'whatsapp_auth');
const MEDIA_DIR = path.join(process.cwd(), 'whatsapp_media');
const subscribers = new Map<string, Set<(event: WhatsAppMessageEvent) => void>>();
const messageStore = new Map<string, WhatsAppMessageEvent[]>();
const MAX_MESSAGES_PER_USER = 300;
const lidToJid = new Map<string, string>();
const lidToPhone = new Map<string, string>();
const phoneToName = new Map<string, string>();
const lastOutboundPhoneByUser = new Map<string, string>();
const pendingLeadCreates = new Map<string, number>();
const syncWindowDaysByUser = new Map<string, number>();
const FINAL_STATUSES = new Set(['finalizado']);

const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
const isLikelyPhone = (digits: string) => {
  if (!digits) return false;
  if (digits.length === 10 || digits.length === 11) return true;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) return true;
  return false;
};
const isGroupJid = (jid?: string | null) => !!jid && (jid.endsWith('@g.us') || jid.endsWith('@broadcast'));
const getPhoneVariants = (digits: string) => {
  const variants = new Set<string>();
  if (!digits) return variants;
  const addWithAndWithoutNinth = (localDigits: string) => {
    if (!localDigits) return;
    variants.add(localDigits);
    variants.add(`55${localDigits}`);
    // BR mobile: allow missing or present 9th digit after DDD
    if (localDigits.length === 11 && localDigits[2] === '9') {
      const withoutNinth = `${localDigits.slice(0, 2)}${localDigits.slice(3)}`;
      variants.add(withoutNinth);
      variants.add(`55${withoutNinth}`);
    } else if (localDigits.length === 10) {
      const withNinth = `${localDigits.slice(0, 2)}9${localDigits.slice(2)}`;
      variants.add(withNinth);
      variants.add(`55${withNinth}`);
    }
  };

  variants.add(digits);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    const localDigits = digits.slice(2);
    addWithAndWithoutNinth(localDigits);
  } else if (digits.length === 10 || digits.length === 11) {
    addWithAndWithoutNinth(digits);
  }
  return variants;
};
const ensureCountryCode = (digits: string) => {
  if (!digits) return digits;
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
};
const formatSendPhone = (digits: string) => {
  if (!digits) return digits;
  let normalized = digits;
  if (normalized.length === 10) {
    const thirdDigit = normalized.charAt(2);
    if (thirdDigit !== '9') {
      normalized = `${normalized.slice(0, 2)}9${normalized.slice(2)}`;
    }
  }
  return ensureCountryCode(normalized);
};
const isSameLead = (storedPhone: string, leadPhone: string) => {
  const storedDigits = normalizePhone(storedPhone);
  const leadDigits = normalizePhone(leadPhone);
  if (!storedDigits || !leadDigits) return false;
  if (storedDigits === leadDigits) return true;
  const minLen = Math.min(storedDigits.length, leadDigits.length);
  if (minLen < 10) return false;
  const storedVariants = getPhoneVariants(storedDigits);
  const leadVariants = getPhoneVariants(leadDigits);
  for (const a of storedVariants) {
    for (const b of leadVariants) {
      if (a === b) return true;
      if (a.endsWith(b) || b.endsWith(a)) return true;
    }
  }
  return false;
};

const isPhoneBlockedByWhitelist = async (userId: string, digits: string, companyId: number | null) => {
  try {
    if (!companyId) {
      return false;
    }
    const result = await query('SELECT phone FROM lead_whitelist WHERE company_id = $1', [companyId]);
    const rows = result.rows || [];
    return rows.some((row: any) => isSameLead(row.phone || '', digits));
  } catch (error) {
    console.warn('WhatsApp whitelist check failed:', error);
    return false;
  }
};

const getMessageTimestampMs = (message: any) => {
  const raw = message?.messageTimestamp ?? message?.message?.messageTimestamp;
  if (!raw) return null;
  const value = typeof raw === 'number'
    ? raw
    : (typeof raw?.toNumber === 'function' ? raw.toNumber() : Number(raw));
  if (!Number.isFinite(value)) return null;
  return value < 10_000_000_000 ? value * 1000 : value;
};

const shouldSyncMessage = (userId: string, source: string, message: any) => {
  if (source !== 'history' && source !== 'set') return true;
  const days = syncWindowDaysByUser.get(userId);
  if (!days || days <= 0) return true;
  const timestampMs = getMessageTimestampMs(message);
  if (!timestampMs) return true;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return timestampMs >= cutoff;
};

export const setWhatsAppSyncWindow = (userId: string, days?: number) => {
  if (!days || days <= 0) {
    syncWindowDaysByUser.delete(userId);
    return;
  }
  syncWindowDaysByUser.set(userId, days);
};

const extractPhoneFromJid = (jid?: string | null) => {
  if (!jid) return '';
  const base = String(jid).split('@')[0] || '';
  return normalizePhone(base);
};

const storeContactName = (record: any) => {
  const jid = typeof record?.jid === 'string'
    ? record.jid
    : (typeof record?.id === 'string' ? record.id : null);
  if (!jid || isGroupJid(jid)) return;
  const phone = extractPhoneFromJid(jid);
  const rawName = [
    record?.name,
    record?.notify,
    record?.notifyName,
    record?.verifiedName,
    record?.subject
  ].find(value => typeof value === 'string' && value.trim().length > 0);
  if (!phone || !rawName || typeof rawName !== 'string') return;
  phoneToName.set(phone, rawName.trim());
};

const getIncomingLeadName = (message: any, phone?: string) => {
  const rawName = [
    message?.pushName,
    message?.notifyName,
    message?.verifiedBizName,
    message?.name
  ]
    .find(value => typeof value === 'string' && value.trim().length > 0);
  if (rawName && typeof rawName === 'string') {
    return rawName.trim();
  }
  const digits = normalizePhone(phone || '');
  if (digits && phoneToName.has(digits)) {
    return phoneToName.get(digits) || null;
  }
  return null;
};

const ensureLeadForIncomingMessage = async (userId: string, phone: string, leadName?: string | null) => {
  const digits = normalizePhone(phone);
  if (!digits) return;
  const pendingKey = `${userId}:${digits}`;
  const pendingAt = pendingLeadCreates.get(pendingKey);
  if (pendingAt && Date.now() - pendingAt < 30000) {
    return;
  }
  pendingLeadCreates.set(pendingKey, Date.now());
  try {
    const leadsResult = await query(
      `SELECT id, phone, name FROM leads WHERE user_id = $1 AND deleted_at IS NULL`,
      [Number(userId)]
    );
    const leads = leadsResult.rows || [];
    const existing = leads.find((row: any) => isSameLead(row.phone || '', digits));
    if (existing) {
      const currentName = String(existing.name || '').trim();
      const incomingName = (leadName || '').trim();
      if (incomingName && (!currentName || currentName.startsWith('WhatsApp '))) {
        try {
          await query(
            `UPDATE leads SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [incomingName, existing.id]
          );
        } catch (error) {
          await query(
            `UPDATE leads SET name = $1 WHERE id = $2`,
            [incomingName, existing.id]
          );
        }
      }
      return;
    }

    let companyId: number | null = null;
    try {
      const userResult = await query('SELECT company_id FROM users WHERE id = $1', [Number(userId)]);
      companyId = userResult.rows[0]?.company_id ? Number(userResult.rows[0].company_id) : null;
    } catch (error) {
      companyId = null;
    }
    const isBlocked = await isPhoneBlockedByWhitelist(userId, digits, companyId);
    if (isBlocked) {
      console.info('WhatsApp lead creation blocked by whitelist', {
        userId: Number(userId),
        phone: digits
      });
      return;
    }
    const name = leadName && leadName.trim().length > 0
      ? leadName.trim()
      : `WhatsApp ${digits}`;
    const storedPhone = formatSendPhone(digits);
    const result = await query(
      `INSERT INTO leads (name, phone, status, origin, user_id, company_id, custom_data, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        name,
        storedPhone,
        'novo_lead',
        'whatsapp',
        Number(userId),
        companyId,
        JSON.stringify({}),
        JSON.stringify([])
      ]
    );
    const insertedId = (result.rows[0] && result.rows[0].lastInsertRowid)
      || (result.rows[0] && result.rows[0].id);
    if (insertedId) {
      console.info('WhatsApp lead auto-created', {
        userId: Number(userId),
        leadId: insertedId,
        phone: storedPhone,
        name
      });
      await query(
        'INSERT INTO lead_history (lead_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [insertedId, Number(userId), 'created', 'Lead criado automaticamente via WhatsApp']
      );
    }
  } catch (error) {
    console.warn('WhatsApp lead auto-create failed:', error);
  } finally {
    pendingLeadCreates.delete(pendingKey);
  }
};

const getExtensionFromMime = (mimetype?: string | null) => {
  if (!mimetype) return 'bin';
  if (mimetype === 'image/jpeg') return 'jpg';
  if (mimetype === 'image/png') return 'png';
  if (mimetype === 'image/gif') return 'gif';
  if (mimetype === 'image/webp') return 'webp';
  if (mimetype === 'video/mp4') return 'mp4';
  if (mimetype === 'audio/mpeg') return 'mp3';
  if (mimetype === 'audio/ogg') return 'ogg';
  if (mimetype === 'audio/opus') return 'opus';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype === 'text/plain') return 'txt';
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  const parts = mimetype.split('/');
  return parts[1] || 'bin';
};

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const removeAuthDir = (userId: string) => {
  const authPath = path.join(AUTH_DIR, userId);
  if (fs.existsSync(authPath)) {
    fs.rmSync(authPath, { recursive: true, force: true });
  }
};

const closeSession = (userId: string) => {
  const existing = sessions.get(userId);
  if (existing?.socket) {
    try {
      existing.socket.end();
    } catch (error) {
      console.warn('WhatsApp socket end failed:', error);
    }
  }
  sessions.delete(userId);
};

const emitMessage = (userId: string, event: WhatsAppMessageEvent) => {
  const subs = subscribers.get(userId);
  if (subs) {
    subs.forEach(cb => cb(event));
  }
};

const saveMessage = async (userId: string, event: WhatsAppMessageEvent) => {
  try {
    await query(
      `INSERT INTO whatsapp_messages (user_id, wa_message_id, phone, text, media_url, media_type, direction, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        Number(userId),
        event.id,
        event.phone,
        event.text,
        event.mediaUrl || null,
        event.mediaType || null,
        event.direction,
        event.direction === 'out' ? 1 : 0,
        event.at
      ]
    );
  } catch (error) {
    try {
      await query(
        `INSERT INTO whatsapp_messages (user_id, wa_message_id, phone, text, direction, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [Number(userId), event.id, event.phone, event.text, event.direction, event.at]
      );
    } catch (fallbackError) {
      console.warn('WhatsApp message persist failed:', fallbackError);
    }
  }
};

const storeMessage = (userId: string, event: WhatsAppMessageEvent) => {
  const list = messageStore.get(userId) || [];
  list.unshift(event);
  if (list.length > MAX_MESSAGES_PER_USER) {
    list.length = MAX_MESSAGES_PER_USER;
  }
  messageStore.set(userId, list);
};

const updateLeadStatusFromWhatsApp = async (userId: string, phone: string, direction: 'in' | 'out') => {
  const digits = normalizePhone(phone);
  if (!digits) return;
  try {
    const leadsResult = await query(
      `SELECT id, status, phone, custom_data FROM leads WHERE user_id = $1 AND deleted_at IS NULL`,
      [Number(userId)]
    );
    const leads = leadsResult.rows || [];
    const lead = leads.find((row: any) => isSameLead(row.phone || '', digits));
    if (!lead) return;
    if (FINAL_STATUSES.has(lead.status)) return;

    const messagesResult = await query(
      `SELECT phone, direction FROM whatsapp_messages
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 500`,
      [Number(userId)]
    );
    const relevant = (messagesResult.rows || []).filter((row: any) => isSameLead(row.phone || '', digits));
    const hasIn = relevant.some((row: any) => row.direction === 'in') || direction === 'in';
    const hasOut = relevant.some((row: any) => row.direction === 'out') || direction === 'out';

    let targetStatus: string | null = null;
    if (hasIn && hasOut) {
      targetStatus = 'em_contato';
    } else if (hasIn) {
      targetStatus = 'novo_lead';
    }

    if (!targetStatus || lead.status === targetStatus) return;

    let customData = lead.custom_data;
    if (customData && typeof customData === 'string') {
      try {
        customData = JSON.parse(customData);
      } catch (error) {
        customData = {};
      }
    }
    const shouldClearDisplayStatus = (targetStatus === 'novo_lead' || targetStatus === 'em_contato')
      && customData
      && typeof customData === 'object'
      && customData.displayStatus;

    if (shouldClearDisplayStatus) {
      const updatedCustomData = { ...customData };
      delete updatedCustomData.displayStatus;
      try {
        await query(
          `UPDATE leads SET status = $1, custom_data = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
          [targetStatus, JSON.stringify(updatedCustomData), lead.id]
        );
      } catch (error) {
        await query(
          `UPDATE leads SET status = $1, custom_data = $2 WHERE id = $3`,
          [targetStatus, JSON.stringify(updatedCustomData), lead.id]
        );
      }
      return;
    }

    try {
      await query(
        `UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [targetStatus, lead.id]
      );
    } catch (error) {
      await query(
        `UPDATE leads SET status = $1 WHERE id = $2`,
        [targetStatus, lead.id]
      );
    }
  } catch (error) {
    console.warn('WhatsApp lead status update failed:', error);
  }
};

const extractLidJid = (record: any) => {
  const lid = typeof record?.lid === 'string'
    ? record.lid
    : (typeof record?.id === 'string' && record.id.endsWith('@lid') ? record.id : null);
  const jid = typeof record?.jid === 'string'
    ? record.jid
    : (typeof record?.id === 'string' ? record.id : null);
  return { lid, jid };
};

const storeLidPhoneFromRecord = (record: any, source: string) => {
  const { lid } = extractLidJid(record);
  if (!lid || !lid.endsWith('@lid')) return;
  const rawPhone = record?.pn || record?.phone;
  const digits = normalizePhone(String(rawPhone || ''));
  if (!isLikelyPhone(digits)) return;
  lidToPhone.set(lid, digits);
  console.info('WhatsApp LID phone stored', { lid, phone: digits, source });
};

const storeLidMapping = (record: any, source: string) => {
  const { lid, jid } = extractLidJid(record);
  if (lid && jid && lid.endsWith('@lid') && jid.endsWith('@s.whatsapp.net')) {
    lidToJid.set(lid, jid);
    console.info('WhatsApp LID mapping stored', { lid, jid, source });
  } else if (lid || jid) {
    console.info('WhatsApp LID mapping ignored', { lid, jid, source });
  }
};

const scheduleReconnect = (userId: string) => {
  const current = sessions.get(userId);
  if (!current || current.reconnecting) {
    return;
  }
  current.reconnecting = true;
  setTimeout(async () => {
    try {
      closeSession(userId);
      await createSession(userId);
    } catch (error) {
      console.warn('WhatsApp reconnect failed:', error);
    } finally {
      const latest = sessions.get(userId);
      if (latest) {
        latest.reconnecting = false;
      }
    }
  }, 1000);
};

const createSession = async (userId: string) => {
  ensureDir(AUTH_DIR);
  closeSession(userId);
  const authPath = path.join(AUTH_DIR, userId);
  ensureDir(authPath);

  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['BIA CRM', 'Chrome', '1.0.0']
  });

  const session: WhatsAppSession = {
    socket,
    qr: null,
    status: 'connecting',
    updatedAt: Date.now(),
    reconnecting: false
  };

  sessions.set(userId, session);

  socket.ev.on('creds.update', saveCreds);
  socket.ev.on('contacts.upsert', (contacts: any[]) => {
    if (!Array.isArray(contacts)) return;
    contacts.forEach(contact => {
      storeLidMapping(contact, 'contacts.upsert');
      storeLidPhoneFromRecord(contact, 'contacts.upsert');
      storeContactName(contact);
    });
  });
  socket.ev.on('contacts.update', (contacts: any[]) => {
    if (!Array.isArray(contacts)) return;
    contacts.forEach(contact => {
      storeLidMapping(contact, 'contacts.update');
      storeLidPhoneFromRecord(contact, 'contacts.update');
      storeContactName(contact);
    });
  });
  socket.ev.on('chats.upsert', (chats: any[]) => {
    if (!Array.isArray(chats)) return;
    chats.forEach(chat => {
      storeLidMapping(chat, 'chats.upsert');
      storeLidPhoneFromRecord(chat, 'chats.upsert');
      storeContactName(chat);
    });
  });
  socket.ev.on('chats.update', (chats: any[]) => {
    if (!Array.isArray(chats)) return;
    chats.forEach(chat => {
      storeLidMapping(chat, 'chats.update');
      storeLidPhoneFromRecord(chat, 'chats.update');
      storeContactName(chat);
    });
  });
  socket.ev.on('connection.update', (update: any) => {
    const { connection, qr, lastDisconnect } = update || {};

    if (qr) {
      session.qr = qr;
      session.status = 'qr';
      session.updatedAt = Date.now();
    }

    if (!qr && connection && connection !== 'close') {
      // QR foi consumido; não exibir mais na UI enquanto conecta
      session.qr = null;
      session.status = connection === 'open' ? 'connected' : 'connecting';
      session.updatedAt = Date.now();
    }

    if (connection === 'open') {
      session.status = 'connected';
      session.qr = null;
      session.updatedAt = Date.now();
    }

    if (connection === 'close') {
      session.status = 'disconnected';
      session.updatedAt = Date.now();
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        removeAuthDir(userId);
      }
      scheduleReconnect(userId);
    }
  });

  const unwrap = (payload: any): any => {
    if (!payload) return null;
    if (payload.ephemeralMessage?.message) return unwrap(payload.ephemeralMessage.message);
    if (payload.viewOnceMessageV2?.message) return unwrap(payload.viewOnceMessageV2.message);
    if (payload.viewOnceMessageV2Extension?.message) return unwrap(payload.viewOnceMessageV2Extension.message);
    if (payload.viewOnceMessage?.message) return unwrap(payload.viewOnceMessage.message);
    return payload;
  };

  const extractText = (content: any): string => {
    const text =
      content?.conversation ||
      content?.extendedTextMessage?.text ||
      content?.imageMessage?.caption ||
      content?.videoMessage?.caption ||
      content?.documentMessage?.caption ||
      content?.buttonsResponseMessage?.selectedDisplayText ||
      content?.buttonsResponseMessage?.selectedButtonId ||
      content?.listResponseMessage?.title ||
      content?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      content?.templateButtonReplyMessage?.selectedDisplayText ||
      content?.templateButtonReplyMessage?.selectedId ||
      '';
    if (text) {
      return text;
    }
    if (content?.imageMessage) return '[imagem]';
    if (content?.videoMessage) return '[video]';
    if (content?.audioMessage) return '[audio]';
    if (content?.documentMessage) return '[documento]';
    if (content?.stickerMessage) return '[figurinha]';
    return '[mensagem]';
  };

  const getMediaPayload = (content: any) => {
    if (content?.imageMessage) return { payload: content.imageMessage, type: 'image' };
    if (content?.videoMessage) return { payload: content.videoMessage, type: 'video' };
    if (content?.audioMessage) return { payload: content.audioMessage, type: 'audio' };
    if (content?.documentMessage) return { payload: content.documentMessage, type: 'document' };
    if (content?.stickerMessage) return { payload: content.stickerMessage, type: 'sticker' };
    return null;
  };


  const isDuplicateOutgoing = (userIdValue: string, phoneValue: string, textValue: string) => {
    const existing = messageStore.get(userIdValue) || [];
    const now = Date.now();
    return existing.some(item => {
      if (item.direction !== 'out') return false;
      if (item.phone !== phoneValue) return false;
      if (item.text !== textValue) return false;
      const ageMs = now - new Date(item.at).getTime();
      return ageMs >= 0 && ageMs < 120000;
    });
  };

  const handleIncomingMessage = async (message: any, source: string) => {
    if (!message) return;
    console.info(`WhatsApp ${source} item`, {
      remoteJid: message.key?.remoteJid,
      fromMe: message.key?.fromMe,
      participant: message.key?.participant,
      id: message.key?.id,
      messageKeys: Object.keys(message.message || {})
    });
    const fromMe = !!message.key?.fromMe;
    const remoteJid = message.key?.remoteJid;
    if (!remoteJid || isGroupJid(remoteJid)) return;
    if (!shouldSyncMessage(userId, source, message)) {
      return;
    }

    const content = unwrap(message.message);
    if (!content) {
      console.info('WhatsApp incoming without content', {
        remoteJid,
        participant: message.key?.participant,
        messageId: message.key?.id
      });
      return;
    }
    const media = getMediaPayload(content);
    const text = extractText(content);
    if (!text) {
      console.info('WhatsApp incoming without text', {
        remoteJid,
        participant: message.key?.participant,
        messageId: message.key?.id,
        contentKeys: Object.keys(content || {})
      });
      return;
    }

    const participant = message.key?.participant;
    let baseJid = remoteJid;
    if (remoteJid.endsWith('@g.us') && participant) {
      baseJid = participant;
    }
    if (remoteJid.endsWith('@lid') && participant) {
      baseJid = participant;
    }

    const isLidRemote = remoteJid.endsWith('@lid');
    const lidCandidate = baseJid.endsWith('@lid') ? baseJid : (isLidRemote ? remoteJid : null);
    if (lidCandidate) {
      const mapped = lidToJid.get(lidCandidate);
      if (mapped) {
        baseJid = mapped;
      } else {
        console.info('WhatsApp LID mapping missing', {
          remoteJid,
          participant,
          baseJid,
          lidCandidate,
          messageId: message.key?.id
        });
        const cachedPhone = lidToPhone.get(lidCandidate);
        if (cachedPhone) {
          baseJid = `${cachedPhone}@s.whatsapp.net`;
          console.info('WhatsApp LID mapping fallback', {
            baseJid,
            phone: cachedPhone,
            messageId: message.key?.id
          });
        } else {
          const participantPhone = normalizePhone((participant || '').split('@')[0] || '');
          if (isLikelyPhone(participantPhone)) {
            baseJid = `${participantPhone}@s.whatsapp.net`;
            console.info('WhatsApp LID fallback to participant phone', {
              baseJid,
              phone: participantPhone,
              messageId: message.key?.id
            });
          } else {
            const remoteJidPhone = normalizePhone((remoteJid || '').split('@')[0] || '');
            if (isLikelyPhone(remoteJidPhone)) {
              baseJid = `${remoteJidPhone}@s.whatsapp.net`;
              console.info('WhatsApp LID fallback to remoteJid phone', {
                baseJid,
                phone: remoteJidPhone,
                messageId: message.key?.id
              });
            } else {
              console.warn('WhatsApp LID mapping unavailable, proceeding', {
                remoteJid,
                participant,
                baseJid,
                lidCandidate,
                messageId: message.key?.id
              });
            }
          }
        }
      }
    }
    let phone = normalizePhone((baseJid || '').split('@')[0] || '');
    if (baseJid.endsWith('@lid') || (isLidRemote && !phone)) {
      const cached = lidToPhone.get(lidCandidate || baseJid);
      if (cached) {
        phone = cached;
      }
    }
    if (!phone || !isLikelyPhone(phone)) {
      console.info('WhatsApp incoming without phone', {
        remoteJid,
        participant,
        baseJid,
        messageId: message.key?.id
      });
      return;
    }
    const normalizedPhone = formatSendPhone(phone);
    if (fromMe && !media && isDuplicateOutgoing(userId, phone, text)) {
      return;
    }
    const messageId = message.key?.id || `${Date.now()}`;
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;
    if (media) {
      try {
        const buffer = await downloadMediaMessage(message, 'buffer', {});
        const mimetype = media.payload?.mimetype || null;
        const normalizedMimetype = mimetype || (media.type === 'sticker' ? 'image/webp' : null);
        const extension = getExtensionFromMime(normalizedMimetype);
        const userDir = path.join(MEDIA_DIR, userId);
        ensureDir(MEDIA_DIR);
        ensureDir(userDir);
        const fileName = `${messageId}.${extension}`;
        const filePath = path.join(userDir, fileName);
        fs.writeFileSync(filePath, buffer as Buffer);
        mediaUrl = `/media/whatsapp/${userId}/${fileName}`;
        mediaType = normalizedMimetype || media.type;
      } catch (error) {
        console.warn('WhatsApp media download failed:', error);
      }
    }
    const messageTimestampMs = getMessageTimestampMs(message);
    const receivedAt = messageTimestampMs
      ? new Date(messageTimestampMs).toISOString()
      : new Date().toISOString();
    const event: WhatsAppMessageEvent = {
      id: messageId,
      phone: normalizedPhone,
      text,
      mediaUrl,
      mediaType,
      direction: fromMe ? 'out' : 'in',
      at: receivedAt
    };
    console.info('WhatsApp incoming message', {
      remoteJid,
      participant,
      baseJid,
      rawPhone: (baseJid || '').split('@')[0] || '',
      phone,
      messageId: event.id,
      preview: text.slice(0, 120)
    });
    storeMessage(userId, event);
    void saveMessage(userId, event);
    emitMessage(userId, event);
    if (!fromMe) {
      await ensureLeadForIncomingMessage(userId, normalizedPhone, getIncomingLeadName(message, normalizedPhone));
    }
    void updateLeadStatusFromWhatsApp(userId, normalizedPhone, event.direction);
  };

  socket.ev.on('messages.upsert', (m: any) => {
    try {
      const messages = m.messages || [];
      if (!Array.isArray(messages)) return;
      console.info('WhatsApp upsert batch', {
        type: m?.type,
        count: messages.length,
        ids: messages.map((msg: any) => msg?.key?.id).filter(Boolean),
        remoteJids: messages.map((msg: any) => msg?.key?.remoteJid).filter(Boolean)
      });
      for (const message of messages) {
        void handleIncomingMessage(message, 'upsert');
      }
    } catch (error) {
      console.warn('WhatsApp message handler failed:', error);
    }
  });

  socket.ev.on('messages.set' as any, (m: any) => {
    try {
      const messages = m.messages || [];
      if (!Array.isArray(messages)) return;
      console.info('WhatsApp messages.set batch', { count: messages.length });
      for (const message of messages) {
        void handleIncomingMessage(message, 'set');
      }
    } catch (error) {
      console.warn('WhatsApp messages.set handler failed:', error);
    }
  });

  socket.ev.on('messaging-history.set' as any, (m: any) => {
    try {
      const messages = m.messages || [];
      if (!Array.isArray(messages)) return;
      console.info('WhatsApp history batch', { count: messages.length, isLatest: m?.isLatest });
      for (const message of messages) {
        void handleIncomingMessage(message, 'history');
      }
    } catch (error) {
      console.warn('WhatsApp history handler failed:', error);
    }
  });

  return session;
};

const waitForQr = async (userId: string, timeoutMs = 15000) => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const session = sessions.get(userId);

    if (session?.qr) {
      return session.qr;
    }

    if (session?.status === 'connected') {
      return null;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return null;
};

const waitForConnected = async (userId: string, timeoutMs = 8000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const session = sessions.get(userId);
    if (session?.status === 'connected') {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
};

export const getWhatsAppQr = async (userId: string) => {
  let session = sessions.get(userId);
  if (!session) {
    session = await createSession(userId);
  }

  if (session.status === 'connected') {
    return { status: 'connected' as const, qr: null };
  }

  if (session.qr) {
    return { status: session.status as SessionStatus, qr: session.qr };
  }

  const qr = await waitForQr(userId);
  return { status: session.status as SessionStatus, qr };
};

export const disconnectWhatsApp = async (userId: string) => {
  const existing = sessions.get(userId);
  if (existing?.socket) {
    try {
      await existing.socket.logout();
    } catch (error) {
      console.warn('WhatsApp logout failed:', error);
    }
  }
  closeSession(userId);
  removeAuthDir(userId);
};

export const sendWhatsAppMessage = async (userId: string, phone: string, message: string) => {
  let session = sessions.get(userId);
  if (!session) {
    session = await createSession(userId);
  }

  if (session.status !== 'connected') {
    const connected = await waitForConnected(userId);
    if (!connected) {
      throw new Error('WhatsApp não está conectado');
    }
  }

  const digits = normalizePhone(phone);
  if (!digits) {
    throw new Error('Telefone inválido');
  }
  lastOutboundPhoneByUser.set(userId, digits);

  const jid = `${formatSendPhone(digits)}@s.whatsapp.net`;
  await session.socket.sendMessage(jid, { text: message });
  const event: WhatsAppMessageEvent = {
    id: `${Date.now()}`,
    phone: digits,
    text: message,
    direction: 'out',
    at: new Date().toISOString()
  };
  storeMessage(userId, event);
  void saveMessage(userId, event);
  emitMessage(userId, event);
  void updateLeadStatusFromWhatsApp(userId, digits, 'out');
};

export const sendWhatsAppMedia = async (
  userId: string,
  phone: string,
  file: { buffer: Buffer; mimetype: string; originalname?: string },
  caption?: string
) => {
  let session = sessions.get(userId);
  if (!session) {
    session = await createSession(userId);
  }

  if (session.status !== 'connected') {
    const connected = await waitForConnected(userId);
    if (!connected) {
      throw new Error('WhatsApp não está conectado');
    }
  }

  const digits = normalizePhone(phone);
  if (!digits) {
    throw new Error('Telefone inválido');
  }
  lastOutboundPhoneByUser.set(userId, digits);

  const jid = `${formatSendPhone(digits)}@s.whatsapp.net`;
  const { buffer, mimetype, originalname } = file;
  const isImage = mimetype.startsWith('image/');
  const isVideo = mimetype.startsWith('video/');
  const isAudio = mimetype.startsWith('audio/');

  if (isImage) {
    await session.socket.sendMessage(jid, { image: buffer, caption: caption || undefined });
  } else if (isVideo) {
    await session.socket.sendMessage(jid, { video: buffer, caption: caption || undefined });
  } else if (isAudio) {
    await session.socket.sendMessage(jid, { audio: buffer, mimetype });
  } else {
    await session.socket.sendMessage(jid, {
      document: buffer,
      mimetype,
      fileName: originalname || 'arquivo'
    });
  }

  const text = caption || (originalname ? `Arquivo: ${originalname}` : 'Mídia enviada');
  let mediaUrl: string | null = null;
  try {
    const extension = getExtensionFromMime(mimetype);
    const userDir = path.join(MEDIA_DIR, userId);
    ensureDir(MEDIA_DIR);
    ensureDir(userDir);
    const fileName = `${Date.now()}.${extension}`;
    const filePath = path.join(userDir, fileName);
    fs.writeFileSync(filePath, buffer);
    mediaUrl = `/media/whatsapp/${userId}/${fileName}`;
  } catch (error) {
    console.warn('WhatsApp media save failed:', error);
  }
  const event: WhatsAppMessageEvent = {
    id: `${Date.now()}`,
    phone: digits,
    text,
    mediaUrl,
    mediaType: mimetype,
    direction: 'out',
    at: new Date().toISOString()
  };
  storeMessage(userId, event);
  void saveMessage(userId, event);
  emitMessage(userId, event);
  void updateLeadStatusFromWhatsApp(userId, digits, 'out');
};

export const getWhatsAppProfilePicture = async (userId: string, phone: string) => {
  let session = sessions.get(userId);
  if (!session) {
    session = await createSession(userId);
  }

  if (session.status !== 'connected') {
    const connected = await waitForConnected(userId);
    if (!connected) {
      throw new Error('WhatsApp não está conectado');
    }
  }

  const digits = normalizePhone(phone);
  if (!digits) {
    throw new Error('Telefone inválido');
  }
  const jid = `${formatSendPhone(digits)}@s.whatsapp.net`;
  try {
    const url = await session.socket.profilePictureUrl(jid, 'image');
    return url || null;
  } catch (error) {
    return null;
  }
};

export const subscribeWhatsAppMessages = (userId: string, cb: (event: WhatsAppMessageEvent) => void) => {
  const set = subscribers.get(userId) || new Set();
  set.add(cb);
  subscribers.set(userId, set);
  return () => {
    const current = subscribers.get(userId);
    if (current) {
      current.delete(cb);
    }
  };
};

export const getWhatsAppMessages = async (userId: string, phone: string) => {
  const digits = normalizePhone(phone);
  if (!digits) {
    return [];
  }
  try {
    const result = await query(
      `SELECT wa_message_id as id, phone, text, media_url as mediaUrl, media_type as mediaType, direction, created_at as at
       FROM whatsapp_messages
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 500`,
      [Number(userId)]
    );
    const filtered = (result.rows || []).filter((row: any) => isSameLead(row.phone, digits));
    return filtered.slice(0, 200);
  } catch (error) {
    const result = await query(
      `SELECT wa_message_id as id, phone, text, direction, created_at as at
       FROM whatsapp_messages
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 500`,
      [Number(userId)]
    );
    const filtered = (result.rows || []).filter((row: any) => isSameLead(row.phone, digits));
    return filtered.slice(0, 200);
  }
};

export const getWhatsAppConversations = async (userId: string) => {
  const leadsResult = await query(
    `SELECT id, name, phone FROM leads WHERE user_id = $1 AND deleted_at IS NULL`,
    [Number(userId)]
  );
  const leads = leadsResult.rows || [];
  const deletedResult = await query(
    `SELECT phone FROM leads WHERE user_id = $1 AND deleted_at IS NOT NULL`,
    [Number(userId)]
  );
  const deletedLeads = deletedResult.rows || [];

  let rows: any[] = [];
  try {
    const result = await query(
      `SELECT wa_message_id as id, phone, text, media_url as mediaUrl, media_type as mediaType, direction, is_read as isRead, created_at as at
       FROM whatsapp_messages
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1000`,
      [Number(userId)]
    );
    rows = result.rows || [];
  } catch (error) {
    const result = await query(
      `SELECT wa_message_id as id, phone, text, media_url as mediaUrl, media_type as mediaType, direction, created_at as at
       FROM whatsapp_messages
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1000`,
      [Number(userId)]
    );
    rows = (result.rows || []).map(row => ({ ...row, isRead: true }));
  }

  const conversations = new Map<string, any>();
  rows.forEach((row) => {
    const phone = normalizePhone(row.phone || '');
    if (!phone) return;
    if (deletedLeads.some((lead: any) => isSameLead(lead.phone || '', phone))) {
      return;
    }
    const preview = row.text && String(row.text).trim().length > 0
      ? row.text
      : (row.mediaUrl || row.mediaType ? 'Mídia enviada' : '');

    if (!conversations.has(phone)) {
      const matchedLead = leads.find((lead: any) => isSameLead(lead.phone || '', phone));
      conversations.set(phone, {
        phone,
        leadId: matchedLead?.id || null,
        leadName: matchedLead?.name || null,
        lastMessage: preview || '',
        lastAt: row.at,
        lastDirection: row.direction,
        unreadCount: 0
      });
    }
    const entry = conversations.get(phone);
    if (entry && row.at && (!entry.lastAt || new Date(row.at).getTime() > new Date(entry.lastAt).getTime())) {
      entry.lastAt = row.at;
      entry.lastMessage = preview || entry.lastMessage;
      entry.lastDirection = row.direction;
    }
    const isRead = row.isRead === true || row.isRead === 1;
    if (row.direction === 'in' && !isRead) {
      entry.unreadCount += 1;
    }
  });

  return Array.from(conversations.values()).sort((a, b) => {
    return new Date(b.lastAt || 0).getTime() - new Date(a.lastAt || 0).getTime();
  });
};

export const markWhatsAppMessagesRead = async (userId: string, phone: string) => {
  const digits = normalizePhone(phone);
  if (!digits) return;
  try {
    const result = await query(
      `SELECT wa_message_id as id, phone
       FROM whatsapp_messages
       WHERE user_id = $1 AND direction = 'in' AND (is_read = 0 OR is_read IS NULL)`,
      [Number(userId)]
    );
    const ids = (result.rows || [])
      .filter((row: any) => isSameLead(row.phone || '', digits))
      .map((row: any) => row.id)
      .filter(Boolean);
    if (ids.length === 0) return;
    const placeholders = ids.map((_, index) => `$${index + 2}`).join(', ');
    await query(
      `UPDATE whatsapp_messages
       SET is_read = 1
       WHERE user_id = $1 AND wa_message_id IN (${placeholders})`,
      [Number(userId), ...ids]
    );
  } catch (error) {
    // ignore if column doesn't exist or update fails
  }
};
