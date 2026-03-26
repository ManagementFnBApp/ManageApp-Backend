export enum HttpStatus {
  ERROR = 500,
  CREATED_SUCCESS = 201,
  SUCCESS = 200,
  BAD_REQUEST = 400,
}

export enum HttpMessage {
  ERROR = 'Server Internal Error',
  SUCCESS = 'Server Response Successfully',
  BAD_REQUEST = 'Bad Request',
}

export enum Role {
  ADMIN = 'ADMIN',
  SHOPOWNER = 'SHOPOWNER',
  STAFF = 'STAFF',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
