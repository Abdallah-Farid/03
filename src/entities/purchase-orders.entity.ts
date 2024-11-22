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
import { PurchaseOrderItem } from './purchase-order-items.entity';

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Supplier, (supplier) => supplier.purchaseOrders)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ type: 'timestamp with time zone', name: 'order_date', default: () => 'CURRENT_TIMESTAMP' })
  orderDate: Date;

  @Column({ type: 'text', default: 'Pending' })
  status: 'Pending' | 'Completed' | 'Cancelled';

  @Column({ type: 'numeric', name: 'total_amount', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'timestamp', nullable: true, name: 'expected_delivery_date' })
  expectedDeliveryDate: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'received_date' })
  receivedDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder)
  purchaseOrderItems: PurchaseOrderItem[];
}
