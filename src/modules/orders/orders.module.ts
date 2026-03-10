import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderExpirationService } from './services/order-expiration.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), ConfigModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderExpirationService],
  exports: [OrdersService],
})
export class OrdersModule {}
