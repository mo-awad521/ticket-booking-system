import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { ReservationsService } from './reservations.service';
import { ResponseMessage } from 'src/common/filters/transform.interceptor';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Rservation created successfully.')
  createReservation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.createReservation(userId, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('My Rservations')
  getReserations(@CurrentUser('id') userId: string) {
    return this.reservationsService.getReservations(userId);
  }
}
