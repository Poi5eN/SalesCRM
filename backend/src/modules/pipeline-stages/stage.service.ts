import prisma from '@/config/database.ts';

export class StageService {
  static async listStages(tenantId: string, type?: string) {
    return await prisma.pipelineStage.findMany({
      where: { 
        tenantId, 
        ...(type ? { type } : {}),
        isArchived: false 
      },
      orderBy: { position: 'asc' },
    });
  }

  static async createStage(tenantId: string, data: any) {
    return await prisma.pipelineStage.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  static async updateStage(tenantId: string, id: string, data: any) {
    return await prisma.pipelineStage.update({
      where: { id, tenantId },
      data,
    });
  }

  static async archiveStage(tenantId: string, id: string, transferToStageId?: string) {
    const stage = await prisma.pipelineStage.findUnique({
      where: { id, tenantId },
      include: {
        leads: { where: { deletedAt: null } },
        deals: { where: { deletedAt: null } },
      },
    });

    if (!stage) throw { status: 404, message: 'Stage not found' };
    if (stage.isSystem) throw { status: 403, message: 'System stages cannot be archived' };

    const recordCount = stage.leads.length + stage.deals.length;

    if (recordCount > 0 && !transferToStageId) {
      throw { 
        status: 409, 
        message: `Stage has ${recordCount} active records. Please specify a transferToStageId.`,
        code: 'STAGE_HAS_RECORDS',
        count: recordCount
      };
    }

    return await prisma.$transaction(async (tx) => {
      if (transferToStageId) {
        // Migrate records
        await tx.lead.updateMany({
          where: { stageId: id, tenantId },
          data: { stageId: transferToStageId },
        });
        await tx.deal.updateMany({
          where: { stageId: id, tenantId },
          data: { stageId: transferToStageId },
        });
      }

      return await tx.pipelineStage.update({
        where: { id },
        data: { isArchived: true, isActive: false },
      });
    });
  }

  static async migrateBulk(tenantId: string, sourceId: string, targetId: string, userId: string, reason?: string) {
    const sourceStage = await prisma.pipelineStage.findUnique({ where: { id: sourceId, tenantId } });
    const targetStage = await prisma.pipelineStage.findUnique({ where: { id: targetId, tenantId } });

    if (!sourceStage || !targetStage) throw { status: 404, message: 'Stage not found' };
    if (sourceStage.type !== targetStage.type) throw { status: 400, message: 'Stages must be of same type' };

    return await prisma.$transaction(async (tx) => {
      let migratedCount = 0;

      if (sourceStage.type === 'lead') {
        const result = await tx.lead.updateMany({
          where: { stageId: sourceId, tenantId },
          data: { stageId: targetId },
        });
        migratedCount = result.count;
      } else {
        const result = await tx.deal.updateMany({
          where: { stageId: sourceId, tenantId },
          data: { stageId: targetId },
        });
        migratedCount = result.count;
      }

      await tx.stageMigration.create({
        data: {
          tenantId,
          fromStageId: sourceId,
          toStageId: targetId,
          stageType: sourceStage.type,
          migratedCount,
          migratedById: userId,
          reason,
        },
      });

      return { migratedCount };
    });
  }

  static async reorderStages(tenantId: string, items: { id: string; position: number }[]) {
    return await prisma.$transaction(async (tx) => {
      const updates = items.map((item) => 
        tx.pipelineStage.update({
          where: { id: item.id, tenantId },
          data: { position: item.position },
        })
      );
      await Promise.all(updates);
      return { success: true };
    });
  }
}
