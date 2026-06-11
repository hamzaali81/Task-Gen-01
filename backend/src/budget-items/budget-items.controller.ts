import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { BudgetItemsService } from './budget-items.service';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('budget-items')
@Controller('events/:eventId/budget-items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-workspace-id', description: 'Workspace ID', required: true })
export class BudgetItemsController {
  constructor(private readonly budgetItemsService: BudgetItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Add budget item to event' })
  create(
    @Req() req: Request,
    @Param('eventId') eventId: string,
    @Body() createBudgetItemDto: CreateBudgetItemDto,
  ) {
    return this.budgetItemsService.create(req.workspaceId, eventId, createBudgetItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budget items for event' })
  findAll(@Req() req: Request, @Param('eventId') eventId: string) {
    return this.budgetItemsService.findAll(req.workspaceId, eventId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget item by ID' })
  findOne(@Req() req: Request, @Param('eventId') eventId: string, @Param('id') id: string) {
    return this.budgetItemsService.findOne(req.workspaceId, eventId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update budget item' })
  update(
    @Req() req: Request,
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Body() updateBudgetItemDto: UpdateBudgetItemDto,
  ) {
    return this.budgetItemsService.update(req.workspaceId, eventId, id, updateBudgetItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget item' })
  remove(@Req() req: Request, @Param('eventId') eventId: string, @Param('id') id: string) {
    return this.budgetItemsService.remove(req.workspaceId, eventId, id);
  }
}
