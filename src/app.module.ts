import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entity imports
import { User } from './entities/users.entity';
import { Role } from './entities/roles.entity';
import { Permission } from './entities/permissions.entity';
import { Customer } from './entities/customers.entity';
import { Supplier } from './entities/suppliers.entity';
import { InventoryItem } from './entities/inventory-items.entity';
import { Order } from './entities/orders.entity';
import { OrderItem } from './entities/order-items.entity';
import { PurchaseOrder } from './entities/purchase-orders.entity';
import { PurchaseOrderItem } from './entities/purchase-order-items.entity';
import { Notification } from './entities/notifications.entity';
import { InventoryTransaction } from './entities/inventory-transactions.entity';

// Module imports
import { AuthModule } from './modules/auth.module';
import { UsersModule } from './modules/users.module';
import { RolesModule } from './modules/roles.module';
import { PermissionsModule } from './modules/permissions.module';
import { CustomersModule } from './modules/customers.module';
import { SuppliersModule } from './modules/suppliers.module';
import { InventoryItemsModule } from './modules/inventory-items.module';
import { OrdersModule } from './modules/orders.module';
import { OrderItemsModule } from './modules/order-items.module';
import { InventoryTransactionsModule } from './modules/inventory-transactions.module';
import { NotificationsModule } from './modules/notifications.module';
import { PurchaseOrdersModule } from './modules/purchase-orders.module';
import { PurchaseOrderItemsModule } from './modules/purchase-order-items.module';
import { SeederModule } from './modules/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [
          User,
          Role,
          Permission,
          Customer,
          Supplier,
          InventoryItem,
          Order,
          OrderItem,
          PurchaseOrder,
          PurchaseOrderItem,
          Notification,
          InventoryTransaction,
        ],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CustomersModule,
    SuppliersModule,
    InventoryItemsModule,
    OrdersModule,
    OrderItemsModule,
    InventoryTransactionsModule,
    NotificationsModule,
    PurchaseOrdersModule,
    PurchaseOrderItemsModule,
    SeederModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
