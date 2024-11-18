import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Supplier } from './suppliers.entity';
import { OrderItem } from './order-items.entity';
import { PurchaseOrderItem } from './purchase-order-items.entity';
import { InventoryTransaction } from './inventory-transactions.entity';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer', default: 0 })
  quantity: number;

  @Column({ type: 'integer', name: 'reorder_level', default: 0 })
  reorderLevel: number;

  @Column({ type: 'integer', name: 'reorder_quantity', default: 0 })
  reorderQuantity: number;

  @Column({ type: 'boolean', name: 'auto_reorder', default: false })
  autoReorder: boolean;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Supplier, (supplier) => supplier.inventoryItems, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.inventoryItem)
  orderItems: OrderItem[];

  @OneToMany(() => PurchaseOrderItem, (purchaseOrderItem) => purchaseOrderItem.inventoryItem)
  purchaseOrderItems: PurchaseOrderItem[];

  @OneToMany(() => InventoryTransaction, (transaction) => transaction.inventoryItem)
  transactions: InventoryTransaction[];
}
