type User = { id: string, roles: string[] };

export class AuthManager {
  private users: User[] = [];
  private currentUser: User | null = null;

  addUser(user: User): void {
    this.users.push(user);
  }

  authenticate(userId: string): void {
    const user = this.users.find(user => user.id === userId);
    if (user) {
      this.currentUser = user;
    } else {
      throw new Error('User not found');
    }
  }

  authorize(roles: string[]): boolean {
    if (!this.currentUser) {
      throw new Error('No user authenticated');
    }
    return roles.some(role => this.currentUser!.roles.includes(role));
  }
}
