import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/suppliers.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async findAll(): Promise<Supplier[]> {
    return this.supplierRepository.find({
      relations: ['inventoryItems', 'purchaseOrders'],
    });
  }

  async findOne(id: number): Promise<Supplier> {
    return this.supplierRepository.findOne({
      where: { id },
      relations: ['inventoryItems', 'purchaseOrders'],
    });
  }

  async findByName(name: string): Promise<Supplier> {
    return this.supplierRepository.findOne({
      where: { name },
      relations: ['inventoryItems', 'purchaseOrders'],
    });
  }

  async create(supplier: Partial<Supplier>): Promise<Supplier> {
    const newSupplier = this.supplierRepository.create(supplier);
    return this.supplierRepository.save(newSupplier);
  }

  async update(id: number, supplier: Partial<Supplier>): Promise<Supplier> {
    await this.supplierRepository.update(id, supplier);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.supplierRepository.delete(id);
  }

  async findByInventoryItem(itemId: number): Promise<Supplier[]> {
    return this.supplierRepository
      .createQueryBuilder('supplier')
      .innerJoinAndSelect('supplier.inventoryItems', 'item')
      .where('item.id = :itemId', { itemId })
      .getMany();
  }

  async findByPurchaseOrderTotal(minTotal: number): Promise<Supplier[]> {
    return this.supplierRepository
      .createQueryBuilder('supplier')
      .leftJoinAndSelect('supplier.purchaseOrders', 'po')
      .having('SUM(po.totalAmount) >= :minTotal', { minTotal })
      .groupBy('supplier.id')
      .getMany();
  }
}
