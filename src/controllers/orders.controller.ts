import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Patch,
} from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { Order } from '../entities/orders.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Get('customer/:customerId')
  async findByCustomer(@Param('customerId') customerId: string): Promise<Order[]> {
    return this.ordersService.findByCustomer(+customerId);
  }

  @Get('date-range')
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Order[]> {
    return this.ordersService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('status/:status')
  async findByStatus(@Param('status') status: string): Promise<Order[]> {
    return this.ordersService.findByStatus(status);
  }

  @Get('total')
  async findByTotalAmount(
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
  ): Promise<Order[]> {
    return this.ordersService.findByTotalAmount(
      minAmount ? +minAmount : undefined,
      maxAmount ? +maxAmount : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Order> {
    const order = await this.ordersService.findOne(+id);
    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    return order;
  }

  @Get(':id/total')
  async calculateOrderTotal(@Param('id') id: string): Promise<number> {
    return this.ordersService.calculateOrderTotal(+id);
  }

  @Post()
  async create(@Body() order: Partial<Order>): Promise<Order> {
    return this.ordersService.create(order);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() order: Partial<Order>,
  ): Promise<Order> {
    const existingOrder = await this.ordersService.findOne(+id);
    if (!existingOrder) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    return this.ordersService.update(+id, order);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<Order> {
    return this.ordersService.updateStatus(+id, status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const order = await this.ordersService.findOne(+id);
    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    await this.ordersService.delete(+id);
  }
}
