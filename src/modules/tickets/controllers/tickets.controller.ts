import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TicketsService, GetMyTicketsQueryDto } from '../tickets.service';
import { ApiStandardResponse } from 'src/common/decorators/api-standard-response.decorator';
import { TicketResponseDto } from '../dtos/ticket-response.dto';

@ApiTags('Tickets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('my')
  @ApiOperation({
    summary: "List the current user's tickets across all their paid orders",
    description:
      'Paginated. Includes event and ticket type details for each ticket.',
  })
  @ApiStandardResponse({ model: TicketResponseDto, isArray: true })
  getMyTickets(
    @CurrentUser('id') userId: string,
    @Query() query: GetMyTicketsQueryDto,
  ) {
    return this.ticketsService.getUserTickets(userId, query);
  }
}
