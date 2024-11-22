import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/orders.entity';
import { Customer } from '../entities/customers.entity';
import { OrderItem } from '../entities/order-items.entity';
import { InventoryItem } from '../entities/inventory-items.entity';
import { OrdersService } from '../services/orders.service';
import { OrdersController } from '../controllers/orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Customer, OrderItem, InventoryItem])],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
