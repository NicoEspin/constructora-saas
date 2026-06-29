import { BudgetStatus, ProjectStatus } from '@prisma/client';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  function createService() {
    const tx = {
      project: { create: jest.fn() },
      budget: { update: jest.fn() },
    };

    const prisma = {
      project: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      budget: { findFirst: jest.fn(), update: jest.fn() },
      expense: { findMany: jest.fn() },
      projectTemplateStage: { findMany: jest.fn() },
      projectStage: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
      projectStageTask: { deleteMany: jest.fn(), createMany: jest.fn() },
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    } as any;

    const auditService = { log: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new ProjectsService(prisma, auditService);

    jest.spyOn(service as any, 'assertTenantId').mockImplementation(() => undefined);
    jest.spyOn(service as any, 'validateProjectDates').mockImplementation(() => undefined);
    jest.spyOn(service as any, 'validateReferences').mockResolvedValue(undefined);

    return { service, prisma, tx, auditService };
  }

  it('creates the project before materializing template stages outside an interactive transaction', async () => {
    const { service, prisma, auditService } = createService();
    const createdProject = {
      id: 'project-1',
      name: 'Obra Norte',
      status: ProjectStatus.PENDING,
    };
    const hydratedProject = { id: 'project-1', name: 'Obra Norte' };

    prisma.project.create.mockResolvedValue(createdProject);

    const materializeSpy = jest
      .spyOn(service as any, 'materializeStagesFromTemplate')
      .mockResolvedValue(2);
    const findProjectSpy = jest
      .spyOn(service as any, 'findProjectOrThrow')
      .mockResolvedValue(hydratedProject);

    const result = await service.create(
      'tenant-1',
      { name: 'Obra Norte', projectTemplateId: 'template-1' } as any,
      'user-1',
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          name: 'Obra Norte',
          projectTemplateId: 'template-1',
        }),
      }),
    );
    expect(materializeSpy).toHaveBeenCalledWith(prisma, 'tenant-1', 'project-1', 'template-1');
    expect(prisma.project.create.mock.invocationCallOrder[0]).toBeLessThan(
      materializeSpy.mock.invocationCallOrder[0],
    );
    expect(materializeSpy.mock.invocationCallOrder[0]).toBeLessThan(
      findProjectSpy.mock.invocationCallOrder[0],
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'project.create',
        entityId: 'project-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    );
    expect(result).toBe(hydratedProject);
  });

  it('keeps budget linking transactional and materializes template stages after the transaction closes', async () => {
    const { service, prisma, tx, auditService } = createService();
    const assignedBudget = { toString: () => '250000.00' };
    const budget = {
      id: 'budget-1',
      tenantId: 'tenant-1',
      clientId: 'client-1',
      projectId: null,
      name: 'Casa central',
      status: BudgetStatus.APPROVED,
      totalAmount: assignedBudget,
    };
    const createdProject = {
      id: 'project-2',
      name: 'Casa central',
      assignedBudget,
    };
    const hydratedProject = { id: 'project-2', name: 'Casa central' };

    prisma.budget.findFirst.mockResolvedValue(budget);
    tx.project.create.mockResolvedValue(createdProject);

    const materializeSpy = jest
      .spyOn(service as any, 'materializeStagesFromTemplate')
      .mockResolvedValue(3);
    const findProjectSpy = jest
      .spyOn(service as any, 'findProjectOrThrow')
      .mockResolvedValue(hydratedProject);

    const result = await service.convertFromBudget(
      'tenant-1',
      'budget-1',
      { projectTemplateId: 'template-9' } as any,
      'user-7',
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          clientId: 'client-1',
          projectTemplateId: 'template-9',
        }),
      }),
    );
    expect(tx.budget.update).toHaveBeenCalledWith({
      where: { id: 'budget-1' },
      data: { projectId: 'project-2' },
    });
    expect(materializeSpy).toHaveBeenCalledWith(prisma, 'tenant-1', 'project-2', 'template-9');
    expect(tx.budget.update.mock.invocationCallOrder[0]).toBeLessThan(
      materializeSpy.mock.invocationCallOrder[0],
    );
    expect(materializeSpy.mock.invocationCallOrder[0]).toBeLessThan(
      findProjectSpy.mock.invocationCallOrder[0],
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'project.convert',
        entityId: 'project-2',
        tenantId: 'tenant-1',
        userId: 'user-7',
      }),
    );
    expect(result).toBe(hydratedProject);
  });

  it('applies a linked template without wrapping stage materialization in an interactive transaction', async () => {
    const { service, prisma, auditService } = createService();
    const projectHeader = { id: 'project-3', projectTemplateId: 'template-4' };
    const hydratedProject = { id: 'project-3', name: 'Edificio Sur' };

    const findHeaderSpy = jest
      .spyOn(service as any, 'findProjectHeaderOrThrow')
      .mockResolvedValue(projectHeader);
    const materializeSpy = jest
      .spyOn(service as any, 'materializeStagesFromTemplate')
      .mockResolvedValue(4);
    const findProjectSpy = jest
      .spyOn(service as any, 'findProjectOrThrow')
      .mockResolvedValue(hydratedProject);

    const result = await service.applyTemplate(
      'tenant-1',
      'project-3',
      { mode: 'append' } as any,
      'user-9',
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(materializeSpy).toHaveBeenCalledWith(prisma, 'tenant-1', 'project-3', 'template-4');
    expect(findHeaderSpy.mock.invocationCallOrder[0]).toBeLessThan(
      materializeSpy.mock.invocationCallOrder[0],
    );
    expect(materializeSpy.mock.invocationCallOrder[0]).toBeLessThan(
      findProjectSpy.mock.invocationCallOrder[0],
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'project.template-apply',
        entityId: 'project-3',
        tenantId: 'tenant-1',
        userId: 'user-9',
        metadata: expect.objectContaining({
          projectTemplateId: 'template-4',
          createdStagesCount: 4,
        }),
      }),
    );
    expect(result).toEqual({
      project: hydratedProject,
      createdStagesCount: 4,
    });
  });
});
