export class UserLoggedInEvent {
  constructor(
    public readonly userId: string,
    public readonly at: Date,
  ) {}
}
