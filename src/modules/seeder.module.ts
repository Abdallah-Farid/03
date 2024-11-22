import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../entities/roles.entity';
import { SeederService } from '../services/seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
