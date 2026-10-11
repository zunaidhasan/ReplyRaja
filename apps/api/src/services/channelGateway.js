const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Channel Gateway Service
 * Implements the Channel Adapter Pattern (Section 9.1)
 * Channels: Facebook Messenger, WhatsApp Cloud API, Instagram Direct, Website Widget
 */

class ChannelGateway {
  /**
   * Verify Meta / WhatsApp X-Hub-Signature-256 HMAC-SHA256 (Section 10.3)
   */
  static verifyMetaSignature(rawBody, signatureHeader, appSecret = process.env.META_APP_SECRET || 'meta_secret_test') {
    if (!signatureHeader) return false;
    const parts = signatureHeader.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') return false;

    const signature = parts[1];
    const expected = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    // Constant-time comparison
    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Normalize incoming events into unified envelope (Section 9.1)
   */
  static normalizeInboundEvent(channelType, payload) {
    const eventId = 'evt_' + uuidv4().substring(0, 8);
    const timestamp = new Date().toISOString();

    let normalized = {
      event_id: eventId,
      channel: channelType,
      timestamp,
      external_message_id: null,
      sender_id: null,
      sender_name: null,
      text: null,
      media_url: null,
      raw_payload: payload
    };

    switch (channelType) {
      case 'facebook':
      case 'instagram': {
        const entry = payload.entry?.[0];
        const messaging = entry?.messaging?.[0];
        if (messaging) {
          normalized.external_message_id = messaging.message?.mid || `mid_${Date.now()}`;
          normalized.sender_id = messaging.sender?.id;
          normalized.sender_name = messaging.sender?.name || (channelType === 'facebook' ? 'Facebook User' : 'Instagram User');
          normalized.text = messaging.message?.text || null;
          normalized.media_url = messaging.message?.attachments?.[0]?.payload?.url || null;
        }
        break;
      }

      case 'whatsapp': {
        const val = payload.entry?.[0]?.changes?.[0]?.value;
        const msg = val?.messages?.[0];
        const contact = val?.contacts?.[0];
        if (msg) {
          normalized.external_message_id = msg.id || `wa_mid_${Date.now()}`;
          normalized.sender_id = msg.from;
          normalized.sender_name = contact?.profile?.name || msg.from;
          normalized.text = msg.text?.body || null;
          normalized.media_url = msg.image?.id ? `https://media.whatsapp.com/${msg.image.id}` : null;
        }
        break;
      }

      case 'website': {
        normalized.external_message_id = payload.message_id || `web_mid_${Date.now()}`;
        normalized.sender_id = payload.customer_id || 'web_anon';
        normalized.sender_name = payload.customer_name || 'Website Visitor';
        normalized.text = payload.text || null;
        normalized.media_url = payload.media_url || null;
        break;
      }

      default:
        normalized.text = payload.text;
    }

    return normalized;
  }

  /**
   * Outbound Adapter: format provider-specific payloads (Section 9.2)
   */
  static formatOutboundPayload(channelType, { recipientId, text, mediaUrl }) {
    switch (channelType) {
      case 'facebook':
      case 'instagram':
        return {
          recipient: { id: recipientId },
          message: { text }
        };

      case 'whatsapp':
        return {
          messaging_product: 'whatsapp',
          to: recipientId,
          type: 'text',
          text: { body: text }
        };

      case 'website':
        return {
          customer_id: recipientId,
          text,
          media_url: mediaUrl
        };

      default:
        return { recipientId, text };
    }
  }
}

module.exports = ChannelGateway;
