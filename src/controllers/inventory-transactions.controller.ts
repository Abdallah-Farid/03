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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { InventoryTransactionsService } from '../services/inventory-transactions.service';
import { InventoryTransaction } from '../entities/inventory-transactions.entity';

@Controller('inventory-transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryTransactionsController {
  constructor(
    private readonly inventoryTransactionsService: InventoryTransactionsService,
  ) {}

  @Get()
  @Roles('admin', 'inventory-manager', 'user')
  async findAll(): Promise<InventoryTransaction[]> {
    return this.inventoryTransactionsService.findAll();
  }

  @Get('item/:itemId')
  @Roles('admin', 'inventory-manager', 'user')
  async findByInventoryItem(
    @Param('itemId') itemId: string,
  ): Promise<InventoryTransaction[]> {
    return this.inventoryTransactionsService.findByInventoryItem(+itemId);
  }

  @Get('date-range')
  @Roles('admin', 'inventory-manager', 'user')
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
  @Roles('admin', 'inventory-manager', 'user')
  async findByType(
    @Param('type') type: 'IN' | 'OUT',
  ): Promise<InventoryTransaction[]> {
    return this.inventoryTransactionsService.findByType(type);
  }

  @Get(':id')
  @Roles('admin', 'inventory-manager', 'user')
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
  @Roles('admin', 'inventory-manager', 'user')
  async getRunningBalance(@Param('itemId') itemId: string): Promise<number> {
    return this.inventoryTransactionsService.getRunningBalance(+itemId);
  }

  @Get('item/:itemId/history')
  @Roles('admin', 'inventory-manager', 'user')
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
  @Roles('admin', 'inventory-manager')
  async create(
    @Body() transaction: Partial<InventoryTransaction>,
  ): Promise<InventoryTransaction> {
    return this.inventoryTransactionsService.create(transaction);
  }

  @Put(':id')
  @Roles('admin', 'inventory-manager')
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
  @Roles('admin')
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
