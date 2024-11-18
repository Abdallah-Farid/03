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
import { PurchaseOrderItemsService } from '../services/purchase-order-items.service';
import { PurchaseOrderItem } from '../entities/purchase-order-items.entity';

@Controller('purchase-order-items')
export class PurchaseOrderItemsController {
  constructor(
    private readonly purchaseOrderItemsService: PurchaseOrderItemsService,
  ) {}

  @Get()
  async findAll(): Promise<PurchaseOrderItem[]> {
    return this.purchaseOrderItemsService.findAll();
  }

  @Get('order/:orderId')
  async findByPurchaseOrder(
    @Param('orderId') orderId: string,
  ): Promise<PurchaseOrderItem[]> {
    return this.purchaseOrderItemsService.findByPurchaseOrder(+orderId);
  }

  @Get('inventory-item/:itemId')
  async findByInventoryItem(
    @Param('itemId') itemId: string,
  ): Promise<PurchaseOrderItem[]> {
    return this.purchaseOrderItemsService.findByInventoryItem(+itemId);
  }

  @Get('inventory-item/:itemId/pending')
  async findPendingItemsByInventoryItem(
    @Param('itemId') itemId: string,
  ): Promise<PurchaseOrderItem[]> {
    return this.purchaseOrderItemsService.findPendingItemsByInventoryItem(+itemId);
  }

  @Get('inventory-item/:itemId/pending-quantity')
  async getTotalPendingQuantity(@Param('itemId') itemId: string): Promise<number> {
    return this.purchaseOrderItemsService.getTotalPendingQuantity(+itemId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PurchaseOrderItem> {
    const purchaseOrderItem = await this.purchaseOrderItemsService.findOne(+id);
    if (!purchaseOrderItem) {
      throw new HttpException(
        'Purchase order item not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return purchaseOrderItem;
  }

  @Get(':id/subtotal')
  async calculateSubtotal(@Param('id') id: string): Promise<number> {
    return this.purchaseOrderItemsService.calculateSubtotal(+id);
  }

  @Post()
  async create(
    @Body() purchaseOrderItem: Partial<PurchaseOrderItem>,
  ): Promise<PurchaseOrderItem> {
    return this.purchaseOrderItemsService.create(purchaseOrderItem);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() purchaseOrderItem: Partial<PurchaseOrderItem>,
  ): Promise<PurchaseOrderItem> {
    const existingPurchaseOrderItem =
      await this.purchaseOrderItemsService.findOne(+id);
    if (!existingPurchaseOrderItem) {
      throw new HttpException(
        'Purchase order item not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.purchaseOrderItemsService.update(+id, purchaseOrderItem);
  }

  @Patch(':id/quantity')
  async updateQuantity(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ): Promise<PurchaseOrderItem> {
    return this.purchaseOrderItemsService.updateQuantity(+id, quantity);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const purchaseOrderItem = await this.purchaseOrderItemsService.findOne(+id);
    if (!purchaseOrderItem) {
      throw new HttpException(
        'Purchase order item not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.purchaseOrderItemsService.delete(+id);
  }
}
