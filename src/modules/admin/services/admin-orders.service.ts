import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { IAdminOrderReader } from '../interfaces/admin.interfaces';
import {
  AdminOrderResponseDto,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../dtos/admin.dtos';

@Injectable()
export class AdminOrdersService implements IAdminOrderReader {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AdminOrderResponseDto>> {
    const { page, limit } = query;
    const [orders, total] = await this.orderRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResponseDto(
      orders.map((o) => new AdminOrderResponseDto(o)),
      total,
      page,
      limit,
    );
  }

  async findByUser(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AdminOrderResponseDto>> {
    const { page, limit } = query;
    const [orders, total] = await this.orderRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResponseDto(
      orders.map((o) => new AdminOrderResponseDto(o)),
      total,
      page,
      limit,
    );
  }

  async findById(id: string): Promise<AdminOrderResponseDto> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'items.ticketType'],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return new AdminOrderResponseDto(order);
  }
}
