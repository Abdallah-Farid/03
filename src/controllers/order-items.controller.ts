import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpException,
  Patch,
} from '@nestjs/common';
import { OrderItemsService } from '../services/order-items.service';
import { OrderItem } from '../entities/order-items.entity';

@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Get()
  async findAll(): Promise<OrderItem[]> {
    return this.orderItemsService.findAll();
  }

  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string): Promise<OrderItem[]> {
    return this.orderItemsService.findByOrder(+orderId);
  }

  @Get('inventory-item/:itemId')
  async findByInventoryItem(
    @Param('itemId') itemId: string,
  ): Promise<OrderItem[]> {
    return this.orderItemsService.findByInventoryItem(+itemId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<OrderItem> {
    const orderItem = await this.orderItemsService.findOne(+id);
    if (!orderItem) {
      throw new HttpException('Order item not found', HttpStatus.NOT_FOUND);
    }
    return orderItem;
  }

  @Get(':id/subtotal')
  async calculateSubtotal(@Param('id') id: string): Promise<number> {
    return this.orderItemsService.calculateSubtotal(+id);
  }

  @Post()
  async create(@Body() orderItem: Partial<OrderItem>): Promise<OrderItem> {
    return this.orderItemsService.create(orderItem);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() orderItem: Partial<OrderItem>,
  ): Promise<OrderItem> {
    const existingOrderItem = await this.orderItemsService.findOne(+id);
    if (!existingOrderItem) {
      throw new HttpException('Order item not found', HttpStatus.NOT_FOUND);
    }
    return this.orderItemsService.update(+id, orderItem);
  }

  @Patch(':id/quantity')
  async updateQuantity(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ): Promise<OrderItem> {
    return this.orderItemsService.updateQuantity(+id, quantity);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const orderItem = await this.orderItemsService.findOne(+id);
    if (!orderItem) {
      throw new HttpException('Order item not found', HttpStatus.NOT_FOUND);
    }
    await this.orderItemsService.delete(+id);
  }
}
