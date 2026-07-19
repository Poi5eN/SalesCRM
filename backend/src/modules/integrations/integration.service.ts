import prisma from '@/config/database.js';

export interface IntegrationConfig {
  whatsapp?: {
    enabled: boolean;
    apiKey?: string;
    businessPhoneId?: string;
    webhookVerified?: boolean;
  };
  googleCalendar?: {
    enabled: boolean;
    connectedEmail?: string;
    accessToken?: string;
    refreshToken?: string;
  };
  emailSync?: {
    enabled: boolean;
    provider: 'gmail' | 'outlook' | 'none';
    connectedEmail?: string;
    lastSyncedAt?: string;
  };
}

export class IntegrationService {
  /**
   * Get integration config for a tenant
   */
  static async getConfig(tenantId: string): Promise<IntegrationConfig> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const settings = (tenant?.settings as any) || {};
    return {
      whatsapp: settings.integrations?.whatsapp || { enabled: false },
      googleCalendar: settings.integrations?.googleCalendar || { enabled: false },
      emailSync: settings.integrations?.emailSync || { enabled: false, provider: 'none' },
    };
  }

  /**
   * Update integration config
   */
  static async updateConfig(tenantId: string, updates: Partial<IntegrationConfig>) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const settings = (tenant?.settings as any) || {};
    const integrations = settings.integrations || {};

    if (updates.whatsapp) {
      integrations.whatsapp = { ...integrations.whatsapp, ...updates.whatsapp };
    }
    if (updates.googleCalendar) {
      integrations.googleCalendar = { ...integrations.googleCalendar, ...updates.googleCalendar };
    }
    if (updates.emailSync) {
      integrations.emailSync = { ...integrations.emailSync, ...updates.emailSync };
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: { ...settings, integrations } },
    });

    return integrations;
  }

  /**
   * Verify WhatsApp webhook (stub — real webhook verification would call Meta API)
   */
  static async verifyWhatsAppWebhook(tenantId: string, verificationToken: string) {
    if (verificationToken === process.env.WHATSAPP_VERIFY_TOKEN) {
      await this.updateConfig(tenantId, {
        whatsapp: { enabled: true, webhookVerified: true },
      });
      return true;
    }
    return false;
  }

  /**
   * Connect Google Calendar (stub — real flow uses OAuth2)
   */
  static async connectGoogleCalendar(tenantId: string, code: string) {
    // In production: exchange code for tokens via Google OAuth2
    // For now, store connection intent
    await this.updateConfig(tenantId, {
      googleCalendar: {
        enabled: true,
        connectedEmail: 'user@example.com',
        accessToken: 'stub_token',
        refreshToken: 'stub_refresh',
      },
    });
    return { connected: true };
  }

  /**
   * Sync WhatsApp messages for a contact
   */
  static async syncWhatsAppMessages(tenantId: string, contactPhone: string) {
    // Stub: In production, call Meta's WhatsApp Business API
    // to fetch recent messages for the contact
    return {
      synced: true,
      messageCount: 0,
      message: 'WhatsApp sync requires real Meta API credentials. Configure in Integrations settings.',
    };
  }

  /**
   * Log an incoming WhatsApp message as a communication
   */
  static async logIncomingWhatsApp(params: {
    tenantId: string;
    contactId: string;
    leadId?: string;
    dealId?: string;
    body: string;
    from: string;
    messageId: string;
  }) {
    return await prisma.communication.create({
      data: {
        tenantId: params.tenantId,
        userId: params.contactId, // placeholder — system user in production
        contactId: params.contactId,
        leadId: params.leadId || null,
        dealId: params.dealId || null,
        type: 'whatsapp',
        direction: 'inbound',
        sourceType: 'system',
        subject: `WhatsApp from ${params.from}`,
        body: params.body,
        summary: 'Auto-logged via WhatsApp integration',
        occurredAt: new Date(),
      },
    });
  }
}
