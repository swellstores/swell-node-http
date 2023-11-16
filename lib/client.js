'use strict';

const https = require('https');
const axios = require('axios');

const packageVersion = require('../package.json').version;

const DEFAULT_OPTIONS = Object.freeze({
  url: 'https://api.swell.store',
  verifyCert: true,
  version: 1,
});

/**
 * Swell API Client.
 */
class Client {
  static create(clientId, clientKey, options) {
    return new Client(clientId, clientKey, options);
  }

  constructor(clientId, clientKey, options) {
    this.options = {};

    if (clientId) {
      this.init(clientId, clientKey, options);
    }
  }

  init(clientId, clientKey, options) {
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

  _initHttpClient() {
    const { url, route, session, timeout, verifyCert } = this.options;

    this.httpClient = axios.create({
      baseURL: url,
      headers: {
        common: {
          'Content-Type': 'application/json',
          'User-Agent': `swell-node (${packageVersion})`,

          // authorization headers
          'X-Client': this.clientId,
          'X-Key': this.clientKey,
          ...(route ? { 'X-Route-Client': route } : undefined),
          // TODO: confirm usage
          ...(session ? { 'X-Session': session } : undefined),
        },
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: Boolean(verifyCert) }),
      ...(timeout ? { timeout } : undefined),
    });
  }

  async get(url, data) {
    return this.request('get', url, data);
  }

  async post(url, data) {
    return this.request('post', url, data);
  }

  async put(url, data) {
    return this.request('put', url, data);
  }

  async delete(url, data) {
    return this.request('delete', url, data);
  }

  async request(method, url, data) {
    // Prepare url and data for request
    const requestObj = transformRequest(method, url, data);

    let response;
    try {
      response = await this.httpClient.request(requestObj);
    } catch (error) {
      throw transformError(error).message;
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
function transformRequest(method, url, data) {
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
function transformResponse(response) {
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
function transformError(error) {
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

  const err = new Error(message);
  err.code = typeof code === 'string'
    ? code.toUpperCase().replace(/ /g, '_')
    : 'ERROR';
  if (status) {
    err.status = status;
  }
  if (headers) {
    err.headers = normalizeHeaders(headers);
  }

  return err;
}

function normalizeHeaders(headers) {
  // so that headers are not returned as AxiosHeaders
  const normalized = {};
  for (const [key, value] of Object.entries(headers || {})) {
    normalized[key] = value;
  }
  return normalized;
}

function formatMessage(message) {
  // get rid of trailing newlines
  return typeof message === 'string' ? message.trim() : message;
}

module.exports = Client;
