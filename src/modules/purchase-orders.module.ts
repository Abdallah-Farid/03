import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from '../entities/purchase-orders.entity';
import { PurchaseOrdersService } from '../services/purchase-orders.service';
import { PurchaseOrdersController } from '../controllers/purchase-orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrder])],
  providers: [PurchaseOrdersService],
  controllers: [PurchaseOrdersController],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
