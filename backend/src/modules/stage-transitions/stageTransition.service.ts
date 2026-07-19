import prisma from '@/config/database.js';

export class StageTransitionService {
  /**
   * Get the stage skip policy for a tenant
   */
  static async getStageSkipPolicy(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const settings = (tenant?.settings as any) || {};
    return settings.stageSkipPolicy || { mode: 'global', enabled: false };
  }

  /**
   * Update stage skip policy for a tenant
   */
  static async updateStageSkipPolicy(tenantId: string, policy: { mode: string; enabled: boolean }) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const settings = (tenant?.settings as any) || {};

    return await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          stageSkipPolicy: policy,
        },
      },
    });
  }

  /**
   * Validate whether a user is allowed to perform a stage transition
   * Rules:
   * - If stageSkipPolicy.enabled === false: all users must move sequentially (one stage at a time)
   * - If stageSkipPolicy.enabled === true: admin + salesManager can skip; salesRep cannot
   */
  static async validateTransition(
    tenantId: string,
    userId: string,
    userRole: string,
    entityType: 'lead' | 'deal',
    fromStageId: string,
    toStageId: string
  ) {
    // Consistent return shape with defaults for isSkipOverride and skippedStages
    const failure = (reason: string, message?: string) => ({
      allowed: false as const,
      reason,
      message: message || 'Stage transition not allowed',
      isSkipOverride: false as const,
      skippedStages: [] as string[],
    });

    if (fromStageId === toStageId) {
      return failure('same_stage');
    }

    const [fromStage, toStage, policy] = await Promise.all([
      prisma.pipelineStage.findUnique({ where: { id: fromStageId } }),
      prisma.pipelineStage.findUnique({ where: { id: toStageId } }),
      this.getStageSkipPolicy(tenantId),
    ]);

    if (!fromStage || !toStage) {
      return failure('invalid_stage');
    }

    if (fromStage.type !== entityType || toStage.type !== entityType) {
      return failure('stage_type_mismatch');
    }

    // Check if this is a sequential transition (adjacent stages)
    const positionDiff = toStage.position - fromStage.position;
    const isSequential = positionDiff === 1;

    // If skip is not involved, always allow
    if (isSequential) {
      return { allowed: true, isSkipOverride: false, skippedStages: [], reason: undefined, message: undefined };
    }

    // Skip is involved - check policy
    const skipEnabled = policy.enabled;

    if (!skipEnabled) {
      return failure('stage_skip_disabled', 'Stage skipping is disabled for this organization. Move leads one stage at a time.');
    }

    // Skip enabled - only admin and salesManager can skip
    const canSkip = userRole === 'admin' || userRole === 'salesManager';

    if (!canSkip) {
      return failure('skip_not_permitted', 'Only admins and sales managers can skip stages.');
    }

    // Get names of skipped stages
    const skippedStages = await prisma.pipelineStage.findMany({
      where: {
        tenantId,
        type: entityType,
        position: {
          gt: fromStage.position,
          lt: toStage.position,
        },
        isArchived: false,
      },
      orderBy: { position: 'asc' },
      select: { name: true },
    });

    return {
      allowed: true,
      isSkipOverride: true,
      skippedStages: skippedStages.map(s => s.name),
      reason: undefined,
      message: undefined,
    };
  }

  /**
   * Log a stage transition (immutable)
   */
  static async logTransition(
    tenantId: string,
    data: {
      entityId: string;
      entityType: 'lead' | 'deal';
      fromStageId: string | null;
      toStageId: string;
      fromStageName: string | null;
      toStageName: string;
      actorId: string;
      isSkipOverride: boolean;
      skippedStages: string[];
      metadata?: any;
    }
  ) {
    return await prisma.stageTransition.create({
      data: {
        tenantId,
        entityId: data.entityId,
        entityType: data.entityType,
        fromStageId: data.fromStageId,
        toStageId: data.toStageId,
        fromStageName: data.fromStageName,
        toStageName: data.toStageName,
        actorId: data.actorId,
        isSkipOverride: data.isSkipOverride,
        skippedStages: data.skippedStages,
        metadata: data.metadata || {},
      },
    });
  }

  /**
   * Get transitions for an entity (lead or deal)
   */
  static async getTransitions(tenantId: string, entityId: string) {
    return await prisma.stageTransition.findMany({
      where: { tenantId, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, firstName: true, lastName: true } },
        toStage: { select: { id: true, name: true, color: true } },
      },
    });
  }

  /**
   * Check if an entity has been fast-tracked (had a skip-override transition)
   */
  static async hasBeenFastTracked(tenantId: string, entityId: string) {
    const count = await prisma.stageTransition.count({
      where: { tenantId, entityId, isSkipOverride: true },
    });
    return count > 0;
  }

  /**
   * Get the minimum position a user can move an entity to based on role + policy
   * Used for frontend validation
   */
  static async getAllowedTargetStages(
    tenantId: string,
    userId: string,
    userRole: string,
    entityType: 'lead' | 'deal',
    currentStageId: string
  ) {
    const [currentStage, policy] = await Promise.all([
      prisma.pipelineStage.findUnique({ where: { id: currentStageId } }),
      this.getStageSkipPolicy(tenantId),
    ]);

    if (!currentStage) return [];

    const allStages = await prisma.pipelineStage.findMany({
      where: { tenantId, type: entityType, isArchived: false, isActive: true },
      orderBy: { position: 'asc' },
    });

    // If skip is disabled or user is a rep, only allow next sequential stage
    const skipEnabled = policy.enabled;
    const canSkip = userRole === 'admin' || userRole === 'salesManager';

    if (!skipEnabled || !canSkip) {
      return allStages.filter(s => s.position === currentStage.position + 1 || s.position === currentStage.position);
    }

    // Admins and managers with skip enabled can move to any stage
    return allStages;
  }
}
