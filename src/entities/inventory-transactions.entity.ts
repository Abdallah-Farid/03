 import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './users.entity';
import { InventoryItem } from './inventory-items.entity';

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => InventoryItem, (item) => item.transactions)
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'text', name: 'transaction_type', enum: ['IN', 'OUT'] })
  type: 'IN' | 'OUT';

  @ManyToOne(() => User, (user) => user.inventoryTransactions, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'transaction_date' })
  transactionDate: Date;
}
