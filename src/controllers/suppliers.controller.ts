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
import { SuppliersService } from '../services/suppliers.service';
import { Supplier } from '../entities/suppliers.entity';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async findAll(): Promise<Supplier[]> {
    return this.suppliersService.findAll();
  }

  @Get('by-item/:itemId')
  async findByInventoryItem(@Param('itemId') itemId: string): Promise<Supplier[]> {
    return this.suppliersService.findByInventoryItem(+itemId);
  }

  @Get('by-purchase-total')
  async findByPurchaseOrderTotal(
    @Query('minTotal') minTotal: string,
  ): Promise<Supplier[]> {
    return this.suppliersService.findByPurchaseOrderTotal(+minTotal);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Supplier> {
    const supplier = await this.suppliersService.findOne(+id);
    if (!supplier) {
      throw new HttpException('Supplier not found', HttpStatus.NOT_FOUND);
    }
    return supplier;
  }

  @Post()
  async create(@Body() supplier: Partial<Supplier>): Promise<Supplier> {
    return this.suppliersService.create(supplier);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() supplier: Partial<Supplier>,
  ): Promise<Supplier> {
    const existingSupplier = await this.suppliersService.findOne(+id);
    if (!existingSupplier) {
      throw new HttpException('Supplier not found', HttpStatus.NOT_FOUND);
    }
    return this.suppliersService.update(+id, supplier);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const supplier = await this.suppliersService.findOne(+id);
    if (!supplier) {
      throw new HttpException('Supplier not found', HttpStatus.NOT_FOUND);
    }
    await this.suppliersService.delete(+id);
  }
}
