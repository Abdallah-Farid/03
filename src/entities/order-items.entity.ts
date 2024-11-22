import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './orders.entity';
import { InventoryItem } from './inventory-items.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Order, (order) => order.orderItems)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => InventoryItem, (item) => item.orderItems)
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
