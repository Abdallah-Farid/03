import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from '../services/customers.service';
import { Customer } from '../entities/customers.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: CustomersService;

  const mockCustomer: Partial<Customer> = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    contactInfo: '123-456-7890',
    address: '123 Main St',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByOrderTotal: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    service = module.get<CustomersService>(CustomersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of customers', async () => {
      const customers = [mockCustomer];
      mockCustomersService.findAll.mockResolvedValue(customers);

      const result = await controller.findAll();

      expect(result).toEqual(customers);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should handle empty customer list', async () => {
      mockCustomersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockCustomersService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findByOrderTotal', () => {
    it('should return customers with orders above minimum total', async () => {
      const customers = [mockCustomer];
      mockCustomersService.findByOrderTotal.mockResolvedValue(customers);

      const result = await controller.findByOrderTotal('1000');

      expect(result).toEqual(customers);
      expect(service.findByOrderTotal).toHaveBeenCalledWith(1000);
    });

    it('should handle invalid minimum total', async () => {
      mockCustomersService.findByOrderTotal.mockRejectedValue(
        new Error('Invalid minimum total'),
      );

      await expect(controller.findByOrderTotal('invalid')).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return a single customer', async () => {
      mockCustomersService.findOne.mockResolvedValue(mockCustomer);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockCustomer);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockCustomersService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('1')).rejects.toThrow(HttpException);
      await expect(controller.findOne('1')).rejects.toThrow('Customer not found');
    });

    it('should handle invalid customer id', async () => {
      mockCustomersService.findOne.mockRejectedValue(new Error('Invalid ID'));

      await expect(controller.findOne('invalid')).rejects.toThrow();
    });
  });

  describe('create', () => {
    const createCustomerDto = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      contactInfo: '987-654-3210',
      address: '456 Oak St',
    };

    it('should create a new customer', async () => {
      const newCustomer = { id: 2, ...createCustomerDto };
      mockCustomersService.create.mockResolvedValue(newCustomer);

      const result = await controller.create(createCustomerDto);

      expect(result).toEqual(newCustomer);
      expect(service.create).toHaveBeenCalledWith(createCustomerDto);
    });

    it('should handle duplicate email error', async () => {
      mockCustomersService.create.mockRejectedValue(
        new Error('Email already exists'),
      );

      await expect(controller.create(createCustomerDto)).rejects.toThrow();
    });

    it('should handle validation errors', async () => {
      const invalidCustomer = { name: '' };
      mockCustomersService.create.mockRejectedValue(
        new Error('Validation failed'),
      );

      await expect(controller.create(invalidCustomer)).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updateCustomerDto = {
      name: 'Updated Name',
      contactInfo: 'Updated Contact',
    };

    it('should update an existing customer', async () => {
      const updatedCustomer = { ...mockCustomer, ...updateCustomerDto };
      mockCustomersService.findOne.mockResolvedValue(mockCustomer);
      mockCustomersService.update.mockResolvedValue(updatedCustomer);

      const result = await controller.update('1', updateCustomerDto);

      expect(result).toEqual(updatedCustomer);
      expect(service.update).toHaveBeenCalledWith(1, updateCustomerDto);
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockCustomersService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', updateCustomerDto)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.update('1', updateCustomerDto)).rejects.toThrow(
        'Customer not found',
      );
    });

    it('should handle validation errors', async () => {
      mockCustomersService.findOne.mockResolvedValue(mockCustomer);
      mockCustomersService.update.mockRejectedValue(
        new Error('Validation failed'),
      );

      await expect(
        controller.update('1', { name: '' }),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete an existing customer', async () => {
      mockCustomersService.findOne.mockResolvedValue(mockCustomer);
      mockCustomersService.delete.mockResolvedValue(undefined);

      await expect(controller.delete('1')).resolves.toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockCustomersService.findOne.mockResolvedValue(null);

      await expect(controller.delete('1')).rejects.toThrow(HttpException);
      await expect(controller.delete('1')).rejects.toThrow('Customer not found');
    });

    it('should handle delete operation errors', async () => {
      mockCustomersService.findOne.mockResolvedValue(mockCustomer);
      mockCustomersService.delete.mockRejectedValue(
        new Error('Delete operation failed'),
      );

      await expect(controller.delete('1')).rejects.toThrow();
    });
  });
});
