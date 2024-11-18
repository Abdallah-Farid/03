import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from '../entities/suppliers.entity';
import { SuppliersService } from '../services/suppliers.service';
import { SuppliersController } from '../controllers/suppliers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  providers: [SuppliersService],
  controllers: [SuppliersController],
  exports: [SuppliersService],
})
export class SuppliersModule {}
