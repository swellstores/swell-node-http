import * as axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { HttpCookieAgent, HttpsCookieAgent } from 'http-cookie-agent/http';

export enum HttpMethod {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
}

export interface HttpHeaders {
  [header: string]: string | string[] | undefined;
}

export interface ClientOptions {
  url?: string;
  verifyCert?: boolean;
  version?: number;
  timeout?: number;
  headers?: HttpHeaders;
}

const MODULE_VERSION: string = (({ name, version }) => {
  return `${name}@${version}`;
})(require('../package.json')); // eslint-disable-line @typescript-eslint/no-var-requires

const USER_APP_VERSION: string | undefined =
  process.env.npm_package_name && process.env.npm_package_version
    ? `${process.env.npm_package_name}@${process.env.npm_package_version}`
    : undefined;

const DEFAULT_OPTIONS: Readonly<ClientOptions> = Object.freeze({
  url: 'https://api.swell.store',
  verifyCert: true,
  version: 1,
  headers: {},
});

class ApiError extends Error {
  message: string;
  code?: string;
  status?: number;
  headers: HttpHeaders;

  constructor(
    message: string,
    code?: string,
    status?: number,
    headers: HttpHeaders = {},
  ) {
    super();

    this.message = message;
    this.code = code;
    this.status = status;
    this.headers = headers;
  }
}

/**
 * Swell API Client.
 */
export class Client {
  clientId?: string;
  clientKey?: string;
  options: ClientOptions;
  httpClient?: axios.AxiosInstance;

  constructor(
    clientId?: string,
    clientKey?: string,
    options: ClientOptions = {},
  ) {
    this.options = {};

    if (clientId) {
      this.init(clientId, clientKey, options);
    }
  }

  /**
   * Convenience method to create a new client instance from a singleton instance.
   */
  create(
    clientId: string,
    clientKey: string,
    options: ClientOptions = {},
  ): Client {
    return new Client(clientId, clientKey, options);
  }

  init(clientId?: string, clientKey?: string, options?: ClientOptions): void {
    if (!clientId) {
      throw new Error("Swell store 'id' is required to connect");
    }

    if (!clientKey) {
      throw new Error("Swell store 'key' is required to connect");
    }

    this.clientId = clientId;
    this.clientKey = clientKey;

    this.options = { ...DEFAULT_OPTIONS, ...options };

    this._initHttpClient();
  }

  _initHttpClient(): void {
    const { url, timeout, verifyCert, headers } = this.options;

    const authToken = Buffer.from(
      `${this.clientId}:${this.clientKey}`,
      'utf8',
    ).toString('base64');

    const jar = new CookieJar();

    this.httpClient = axios.create({
      baseURL: url,
      headers: {
        common: {
          ...headers,
          'Content-Type': 'application/json',
          'User-Agent': MODULE_VERSION,
          'X-User-Application': USER_APP_VERSION,
          Authorization: `Basic ${authToken}`,
        },
      },
      httpAgent: new HttpCookieAgent({
        cookies: { jar },
      }),
      httpsAgent: new HttpsCookieAgent({
        cookies: { jar },
        rejectUnauthorized: Boolean(verifyCert),
      }),
      ...(timeout ? { timeout } : undefined),
    });
  }

  async get(url: string, data: any): Promise<any> {
    return this.request(HttpMethod.get, url, data);
  }

  async post(url: string, data: any): Promise<any> {
    return this.request(HttpMethod.post, url, data);
  }

  async put(url: string, data: any): Promise<any> {
    return this.request(HttpMethod.put, url, data);
  }

  async delete(url: string, data: any): Promise<any> {
    return this.request(HttpMethod.delete, url, data);
  }

  async request(method: HttpMethod, url: string, data: any): Promise<any> {
    // Prepare url and data for request
    const requestObj = transformRequest(method, url, data);

    let response;
    try {
      response = await this.httpClient?.request(requestObj);
    } catch (error) {
      throw transformError(error);
    }

    return transformResponse(response).data;
  }
}

/**
 * Transforms the request.
 *
 * @param method The HTTP method
 * @param url    The request URL
 * @param data   The request data
 * @return a normalized request object
 */
function transformRequest(method: HttpMethod, url: string, data: any): any {
  return {
    method,
    url: typeof url?.toString === 'function' ? url.toString() : '',
    data: data !== undefined ? data : null,
  };
}

/**
 * Transforms the response.
 *
 * @param response The response object
 * @return a normalized response object
 */
function transformResponse(response: any): any {
  const { data, headers, status } = response;
  return {
    data,
    headers: normalizeHeaders(headers),
    status,
  };
}

/**
 * Transforms the error response.
 *
 * @param error The Error object
 * @return {Error}
 */
function transformError(error: any): ApiError {
  let code, message, status, headers;

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { data, statusText } = error.response;
    code = statusText;
    message = formatMessage(data);
    status = error.response.status;
    headers = normalizeHeaders(error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    code = 'NO_RESPONSE';
    message = 'No response from server';
  } else {
    // Something happened in setting up the request that triggered an Error
    // The request was made but no response was received
    code = error.code;
    message = error.message;
  }

  return new ApiError(
    message,
    typeof code === 'string' ? code.toUpperCase().replace(/ /g, '_') : 'ERROR',
    status,
    normalizeHeaders(headers),
  );
}

function normalizeHeaders(headers: HttpHeaders): any {
  // so that headers are not returned as AxiosHeaders
  const normalized: HttpHeaders = {};
  for (const [key, value] of Object.entries(headers || {})) {
    normalized[key] = value;
  }
  return normalized;
}

function formatMessage(message: any): any {
  // get rid of trailing newlines
  return typeof message === 'string' ? message.trim() : message;
}
