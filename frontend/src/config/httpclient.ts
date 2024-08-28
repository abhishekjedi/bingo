import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "./httpclient.types";

const baseUrl = "http://localhost:7050";

class HttpClient {
  static axiosInstance: AxiosInstance;

  constructor() {
    HttpClient.axiosInstance = axios.create({
      url: baseUrl,
    });
  }

  async baseRequest<T>(config: AxiosRequestConfig) {
    try {
      const response = await HttpClient.axiosInstance.request<T>(config);

      return {
        isError: false,
        data: response.data,
        msg: "data recieved",
      };
    } catch (err) {
      if (err instanceof AxiosError) {
        return {
          isError: true,
          data: err.response?.data,
          msg: err.response?.statusText,
        };
      } else {
        return {
          isError: true,
          data: err,
          msg: err,
        };
      }
    }
  }

  async get<T>(requestParams: getRequest) {
    const config: AxiosRequestConfig = {
      url: `${baseUrl}${requestParams.url}`,
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
    };
    return this.baseRequest<T>(config);
  }

  async post<T, U>(requestParams: postRequest<U>) {
    const config: AxiosRequestConfig = {
      url: `${baseUrl}${requestParams.url}`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
    };
    return this.baseRequest<T>(config);
  }

  async delete<T, U>(requestParams: deleteRequest<U>) {
    const config: AxiosRequestConfig = {
      url: `${baseUrl}${requestParams.url}`,
      method: "delete",
      headers: {
        "Content-Type": "application/json",
      },
    };
    return this.baseRequest<T>(config);
  }

  async put<T, U>(requestParams: putRequest<U>) {
    const config: AxiosRequestConfig = {
      url: `${baseUrl}${requestParams.url}`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
    };
    return this.baseRequest<T>(config);
  }
}

const HttpClientInstance = new HttpClient();

export default HttpClientInstance;
