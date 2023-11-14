'use strict';

const https = require('https');
const axios = require('axios');

const SwellError = require('./swell-error');

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
      throw toSwellError(error);
    }

    return transformResponse(response);
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
    url: url?.toString ? url.toString() : '',
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
 * Transforms errors into SwellError.
 *
 * @param error The Error object
 * @return SwellError
 */
function toSwellError(error) {
  let code, message, status;

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { data, statusText } = error.response;
    code = statusText;
    message = formatMessage(data);
    status = error.response.status;
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

  return new SwellError({
    code,
    message,
    status,
  });
}

function normalizeHeaders(headers) {
  // so that headers are not returned as AxiosHeaders
  return new Map(headers || {});
}

function formatMessage(message) {
  // get rid of trailing newlines
  return typeof message === 'string' ? message.trim() : message;
}

module.exports = Client;
