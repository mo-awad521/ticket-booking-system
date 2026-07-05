import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScanTicketDto } from '../dtos/scan-ticket.dto';
import { TicketValidationService } from '../services/ticket-validation.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiStandardResponse } from 'src/common/decorators/api-standard-response.decorator';
import { ScanTicketResponseDto } from '../dtos/scan-ticket-response.dto';

@ApiTags('Scanner')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EVENT_STAFF)
@Controller('tickets/scanner')
export class ScannerController {
  constructor(
    private readonly ticketValidationService: TicketValidationService,
  ) {}

  @Post('scan')
  @ApiOperation({
    summary: 'Scan and check in a ticket at the event entrance',
    description:
      'Requires an active EVENT_STAFF assignment for the given event. Verifies the QR ' +
      'signature (HMAC), ensures the ticket belongs to this event, and enforces that ' +
      'each ticket can only be checked in once. Emits a ticket.checked_in event for ' +
      'real-time analytics on success.',
  })
  @ApiStandardResponse({ model: ScanTicketResponseDto })
  scan(@CurrentUser('id') staffId: string, @Body() dto: ScanTicketDto) {
    return this.ticketValidationService.validateTicket(
      dto.qrData,
      dto.eventId,
      staffId,
    );
  }
}
