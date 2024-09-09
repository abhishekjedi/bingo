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

  async baseRequest(config: AxiosRequestConfig) {
    try {
      const response = await HttpClient.axiosInstance.request(config);

      return {
        isError: false,
        data: response?.data?.data,
        msg: response?.data?.message || "data recieved",
      };
      // eslint-disable-next-line
    } catch (err: any) {
      if (err instanceof AxiosError) {
        return {
          isError: true,
          data: err.response?.data,
          msg:
            err.response?.data?.message ||
            err.response?.statusText ||
            "something went wrong",
        };
      } else {
        return {
          isError: true,
          data: err,
          msg: (err.message as string) || "something went wrong",
        };
      }
    }
  }

  async get(requestParams: getRequest) {
    const config: AxiosRequestConfig = {
      url: `${baseUrl}${requestParams.url}`,
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
    };
    return this.baseRequest(config);
  }

  async post<U>(requestParams: postRequest<U>) {
    const config: AxiosRequestConfig = {
      url: `${baseUrl}${requestParams.url}`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
    };
    return this.baseRequest(config);
  }

  async delete<U>(requestParams: deleteRequest<U>) {
    const config: AxiosRequestConfig = {
      url: `${baseUrl}${requestParams.url}`,
      method: "delete",
      headers: {
        "Content-Type": "application/json",
      },
    };
    return this.baseRequest(config);
  }

  async put<U>(requestParams: putRequest<U>) {
    const config: AxiosRequestConfig = {
      url: `${baseUrl}${requestParams.url}`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
    };
    return this.baseRequest(config);
  }
}

const HttpClientInstance = new HttpClient();

export default HttpClientInstance;
