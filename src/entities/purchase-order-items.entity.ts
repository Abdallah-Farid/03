import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-orders.entity';
import { InventoryItem } from './inventory-items.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.purchaseOrderItems)
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @ManyToOne(() => InventoryItem, (item) => item.purchaseOrderItems)
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'numeric', name: 'unit_price', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'numeric', name: 'total_price', precision: 12, scale: 2 })
  totalPrice: number;
}
