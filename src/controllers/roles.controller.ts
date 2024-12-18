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
  Patch,
} from '@nestjs/common';
import { RolesService } from '../services/roles.service';
import { Role } from '../entities/roles.entity';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Role> {
    const role = await this.rolesService.findOne(+id);
    if (!role) {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }
    return role;
  }

  @Post()
  async create(@Body() role: Partial<Role>): Promise<Role> {
    if (!role.name || role.name.trim() === '') {
      throw new HttpException('Role name is required', HttpStatus.BAD_REQUEST);
    }
    return this.rolesService.create(role);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() role: Partial<Role>,
  ): Promise<Role> {
    const existingRole = await this.rolesService.findOne(+id);
    if (!existingRole) {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }
    if (role.name !== undefined && role.name.trim() === '') {
      throw new HttpException('Role name cannot be empty', HttpStatus.BAD_REQUEST);
    }
    return this.rolesService.update(+id, role);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const role = await this.rolesService.findOne(+id);
    if (!role) {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }
    await this.rolesService.delete(+id);
  }

  @Patch(':id/permissions')
  async updatePermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: number[]; action: 'add' | 'remove' },
  ): Promise<Role> {
    const role = await this.rolesService.findOne(+id);
    if (!role) {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }

    if (!body.permissionIds || !Array.isArray(body.permissionIds) || body.permissionIds.length === 0) {
      throw new HttpException('Permission IDs must be a non-empty array', HttpStatus.BAD_REQUEST);
    }

    if (!body.action || !['add', 'remove'].includes(body.action)) {
      throw new HttpException('Action must be either "add" or "remove"', HttpStatus.BAD_REQUEST);
    }

    if (body.action === 'add') {
      return this.rolesService.addPermissions(+id, body.permissionIds);
    } else {
      return this.rolesService.removePermissions(+id, body.permissionIds);
    }
  }
}
