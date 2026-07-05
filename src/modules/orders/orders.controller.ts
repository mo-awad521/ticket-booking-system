import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateOrderDto } from './dtos/create-order.dto';
import { ResponseMessage } from 'src/common/filters/transform.interceptor';
import { ApiStandardResponse } from 'src/common/decorators/api-standard-response.decorator';
import { OrderResponseDto } from './dtos/order-response.dto';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Convert an active reservation into a payable order',
    description:
      'Snapshots unit prices at creation time, marks the reservation as COMPLETED, ' +
      'and moves the held quantities from reserved to sold. The order itself expires ' +
      'after ORDER_TTL_MINUTES (default 15 minutes) if not paid.',
  })
  @ApiStandardResponse({
    model: OrderResponseDto,
    status: 201,
    description: 'Order Created successfully.',
  })
  @ResponseMessage('Order Created successfully.')
  createOrder(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(userId, dto);
  }
}
