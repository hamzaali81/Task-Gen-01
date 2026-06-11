import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...createEventDto,
        workspaceId,
      },
    });
  }

  async findAll(workspaceId: string) {
    const events = await this.prisma.event.findMany({
      where: { workspaceId },
      include: {
        budgetItems: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate total budget for each event
    return events.map((event) => ({
      ...event,
      totalBudget: event.budgetItems.reduce((sum, item) => sum + item.amount, 0),
    }));
  }

  async findOne(workspaceId: string, id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, workspaceId },
      include: {
        budgetItems: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Calculate budget summary
    const totalSpend = event.budgetItems.reduce((sum, item) => sum + item.amount, 0);
    
    // Group by category
    const categoryBreakdown = event.budgetItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = 0;
      }
      acc[item.category] += item.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...event,
      budgetSummary: {
        totalSpend,
        categoryBreakdown,
      },
    };
  }

  async update(workspaceId: string, id: string, updateEventDto: UpdateEventDto) {
    const event = await this.prisma.event.findFirst({
      where: { id, workspaceId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return this.prisma.event.update({
      where: { id },
      data: updateEventDto,
    });
  }

  async remove(workspaceId: string, id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, workspaceId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    await this.prisma.event.delete({ where: { id } });
    return { message: 'Event deleted successfully' };
  }
}
