import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { PurchaseOrder } from '../entities/purchase-orders.entity';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
  ) {}

  async findAll(): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      relations: ['supplier', 'purchaseOrderItems', 'purchaseOrderItems.inventoryItem'],
    });
  }

  async findOne(id: number): Promise<PurchaseOrder> {
    return this.purchaseOrderRepository.findOne({
      where: { id },
      relations: ['supplier', 'purchaseOrderItems', 'purchaseOrderItems.inventoryItem'],
    });
  }

  async findBySupplier(supplierId: number): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      where: { supplier: { id: supplierId } },
      relations: ['supplier', 'purchaseOrderItems', 'purchaseOrderItems.inventoryItem'],
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      where: {
        orderDate: Between(startDate, endDate),
      },
      relations: ['supplier', 'purchaseOrderItems'],
    });
  }

  async findByStatus(status: 'Pending' | 'Completed' | 'Cancelled'): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      where: { status },
      relations: ['supplier', 'purchaseOrderItems'],
    });
  }

  async create(purchaseOrder: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const newPurchaseOrder = this.purchaseOrderRepository.create(purchaseOrder);
    return this.purchaseOrderRepository.save(newPurchaseOrder);
  }

  async update(
    id: number,
    purchaseOrder: Partial<PurchaseOrder>,
  ): Promise<PurchaseOrder> {
    await this.purchaseOrderRepository.update(id, purchaseOrder);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.purchaseOrderRepository.delete(id);
  }

  async updateStatus(
    id: number,
    status: 'Pending' | 'Completed' | 'Cancelled',
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(id);
    if (!purchaseOrder) {
      throw new HttpException('Purchase order not found', HttpStatus.NOT_FOUND);
    }

    purchaseOrder.status = status;
    if (status === 'Completed') {
      purchaseOrder.receivedDate = new Date();
    }
    return this.purchaseOrderRepository.save(purchaseOrder);
  }

  async calculateTotal(id: number): Promise<number> {
    const purchaseOrder = await this.findOne(id);
    if (!purchaseOrder) {
      throw new HttpException('Purchase order not found', HttpStatus.NOT_FOUND);
    }

    return purchaseOrder.purchaseOrderItems.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    );
  }

  async findPendingOrders(): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      where: {
        status: 'Pending',
      },
      relations: ['supplier', 'purchaseOrderItems'],
      order: {
        orderDate: 'ASC',
      },
    });
  }

  async findOverdueOrders(): Promise<PurchaseOrder[]> {
    const today = new Date();
    return this.purchaseOrderRepository.find({
      where: {
        expectedDeliveryDate: LessThan(today),
        status: 'Pending',
      },
      relations: ['supplier', 'purchaseOrderItems'],
      order: {
        expectedDeliveryDate: 'ASC',
      },
    });
  }
}
