import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItemsService } from './order-items.service';
import { OrderItem } from '../entities/order-items.entity';
import { Order } from '../entities/orders.entity';
import { InventoryItem } from '../entities/inventory-items.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('OrderItemsService', () => {
  let service: OrderItemsService;
  let orderItemRepository: Repository<OrderItem>;

  const mockInventoryItem: InventoryItem = {
    id: 1,
    name: 'Test Item',
    description: 'Test Description',
    quantity: 100,
    reorderLevel: 10,
    reorderQuantity: 50,
    autoReorder: false,
    price: 19.99,
    currentStock: 75,
    unitPrice: 19.99,
    createdAt: new Date(),
    updatedAt: new Date(),
    supplier: null,
    orderItems: [],
    purchaseOrderItems: [],
    transactions: []
  };

  const mockOrder: Order = {
    id: 1,
    customer: null,
    orderDate: new Date(),
    status: 'Pending',
    totalAmount: 39.98,
    createdAt: new Date(),
    updatedAt: new Date(),
    orderItems: []
  };

  const mockOrderItem: OrderItem = {
    id: 1,
    quantity: 2,
    unitPrice: 19.99,
    price: 19.99,
    totalPrice: 39.98,
    order: mockOrder,
    inventoryItem: mockInventoryItem
  };

  const mockOrderItemRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderItemsService,
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
      ],
    }).compile();

    service = module.get<OrderItemsService>(OrderItemsService);
    orderItemRepository = module.get<Repository<OrderItem>>(
      getRepositoryToken(OrderItem),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of order items', async () => {
      const orderItems = [mockOrderItem];
      jest.spyOn(orderItemRepository, 'find').mockResolvedValue(orderItems);

      const result = await service.findAll();
      expect(result).toEqual(orderItems);
      expect(orderItemRepository.find).toHaveBeenCalledWith({
        relations: ['order', 'inventoryItem'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a single order item', async () => {
      jest.spyOn(orderItemRepository, 'findOne').mockResolvedValue(mockOrderItem);

      const result = await service.findOne(1);
      expect(result).toEqual(mockOrderItem);
      expect(orderItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['order', 'inventoryItem'],
      });
    });

    it('should return null if order item not found', async () => {
      jest.spyOn(orderItemRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('findByOrder', () => {
    it('should return order items for a specific order', async () => {
      const orderItems = [mockOrderItem];
      jest.spyOn(orderItemRepository, 'find').mockResolvedValue(orderItems);

      const result = await service.findByOrder(1);
      expect(result).toEqual(orderItems);
      expect(orderItemRepository.find).toHaveBeenCalledWith({
        where: { order: { id: 1 } },
        relations: ['order', 'inventoryItem'],
      });
    });
  });

  describe('findByInventoryItem', () => {
    it('should return order items for a specific inventory item', async () => {
      const orderItems = [mockOrderItem];
      jest.spyOn(orderItemRepository, 'find').mockResolvedValue(orderItems);

      const result = await service.findByInventoryItem(1);
      expect(result).toEqual(orderItems);
      expect(orderItemRepository.find).toHaveBeenCalledWith({
        where: { inventoryItem: { id: 1 } },
        relations: ['order', 'inventoryItem'],
      });
    });
  });

  describe('create', () => {
    it('should create a new order item', async () => {
      const createOrderItemDto = {
        quantity: 2,
        unitPrice: 19.99,
        price: 19.99,
        totalPrice: 39.98,
        order: mockOrder,
        inventoryItem: mockInventoryItem
      };
      const newOrderItem = { ...mockOrderItem };

      jest.spyOn(orderItemRepository, 'create').mockReturnValue(newOrderItem);
      jest.spyOn(orderItemRepository, 'save').mockResolvedValue(newOrderItem);

      const result = await service.create(createOrderItemDto);
      expect(result).toEqual(newOrderItem);
      expect(orderItemRepository.create).toHaveBeenCalledWith(createOrderItemDto);
      expect(orderItemRepository.save).toHaveBeenCalledWith(newOrderItem);
    });
  });

  describe('update', () => {
    it('should update an order item', async () => {
      const updateOrderItemDto = { quantity: 3 };
      const updatedOrderItem = { ...mockOrderItem, ...updateOrderItemDto };

      jest.spyOn(orderItemRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(orderItemRepository, 'findOne').mockResolvedValue(updatedOrderItem);

      const result = await service.update(1, updateOrderItemDto);
      expect(result).toEqual(updatedOrderItem);
      expect(orderItemRepository.update).toHaveBeenCalledWith(1, updateOrderItemDto);
    });
  });

  describe('delete', () => {
    it('should delete an order item', async () => {
      jest.spyOn(orderItemRepository, 'delete').mockResolvedValue(undefined);

      await service.delete(1);
      expect(orderItemRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update order item quantity', async () => {
      const updatedOrderItem = { ...mockOrderItem, quantity: 3 };
      jest.spyOn(orderItemRepository, 'findOne').mockResolvedValue(mockOrderItem);
      jest.spyOn(orderItemRepository, 'save').mockResolvedValue(updatedOrderItem);

      const result = await service.updateQuantity(1, 3);
      expect(result).toEqual(updatedOrderItem);
      expect(orderItemRepository.save).toHaveBeenCalled();
    });

    it('should throw error if order item not found', async () => {
      jest.spyOn(orderItemRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateQuantity(999, 3)).rejects.toThrow(
        new HttpException('Order item not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('calculateSubtotal', () => {
    it('should calculate subtotal for order item', async () => {
      const orderItem = { ...mockOrderItem, quantity: 2, unitPrice: 19.99 };
      jest.spyOn(orderItemRepository, 'findOne').mockResolvedValue(orderItem);

      const result = await service.calculateSubtotal(1);
      expect(result).toEqual(39.98); // 2 * 19.99
    });

    it('should throw error if order item not found', async () => {
      jest.spyOn(orderItemRepository, 'findOne').mockResolvedValue(null);

      await expect(service.calculateSubtotal(999)).rejects.toThrow(
        new HttpException('Order item not found', HttpStatus.NOT_FOUND),
      );
    });
  });
});
