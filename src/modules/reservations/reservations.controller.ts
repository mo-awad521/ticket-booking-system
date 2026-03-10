import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createReservation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.createReservation(userId, dto);
  }
}
