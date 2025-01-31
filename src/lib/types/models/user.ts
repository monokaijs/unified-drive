export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

export interface User {
  _id: string;
  username: string;
  password: string;
  role: UserRole;
}
