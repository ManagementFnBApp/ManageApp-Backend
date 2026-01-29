export type ResponseType<T> = {
    data?: T | T[] | null | undefined;
    statusCode?: number;
    message?: string;
}

export class ResponseData<D> {
  data: D | D[] | null | undefined;
  statusCode: number;
  message: string;
    
  constructor(data: D | D[] | null | undefined, statusCode: number, message: string) {
    this.data = data;
    this.statusCode = statusCode;
    this.message = message;
  }
}
