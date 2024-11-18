import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customers.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(): Promise<Customer[]> {
    return this.customerRepository.find({
      relations: ['orders'],
    });
  }

  async findOne(id: number): Promise<Customer> {
    return this.customerRepository.findOne({
      where: { id },
      relations: ['orders'],
    });
  }

  async findByEmail(email: string): Promise<Customer> {
    return this.customerRepository.findOne({
      where: { email },
      relations: ['orders'],
    });
  }

  async create(customer: Partial<Customer>): Promise<Customer> {
    const newCustomer = this.customerRepository.create(customer);
    return this.customerRepository.save(newCustomer);
  }

  async update(id: number, customer: Partial<Customer>): Promise<Customer> {
    await this.customerRepository.update(id, customer);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.customerRepository.delete(id);
  }

  async findByOrderTotal(minTotal: number): Promise<Customer[]> {
    return this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.orders', 'order')
      .having('SUM(order.total) >= :minTotal', { minTotal })
      .groupBy('customer.id')
      .getMany();
  }
}
