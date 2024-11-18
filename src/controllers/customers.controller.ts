import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { CustomersService } from '../services/customers.service';
import { Customer } from '../entities/customers.entity';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(): Promise<Customer[]> {
    return this.customersService.findAll();
  }

  @Get('order-total')
  async findByOrderTotal(@Query('minTotal') minTotal: string): Promise<Customer[]> {
    return this.customersService.findByOrderTotal(+minTotal);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Customer> {
    const customer = await this.customersService.findOne(+id);
    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }
    return customer;
  }

  @Post()
  async create(@Body() customer: Partial<Customer>): Promise<Customer> {
    return this.customersService.create(customer);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() customer: Partial<Customer>,
  ): Promise<Customer> {
    const existingCustomer = await this.customersService.findOne(+id);
    if (!existingCustomer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }
    return this.customersService.update(+id, customer);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const customer = await this.customersService.findOne(+id);
    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }
    await this.customersService.delete(+id);
  }
}
