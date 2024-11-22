import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UsersService } from '../services/users.service';
import { User } from '../entities/users.entity';
import { AssignRoleDto } from '../dto/assign-role.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Delete(':userId/roles/:roleId')
  @Roles('admin')
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    const user = await this.usersService.findOne(+userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return this.usersService.removeRole(+userId, +roleId);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<User>,
  ) {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (updateUserDto.email !== undefined && !updateUserDto.email.includes('@')) {
      throw new HttpException('Invalid email format', HttpStatus.BAD_REQUEST);
    }

    if (updateUserDto.username !== undefined && updateUserDto.username.trim() === '') {
      throw new HttpException('Username cannot be empty', HttpStatus.BAD_REQUEST);
    }

    if (updateUserDto.password !== undefined && updateUserDto.password.length < 6) {
      throw new HttpException('Password must be at least 6 characters', HttpStatus.BAD_REQUEST);
    }

    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return this.usersService.remove(+id);
  }

  @Post('assign-role')
  @Roles('admin')
  async assignRole(@Body() assignRoleDto: AssignRoleDto) {
    const user = await this.usersService.findOne(assignRoleDto.userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!assignRoleDto.roleName || assignRoleDto.roleName.trim() === '') {
      throw new HttpException('Role name cannot be empty', HttpStatus.BAD_REQUEST);
    }

    return this.usersService.assignRole(
      assignRoleDto.userId,
      assignRoleDto.roleName,
    );
  }
}
