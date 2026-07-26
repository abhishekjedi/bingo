export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const unauthorized = (message: string) => new HttpError(401, message);
export const notFound = (message: string) => new HttpError(404, message);
export const methodNotAllowed = (message: string) => new HttpError(405, message);
