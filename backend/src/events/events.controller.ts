import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-workspace-id', description: 'Workspace ID', required: true })
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create event' })
  create(@Req() req: Request, @Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(req.workspaceId, createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events in workspace' })
  findAll(@Req() req: Request) {
    return this.eventsService.findAll(req.workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID with budget summary' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.eventsService.findOne(req.workspaceId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event' })
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(req.workspaceId, id, updateEventDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete event' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.eventsService.remove(req.workspaceId, id);
  }
}
