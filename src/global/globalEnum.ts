export enum HttpStatus {
  ERROR = 500,
  CREATED_SUCCESS = 201,
  SUCCESS = 200,
}

export enum HttpMessage {
  ERROR = 'Server Internal Error',
  SUCCESS = 'Server Response Successfully',
}

export enum Role {
  ADMIN = 'ADMIN',
  SHOPOWNER = 'SHOPOWNER',
  STAFF = 'STAFF',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ShiftStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
