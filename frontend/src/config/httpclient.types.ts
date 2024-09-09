interface request {
  url: string;
}

// eslint-disable-next-line
export interface getRequest extends request {}

export interface postRequest<T> extends request {
  data: T;
}

export interface putRequest<T> extends request {
  data: T;
}

export interface deleteRequest<T> extends request {
  data: T;
}
