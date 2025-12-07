export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  firebaseUid: string;
  hotelId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  hotelId?: string;
}

export interface UserWithHotel extends User {
  hotel: {
    id: string;
    name: string;
    code: string;
  } | null;
}

