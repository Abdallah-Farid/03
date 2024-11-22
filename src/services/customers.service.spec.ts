import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomersService } from './customers.service';
import { Customer } from '../entities/customers.entity';
import { Order } from '../entities/orders.entity';

describe('CustomersService', () => {
  let service: CustomersService;
  let customerRepository: Repository<Customer>;

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

  const mockCustomer: Customer = {
    id: 1,
    name: 'John Doe',
    contactInfo: '+1234567890',
    address: '123 Main St',
    email: 'john.doe@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    orders: [mockOrder]
  };

  const mockCustomerRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    customerRepository = module.get<Repository<Customer>>(
      getRepositoryToken(Customer),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of customers', async () => {
      const customers = [mockCustomer];
      jest.spyOn(customerRepository, 'find').mockResolvedValue(customers);

      const result = await service.findAll();
      expect(result).toEqual(customers);
      expect(customerRepository.find).toHaveBeenCalledWith({
        relations: ['orders'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a single customer', async () => {
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(mockCustomer);

      const result = await service.findOne(1);
      expect(result).toEqual(mockCustomer);
      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['orders'],
      });
    });

    it('should return null if customer not found', async () => {
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a customer by email', async () => {
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(mockCustomer);

      const result = await service.findByEmail('john.doe@example.com');
      expect(result).toEqual(mockCustomer);
      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john.doe@example.com' },
        relations: ['orders'],
      });
    });

    it('should return null if customer not found', async () => {
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createCustomerDto = {
        name: 'John Doe',
        contactInfo: '+1234567890',
        address: '123 Main St',
        email: 'john.doe@example.com',
      };
      const newCustomer = { ...mockCustomer };

      jest.spyOn(customerRepository, 'create').mockReturnValue(newCustomer);
      jest.spyOn(customerRepository, 'save').mockResolvedValue(newCustomer);

      const result = await service.create(createCustomerDto);
      expect(result).toEqual(newCustomer);
      expect(customerRepository.create).toHaveBeenCalledWith(createCustomerDto);
      expect(customerRepository.save).toHaveBeenCalledWith(newCustomer);
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const updateCustomerDto = { name: 'Jane Doe' };
      const updatedCustomer = { ...mockCustomer, ...updateCustomerDto };

      jest.spyOn(customerRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(updatedCustomer);

      const result = await service.update(1, updateCustomerDto);
      expect(result).toEqual(updatedCustomer);
      expect(customerRepository.update).toHaveBeenCalledWith(1, updateCustomerDto);
    });
  });

  describe('delete', () => {
    it('should delete a customer', async () => {
      jest.spyOn(customerRepository, 'delete').mockResolvedValue(undefined);

      await service.delete(1);
      expect(customerRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('findByOrderTotal', () => {
    it('should return customers with order total above minimum', async () => {
      const customers = [mockCustomer];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(customers),
      };

      jest.spyOn(customerRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findByOrderTotal(100);
      expect(result).toEqual(customers);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('customer');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('customer.orders', 'order');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('SUM(order.totalAmount)', 'total_amount');
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('customer.id');
      expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('customer.name');
      expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('customer.contactInfo');
      expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('customer.address');
      expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('customer.email');
      expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('customer.createdAt');
      expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('customer.updatedAt');
      expect(mockQueryBuilder.having).toHaveBeenCalledWith('SUM(order.totalAmount) >= :minTotal', { minTotal: 100 });
    });

    it('should return empty array if no customers found', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(customerRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findByOrderTotal(1000);
      expect(result).toEqual([]);
    });
  });
});
