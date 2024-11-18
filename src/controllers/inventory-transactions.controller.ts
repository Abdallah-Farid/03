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
} from '@nestjs/common';
import { InventoryTransactionsService } from '../services/inventory-transactions.service';
import { InventoryTransaction } from '../entities/inventory-transactions.entity';

@Controller('inventory-transactions')
export class InventoryTransactionsController {
  constructor(
    private readonly inventoryTransactionsService: InventoryTransactionsService,
  ) {}

  @Get()
  async findAll(): Promise<InventoryTransaction[]> {
    return this.inventoryTransactionsService.findAll();
  }

  @Get('item/:itemId')
  async findByInventoryItem(
    @Param('itemId') itemId: string,
  ): Promise<InventoryTransaction[]> {
    return this.inventoryTransactionsService.findByInventoryItem(+itemId);
  }

  @Get('date-range')
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<InventoryTransaction[]> {
    return this.inventoryTransactionsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('type/:type')
  async findByType(
    @Param('type') type: string,
  ): Promise<InventoryTransaction[]> {
    return this.inventoryTransactionsService.findByType(type);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<InventoryTransaction> {
    const transaction = await this.inventoryTransactionsService.findOne(+id);
    if (!transaction) {
      throw new HttpException(
        'Inventory transaction not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return transaction;
  }

  @Get('item/:itemId/balance')
  async getRunningBalance(@Param('itemId') itemId: string): Promise<number> {
    return this.inventoryTransactionsService.getRunningBalance(+itemId);
  }

  @Get('item/:itemId/history')
  async getTransactionHistory(
    @Param('itemId') itemId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<InventoryTransaction[]> {
    return this.inventoryTransactionsService.getTransactionHistory(
      +itemId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post()
  async create(
    @Body() transaction: Partial<InventoryTransaction>,
  ): Promise<InventoryTransaction> {
    return this.inventoryTransactionsService.create(transaction);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() transaction: Partial<InventoryTransaction>,
  ): Promise<InventoryTransaction> {
    const existingTransaction = await this.inventoryTransactionsService.findOne(
      +id,
    );
    if (!existingTransaction) {
      throw new HttpException(
        'Inventory transaction not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.inventoryTransactionsService.update(+id, transaction);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const transaction = await this.inventoryTransactionsService.findOne(+id);
    if (!transaction) {
      throw new HttpException(
        'Inventory transaction not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.inventoryTransactionsService.delete(+id);
  }
}
