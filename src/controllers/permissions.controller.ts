import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import { Permission } from '../entities/permissions.entity';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async findAll(): Promise<Permission[]> {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Permission> {
    const permission = await this.permissionsService.findOne(+id);
    if (!permission) {
      throw new HttpException('Permission not found', HttpStatus.NOT_FOUND);
    }
    return permission;
  }

  @Get('role/:roleId')
  async findByRoleId(@Param('roleId') roleId: string): Promise<Permission[]> {
    return this.permissionsService.findByRoleId(+roleId);
  }

  @Post()
  async create(@Body() permission: Partial<Permission>): Promise<Permission> {
    if (!permission.name || permission.name.trim() === '') {
      throw new HttpException('Permission name is required', HttpStatus.BAD_REQUEST);
    }
    return this.permissionsService.create(permission);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() permission: Partial<Permission>,
  ): Promise<Permission> {
    const existingPermission = await this.permissionsService.findOne(+id);
    if (!existingPermission) {
      throw new HttpException('Permission not found', HttpStatus.NOT_FOUND);
    }
    if (permission.name !== undefined && permission.name.trim() === '') {
      throw new HttpException('Permission name cannot be empty', HttpStatus.BAD_REQUEST);
    }
    return this.permissionsService.update(+id, permission);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const permission = await this.permissionsService.findOne(+id);
    if (!permission) {
      throw new HttpException('Permission not found', HttpStatus.NOT_FOUND);
    }
    await this.permissionsService.delete(+id);
  }
}
