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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { OrdersService } from '../services/orders.service';
import { Order } from '../entities/orders.entity';
import { CreateOrderDto } from '../dto/create-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles('admin', 'order-manager', 'user')
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Get('customer/:customerId')
  @Roles('admin', 'order-manager', 'user')
  async findByCustomer(@Param('customerId') customerId: string): Promise<Order[]> {
    return this.ordersService.findByCustomer(+customerId);
  }

  @Get('date-range')
  @Roles('admin', 'order-manager', 'user')
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Order[]> {
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      throw new HttpException('Invalid date format', HttpStatus.BAD_REQUEST);
    }

    return this.ordersService.findByDateRange(parsedStartDate, parsedEndDate);
  }

  @Get('status/:status')
  @Roles('admin', 'order-manager', 'user')
  async findByStatus(
    @Param('status') status: 'Pending' | 'Completed' | 'Cancelled'
  ): Promise<Order[]> {
    return this.ordersService.findByStatus(status);
  }

  @Get('total')
  @Roles('admin', 'order-manager', 'user')
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
  @Roles('admin', 'order-manager', 'user')
  async findOne(@Param('id') id: string): Promise<Order> {
    const order = await this.ordersService.findOne(+id);
    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    return order;
  }

  @Get(':id/total')
  @Roles('admin', 'order-manager', 'user')
  async calculateOrderTotal(@Param('id') id: string): Promise<number> {
    return this.ordersService.calculateOrderTotal(+id);
  }

  @Post()
  @Roles('admin', 'order-manager')
  async create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(createOrderDto);
  }

  @Put(':id')
  @Roles('admin', 'order-manager')
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
  @Roles('admin', 'order-manager')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'Pending' | 'Completed' | 'Cancelled'
  ): Promise<Order> {
    return this.ordersService.updateStatus(+id, status);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string): Promise<void> {
    const order = await this.ordersService.findOne(+id);
    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    await this.ordersService.delete(+id);
  }
}
