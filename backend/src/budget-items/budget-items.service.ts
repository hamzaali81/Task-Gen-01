import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';

@Injectable()
export class BudgetItemsService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
  ) {}

  async create(workspaceId: string, eventId: string, createBudgetItemDto: CreateBudgetItemDto) {
    // Verify event exists and belongs to workspace
    await this.eventsService.findOne(workspaceId, eventId);

    return this.prisma.budgetItem.create({
      data: {
        ...createBudgetItemDto,
        eventId,
      },
    });
  }

  async findAll(workspaceId: string, eventId: string) {
    // Verify event exists and belongs to workspace
    await this.eventsService.findOne(workspaceId, eventId);

    return this.prisma.budgetItem.findMany({
      where: { eventId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(workspaceId: string, eventId: string, id: string) {
    // Verify event exists and belongs to workspace
    await this.eventsService.findOne(workspaceId, eventId);

    const budgetItem = await this.prisma.budgetItem.findFirst({
      where: { id, eventId },
    });

    if (!budgetItem) {
      throw new NotFoundException(`Budget item with ID ${id} not found`);
    }

    return budgetItem;
  }

  async update(workspaceId: string, eventId: string, id: string, updateBudgetItemDto: UpdateBudgetItemDto) {
    // Verify budget item exists
    await this.findOne(workspaceId, eventId, id);

    return this.prisma.budgetItem.update({
      where: { id },
      data: updateBudgetItemDto,
    });
  }

  async remove(workspaceId: string, eventId: string, id: string) {
    // Verify budget item exists
    await this.findOne(workspaceId, eventId, id);

    await this.prisma.budgetItem.delete({ where: { id } });
    return { message: 'Budget item deleted successfully' };
  }

  async createMany(eventId: string, budgetItems: CreateBudgetItemDto[]) {
    return this.prisma.budgetItem.createMany({
      data: budgetItems.map((item) => ({
        ...item,
        eventId,
      })),
    });
  }
}
