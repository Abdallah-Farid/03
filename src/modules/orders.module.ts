import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/orders.entity';
import { OrdersService } from '../services/orders.service';
import { OrdersController } from '../controllers/orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
