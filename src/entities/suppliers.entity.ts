import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { InventoryItem } from './inventory-items.entity';
import { PurchaseOrder } from './purchase-orders.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  contactInfo: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => InventoryItem, (item) => item.supplier)
  inventoryItems: InventoryItem[];

  @OneToMany(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.supplier)
  purchaseOrders: PurchaseOrder[];
}
