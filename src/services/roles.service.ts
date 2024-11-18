import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/roles.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions', 'users'],
    });
  }

  async findOne(id: number): Promise<Role> {
    return this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'users'],
    });
  }

  async findByName(name: string): Promise<Role> {
    return this.roleRepository.findOne({
      where: { name },
      relations: ['permissions', 'users'],
    });
  }

  async create(role: Partial<Role>): Promise<Role> {
    const newRole = this.roleRepository.create(role);
    return this.roleRepository.save(newRole);
  }

  async update(id: number, role: Partial<Role>): Promise<Role> {
    await this.roleRepository.update(id, role);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.roleRepository.delete(id);
  }

  async addPermissions(id: number, permissionIds: number[]): Promise<Role> {
    const role = await this.findOne(id);
    if (!role) return null;

    role.permissions = [
      ...role.permissions,
      ...permissionIds.map(permId => ({ id: permId } as any)),
    ];

    return this.roleRepository.save(role);
  }

  async removePermissions(id: number, permissionIds: number[]): Promise<Role> {
    const role = await this.findOne(id);
    if (!role) return null;

    role.permissions = role.permissions.filter(
      permission => !permissionIds.includes(permission.id),
    );

    return this.roleRepository.save(role);
  }
}
