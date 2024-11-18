import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from '../entities/inventory-items.entity';
import { InventoryItemsService } from '../services/inventory-items.service';
import { InventoryItemsController } from '../controllers/inventory-items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem])],
  providers: [InventoryItemsService],
  controllers: [InventoryItemsController],
  exports: [InventoryItemsService],
})
export class InventoryItemsModule {}
