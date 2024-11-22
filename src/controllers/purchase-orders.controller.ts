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
  Patch,
} from '@nestjs/common';
import { PurchaseOrdersService } from '../services/purchase-orders.service';
import { PurchaseOrder } from '../entities/purchase-orders.entity';
import { Roles } from '../decorators/roles.decorator';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  async findAll(): Promise<PurchaseOrder[]> {
    return this.purchaseOrdersService.findAll();
  }

  @Get('supplier/:supplierId')
  async findBySupplier(
    @Param('supplierId') supplierId: string,
  ): Promise<PurchaseOrder[]> {
    return this.purchaseOrdersService.findBySupplier(+supplierId);
  }

  @Get('date-range')
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<PurchaseOrder[]> {
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      throw new HttpException('Invalid date format', HttpStatus.BAD_REQUEST);
    }

    return this.purchaseOrdersService.findByDateRange(
      parsedStartDate,
      parsedEndDate,
    );
  }

  @Get('status/:status')
  @Roles('admin', 'purchase-manager', 'user')
  async findByStatus(
    @Param('status') status: 'Pending' | 'Completed' | 'Cancelled'
  ): Promise<PurchaseOrder[]> {
    if (!['Pending', 'Completed', 'Cancelled'].includes(status)) {
      throw new HttpException('Invalid status', HttpStatus.BAD_REQUEST);
    }
    return this.purchaseOrdersService.findByStatus(status);
  }

  @Get('pending')
  async findPendingOrders(): Promise<PurchaseOrder[]> {
    return this.purchaseOrdersService.findPendingOrders();
  }

  @Get('overdue')
  async findOverdueOrders(): Promise<PurchaseOrder[]> {
    return this.purchaseOrdersService.findOverdueOrders();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrdersService.findOne(+id);
    if (!purchaseOrder) {
      throw new HttpException('Purchase order not found', HttpStatus.NOT_FOUND);
    }
    return purchaseOrder;
  }

  @Get(':id/total')
  async calculateTotal(@Param('id') id: string): Promise<number> {
    return this.purchaseOrdersService.calculateTotal(+id);
  }

  @Post()
  async create(
    @Body() purchaseOrder: Partial<PurchaseOrder>,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.create(purchaseOrder);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() purchaseOrder: Partial<PurchaseOrder>,
  ): Promise<PurchaseOrder> {
    const existingPurchaseOrder = await this.purchaseOrdersService.findOne(+id);
    if (!existingPurchaseOrder) {
      throw new HttpException('Purchase order not found', HttpStatus.NOT_FOUND);
    }
    return this.purchaseOrdersService.update(+id, purchaseOrder);
  }

  @Patch(':id/status')
  @Roles('admin', 'purchase-manager')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'Pending' | 'Completed' | 'Cancelled'
  ): Promise<PurchaseOrder> {
    if (!['Pending', 'Completed', 'Cancelled'].includes(status)) {
      throw new HttpException('Invalid status', HttpStatus.BAD_REQUEST);
    }
    return this.purchaseOrdersService.updateStatus(+id, status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const purchaseOrder = await this.purchaseOrdersService.findOne(+id);
    if (!purchaseOrder) {
      throw new HttpException('Purchase order not found', HttpStatus.NOT_FOUND);
    }
    await this.purchaseOrdersService.delete(+id);
  }
}
