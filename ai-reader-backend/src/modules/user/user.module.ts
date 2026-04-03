import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ArticleModule } from '../article/article.module';
import { ColumnModule } from '../column/column.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ArticleModule,
    ColumnModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
