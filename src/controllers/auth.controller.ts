import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto, UserRole } from '../dto/auth.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    try {
      if (!req.user) {
        throw new HttpException('User not found in request', HttpStatus.BAD_REQUEST);
      }
      return this.authService.login(req.user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      // Validate role if provided
      if (registerDto.role && !Object.values(UserRole).includes(registerDto.role)) {
        throw new HttpException('Invalid role', HttpStatus.BAD_REQUEST);
      }
      return this.authService.register(registerDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Registration failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
