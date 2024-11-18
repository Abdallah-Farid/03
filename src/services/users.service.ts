import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/users.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.usersRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        );
      }

      // Hash password
      if (userData.password) {
        const salt = await bcrypt.genSalt();
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      const user = this.usersRepository.create(userData);
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.usersRepository.find({
        relations: ['roles', 'notifications'],
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: number): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id },
        relations: ['roles', 'notifications'],
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({
        where: { email },
        relations: ['roles', 'notifications'],
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    try {
      const user = await this.findOne(id);

      // If updating password, hash it
      if (userData.password) {
        const salt = await bcrypt.genSalt();
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      // If updating email, check if new email is already taken
      if (userData.email && userData.email !== user.email) {
        const existingUser = await this.usersRepository.findOne({
          where: { email: userData.email },
        });

        if (existingUser) {
          throw new HttpException(
            'Email is already taken',
            HttpStatus.CONFLICT,
          );
        }
      }

      Object.assign(user, userData);
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const user = await this.findOne(id);
      await this.usersRepository.remove(user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async validatePassword(email: string, password: string): Promise<User> {
    try {
      const user = await this.findByEmail(email);
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new HttpException(
          'Invalid credentials',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to validate user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
