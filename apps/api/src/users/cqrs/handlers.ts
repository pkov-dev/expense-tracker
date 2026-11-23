import { CommandHandler, EventsHandler, type ICommandHandler, type IEventHandler, type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserLoggedInEvent } from '../../common/events';
import type { User } from '../../generated/prisma/client';
import { UsersService } from '../users.service';
import { CreateUserCommand } from './create-user.command';
import { GetUserByEmailQuery } from './get-user-by-email.query';
import { GetUserByIdQuery } from './get-user-by-id.query';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly users: UsersService) {}

  execute({ name, email, password }: CreateUserCommand): Promise<User> {
    return this.users.create({ name, email, password });
  }
}

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery> {
  constructor(private readonly users: UsersService) {}

  execute({ email }: GetUserByEmailQuery): Promise<User | null> {
    return this.users.findByEmail(email);
  }
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly users: UsersService) {}

  execute({ id }: GetUserByIdQuery): Promise<User | null> {
    return this.users.findById(id);
  }
}

@EventsHandler(UserLoggedInEvent)
export class UpdateLastLoginHandler implements IEventHandler<UserLoggedInEvent> {
  constructor(private readonly users: UsersService) {}

  handle({ userId, at }: UserLoggedInEvent): Promise<void> {
    return this.users.updateLastLogin(userId, at);
  }
}

export const UserCqrsHandlers = [
  CreateUserHandler,
  GetUserByEmailHandler,
  GetUserByIdHandler,
  UpdateLastLoginHandler,
];
