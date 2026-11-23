import { Module } from '@nestjs/common';
import { UserCqrsHandlers } from './cqrs/handlers';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

/** Exports nothing: other modules reach Users only via CommandBus / QueryBus / EventBus. */
@Module({
  providers: [UsersRepository, UsersService, ...UserCqrsHandlers],
})
export class UsersModule {}
