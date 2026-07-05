import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { ReservationsService } from './reservations.service';
import { ResponseMessage } from 'src/common/filters/transform.interceptor';
import { ApiStandardResponse } from 'src/common/decorators/api-standard-response.decorator';
import { ReservationResponseDto } from './dtos/reservation-response.dto';

@ApiTags('Reservations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a reservation (time-limited hold on ticket inventory)',
    description:
      'Locks ticket inventory with a pessimistic write lock and holds it for ' +
      'RESERVATION_EXPIRY_MINUTES (default 10 minutes). Duplicate ticketTypeId ' +
      'entries in the same request are automatically merged.',
  })
  @ApiStandardResponse({
    model: ReservationResponseDto,
    status: 201,
    description: 'Rservation created successfully.',
  })
  @ResponseMessage('Rservation created successfully.')
  createReservation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.createReservation(userId, dto);
  }

  @Get('my')
  @ApiOperation({
    summary: 'List all reservations for the current user (any status)',
  })
  @ApiStandardResponse({
    model: ReservationResponseDto,
    isArray: true,
    description: 'My Rservations',
  })
  @ResponseMessage('My Rservations')
  getReserations(@CurrentUser('id') userId: string) {
    return this.reservationsService.getReservations(userId);
  }
}
