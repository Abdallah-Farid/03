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
import { Customer } from './customers.entity';
import { OrderItem } from './order-items.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Customer, (customer) => customer.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'timestamp with time zone', name: 'order_date', default: () => 'CURRENT_TIMESTAMP' })
  orderDate: Date;

  @Column({ type: 'text', default: 'Pending' })
  status: 'Pending' | 'Completed' | 'Cancelled';

  @Column({ type: 'numeric', name: 'total_amount', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItems: OrderItem[];
}
