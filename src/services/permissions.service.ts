import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permissions.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      relations: ['roles'],
    });
  }

  async findOne(id: number): Promise<Permission> {
    return this.permissionRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  async findByName(name: string): Promise<Permission> {
    return this.permissionRepository.findOne({
      where: { name },
      relations: ['roles'],
    });
  }

  async create(permission: Partial<Permission>): Promise<Permission> {
    const newPermission = this.permissionRepository.create(permission);
    return this.permissionRepository.save(newPermission);
  }

  async update(id: number, permission: Partial<Permission>): Promise<Permission> {
    await this.permissionRepository.update(id, permission);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.permissionRepository.delete(id);
  }

  async findByRoleId(roleId: number): Promise<Permission[]> {
    return this.permissionRepository
      .createQueryBuilder('permission')
      .innerJoin('permission.roles', 'role')
      .where('role.id = :roleId', { roleId })
      .getMany();
  }
}
