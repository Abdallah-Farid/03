import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryTransaction } from '../entities/inventory-transactions.entity';
import { InventoryTransactionsService } from '../services/inventory-transactions.service';
import { InventoryTransactionsController } from '../controllers/inventory-transactions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryTransaction])],
  providers: [InventoryTransactionsService],
  controllers: [InventoryTransactionsController],
  exports: [InventoryTransactionsService],
})
export class InventoryTransactionsModule {}
