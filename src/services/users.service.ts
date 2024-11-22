import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/users.entity';
import { Role } from '../entities/roles.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
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

      // Use provided roles or get default user role
      let userRoles = userData.roles;
      if (!userRoles || userRoles.length === 0) {
        const defaultRole = await this.roleRepository.findOne({
          where: { name: 'user' },
        });

        if (!defaultRole) {
          throw new HttpException(
            'Default role not found',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        userRoles = [defaultRole];
      }

      // Create user with roles
      const user = this.usersRepository.create({
        ...userData,
        roles: userRoles,
      });

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
        relations: ['roles'],
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
        relations: ['roles'],
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
        relations: ['roles'],
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

  async update(id: number, updateUserDto: Partial<User>): Promise<User> {
    const user = await this.findOne(id);

    // Hash password if it's being updated
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async assignRole(userId: number, roleName: string): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['roles'],
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const role = await this.roleRepository.findOne({
        where: { name: roleName },
      });

      if (!role) {
        throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
      }

      // Check if user already has this role
      const hasRole = user.roles.some((r) => r.name === roleName);
      if (hasRole) {
        throw new HttpException(
          'User already has this role',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Add the new role to existing roles
      user.roles.push(role);
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to assign role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeRole(userId: number, roleId: number): Promise<User> {
    const user = await this.findOne(userId);
    const role = await this.roleRepository.findOne({ where: { id: roleId } });

    if (!role) {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }

    user.roles = user.roles.filter(r => r.id !== role.id);
    return this.usersRepository.save(user);
  }
}
