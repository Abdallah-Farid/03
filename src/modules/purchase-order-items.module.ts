import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrderItem } from '../entities/purchase-order-items.entity';
import { PurchaseOrderItemsService } from '../services/purchase-order-items.service';
import { PurchaseOrderItemsController } from '../controllers/purchase-order-items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrderItem])],
  providers: [PurchaseOrderItemsService],
  controllers: [PurchaseOrderItemsController],
  exports: [PurchaseOrderItemsService],
})
export class PurchaseOrderItemsModule {}
