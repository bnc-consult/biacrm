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
const lastOutboundPhoneByUser = new Map<string, string>();

const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
const getPhoneVariants = (digits: string) => {
  const variants = new Set<string>();
  if (!digits) return variants;
  variants.add(digits);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    variants.add(digits.slice(2));
  }
  if (digits.length === 10 || digits.length === 11) {
    variants.add(`55${digits}`);
  }
  // BR mobile: allow missing or present 9th digit after DDD
  if (digits.length === 11 && digits[2] === '9') {
    variants.add(`${digits.slice(0, 2)}${digits.slice(3)}`);
  } else if (digits.length === 10) {
    variants.add(`${digits.slice(0, 2)}9${digits.slice(2)}`);
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
    normalized = `${normalized.slice(0, 2)}9${normalized.slice(2)}`;
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

const getExtensionFromMime = (mimetype?: string | null) => {
  if (!mimetype) return 'bin';
  if (mimetype === 'image/jpeg') return 'jpg';
  if (mimetype === 'image/png') return 'png';
  if (mimetype === 'image/gif') return 'gif';
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

const extractLidJid = (record: any) => {
  const lid = typeof record?.lid === 'string'
    ? record.lid
    : (typeof record?.id === 'string' && record.id.endsWith('@lid') ? record.id : null);
  const jid = typeof record?.jid === 'string'
    ? record.jid
    : (typeof record?.id === 'string' ? record.id : null);
  return { lid, jid };
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
    contacts.forEach(contact => storeLidMapping(contact, 'contacts.upsert'));
  });
  socket.ev.on('contacts.update', (contacts: any[]) => {
    if (!Array.isArray(contacts)) return;
    contacts.forEach(contact => storeLidMapping(contact, 'contacts.update'));
  });
  socket.ev.on('chats.upsert', (chats: any[]) => {
    if (!Array.isArray(chats)) return;
    chats.forEach(chat => storeLidMapping(chat, 'chats.upsert'));
  });
  socket.ev.on('chats.update', (chats: any[]) => {
    if (!Array.isArray(chats)) return;
    chats.forEach(chat => storeLidMapping(chat, 'chats.update'));
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
    return '';
  };

  const getMediaPayload = (content: any) => {
    if (content?.imageMessage) return { payload: content.imageMessage, type: 'image' };
    if (content?.videoMessage) return { payload: content.videoMessage, type: 'video' };
    if (content?.audioMessage) return { payload: content.audioMessage, type: 'audio' };
    if (content?.documentMessage) return { payload: content.documentMessage, type: 'document' };
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
    if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid.endsWith('@broadcast')) return;

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
    if (baseJid.endsWith('@lid')) {
      const mapped = lidToJid.get(baseJid);
      if (mapped) {
        baseJid = mapped;
      } else {
        console.info('WhatsApp LID mapping missing', {
          remoteJid,
          participant,
          baseJid,
          messageId: message.key?.id
        });
        const cachedPhone = lidToPhone.get(baseJid);
        const fallbackPhone = cachedPhone || lastOutboundPhoneByUser.get(userId);
        if (!fallbackPhone) {
          return;
        }
        lidToPhone.set(baseJid, fallbackPhone);
        baseJid = `${fallbackPhone}@s.whatsapp.net`;
        console.info('WhatsApp LID mapping fallback', {
          baseJid,
          phone: fallbackPhone,
          messageId: message.key?.id
        });
      }
    }
    let phone = normalizePhone((baseJid || '').split('@')[0] || '');
    if (baseJid.endsWith('@lid')) {
      const cached = lidToPhone.get(baseJid);
      if (cached) {
        phone = cached;
      }
    }
    if (!phone) {
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
        const extension = getExtensionFromMime(mimetype);
        const userDir = path.join(MEDIA_DIR, userId);
        ensureDir(MEDIA_DIR);
        ensureDir(userDir);
        const fileName = `${messageId}.${extension}`;
        const filePath = path.join(userDir, fileName);
        fs.writeFileSync(filePath, buffer as Buffer);
        mediaUrl = `/media/whatsapp/${userId}/${fileName}`;
        mediaType = mimetype || media.type;
      } catch (error) {
        console.warn('WhatsApp media download failed:', error);
      }
    }
    const event: WhatsAppMessageEvent = {
      id: messageId,
      phone: normalizedPhone,
      text,
      mediaUrl,
      mediaType,
      direction: fromMe ? 'out' : 'in',
      at: new Date().toISOString()
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
    `SELECT id, name, phone FROM leads WHERE user_id = $1`,
    [Number(userId)]
  );
  const leads = leadsResult.rows || [];

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
