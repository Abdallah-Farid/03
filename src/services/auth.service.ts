import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, UserRole } from '../dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/roles.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(user: any) {
    try {
      const payload = { 
        email: user.email, 
        sub: user.id,
        roles: user.roles.map(role => role.name)
      };
      
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
        },
      };
    } catch (error) {
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(registerDto.email).catch(() => null);
      if (existingUser) {
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }

      // Get the requested role or default to USER
      const roleName = registerDto.role || UserRole.USER;
      const role = await this.roleRepository.findOne({ where: { name: roleName } });
      
      if (!role) {
        throw new HttpException(`Role ${roleName} not found`, HttpStatus.BAD_REQUEST);
      }

      // Create the user with specified role
      const user = await this.usersService.create({
        ...registerDto,
        roles: [role],
      });

      // Return user without password and with token
      const { password: _, ...result } = user;
      return {
        access_token: this.jwtService.sign({ 
          email: user.email, 
          sub: user.id,
          roles: user.roles.map(role => role.name)
        }),
        user: result,
      };
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
