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
import { InventoryItemsService } from '../services/inventory-items.service';
import { InventoryItem } from '../entities/inventory-items.entity';

@Controller('inventory-items')
export class InventoryItemsController {
  constructor(private readonly inventoryItemsService: InventoryItemsService) {}

  @Get()
  async findAll(): Promise<InventoryItem[]> {
    return this.inventoryItemsService.findAll();
  }

  @Get('low-stock')
  async findLowStock(@Query('threshold') threshold: string): Promise<InventoryItem[]> {
    return this.inventoryItemsService.findLowStock(+threshold);
  }

  @Get('out-of-stock')
  async findOutOfStock(): Promise<InventoryItem[]> {
    return this.inventoryItemsService.findOutOfStock();
  }

  @Get('overstock')
  async findOverstock(@Query('threshold') threshold: string): Promise<InventoryItem[]> {
    return this.inventoryItemsService.findOverstock(+threshold);
  }

  @Get('stock-range')
  async findByStockRange(
    @Query('min') min: string,
    @Query('max') max: string,
  ): Promise<InventoryItem[]> {
    return this.inventoryItemsService.findByStockRange(+min, +max);
  }

  @Get('supplier/:supplierId')
  async findBySupplier(@Param('supplierId') supplierId: string): Promise<InventoryItem[]> {
    return this.inventoryItemsService.findBySupplier(+supplierId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<InventoryItem> {
    const item = await this.inventoryItemsService.findOne(+id);
    if (!item) {
      throw new HttpException('Inventory item not found', HttpStatus.NOT_FOUND);
    }
    return item;
  }

  @Post()
  async create(@Body() inventoryItem: Partial<InventoryItem>): Promise<InventoryItem> {
    return this.inventoryItemsService.create(inventoryItem);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() inventoryItem: Partial<InventoryItem>,
  ): Promise<InventoryItem> {
    const existingItem = await this.inventoryItemsService.findOne(+id);
    if (!existingItem) {
      throw new HttpException('Inventory item not found', HttpStatus.NOT_FOUND);
    }
    return this.inventoryItemsService.update(+id, inventoryItem);
  }

  @Patch(':id/stock')
  async adjustStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; type: 'add' | 'subtract' },
  ): Promise<InventoryItem> {
    return this.inventoryItemsService.adjustStock(+id, body.quantity, body.type);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const item = await this.inventoryItemsService.findOne(+id);
    if (!item) {
      throw new HttpException('Inventory item not found', HttpStatus.NOT_FOUND);
    }
    await this.inventoryItemsService.delete(+id);
  }
}
