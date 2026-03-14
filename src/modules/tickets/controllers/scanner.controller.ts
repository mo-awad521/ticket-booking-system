import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ScanTicketDto } from '../dtos/scan-ticket.dto';
import { TicketValidationService } from '../services/ticket-validation.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EVENT_STAFF)
@Controller('tickets/scanner')
export class ScannerController {
  constructor(
    private readonly ticketValidationService: TicketValidationService,
  ) {}

  @Post('scan')
  scan(@CurrentUser('id') staffId: string, @Body() dto: ScanTicketDto) {
    return this.ticketValidationService.validateTicket(
      dto.qrData,
      dto.eventId,
      staffId,
    );
  }
}
