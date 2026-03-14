import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TicketsService, GetMyTicketsQueryDto } from '../tickets.service';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('my')
  getMyTickets(
    @CurrentUser('id') userId: string,
    @Query() query: GetMyTicketsQueryDto,
  ) {
    return this.ticketsService.getUserTickets(userId, query);
  }
}
