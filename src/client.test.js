'use strict';

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const Client = require('./client');

const {
  name: packageName,
  version: packageVersion
} = require('../package.json');

const mock = new MockAdapter(axios);

describe('Client', () => {
  describe('#constructor', () => {
    let initSpy;

    beforeEach(() => {
      initSpy = jest.spyOn(Client.prototype, 'init');
    });

    it('creates an instance without initialization', () => {
      const client = new Client();

      expect(initSpy).not.toHaveBeenCalled();

      expect(client.options).toEqual({});
      expect(client.httpClient).toBeUndefined();
    });

    it('creates an instance with initialization', () => {
      const client = new Client('id', 'key', {foo: 'bar'});

      expect(initSpy).toHaveBeenCalledTimes(1);
      expect(initSpy).toHaveBeenCalledWith('id', 'key', {foo: 'bar'});

      expect(client.options.foo).toEqual('bar');
      expect(client.httpClient).toBeDefined();
    });
  });

  describe('#init', () => {
    let client;

    beforeEach(() => {
      client = new Client();
    });

    it('throws an error if "id" is missing', () => {
      expect(() => {
        client.init();
      }).toThrow(Error, "Swell store 'id' is required to connect");
    });

    it('throws an error if "key" is missing', () => {
      expect(() => {
        client.init('id');
      }).toThrow(Error, "Swell store 'key' is required to connect");
    });

    it('applies default options when none are specified', () => {
      client.init('id', 'key');

      expect(client.options).toEqual({
        headers: {},
        url: 'https://api.swell.store',
        verifyCert: true,
        version: 1,
      });
    });

    it('overrides default options', () => {
      client.init('id', 'key', {
        verifyCert: false,
        version: 2,
      });

      expect(client.options).toEqual({
        headers: {},
        url: 'https://api.swell.store',
        verifyCert: false,
        version: 2,
      });
    });

    describe('concerning headers', () => {
      it('sets default content-type header', () => {
        client.init('id', 'key');
        expect(client.httpClient.defaults.headers.common['Content-Type'])
          .toEqual('application/json');
      });

      it('sets default user-agent header', () => {
        client.init('id', 'key');
        expect(client.httpClient.defaults.headers.common['User-Agent'])
          .toEqual(`${packageName} (${packageVersion})`);
      });

      it('sets authorization header', () => {
        client.init('id', 'key');

        const authToken = Buffer.from('id:key', 'utf8').toString('base64');

        expect(client.httpClient.defaults.headers.common['Authorization'])
          .toEqual(`Basic ${authToken}`);
      });

      it('passes in extra headers', () => {
        const headers = {
          'X-Header-1': 'foo',
          'X-Header-2': 'bar',
        };

        client.init('id', 'key', { headers });

        expect(client.httpClient.defaults.headers.common['X-Header-1']).toEqual('foo');
        expect(client.httpClient.defaults.headers.common['X-Header-2']).toEqual('bar');
      });
    }); // describe: concerning headers
  }); // describe: #init

  describe('#request', () => {
    it('makes a GET request', async () => {
      const client = new Client('id', 'key');

      mock.onGet('/products/:count').reply(200, 42);

      const response = await client.request('get', '/products/:count', {});

      expect(response).toEqual(42);
    });

    it('makes a POST request', async () => {
      const client = new Client('id', 'key');

      mock.onPost('/products').reply(200, 'result');

      const response = await client.request('post', '/products', {});

      expect(response).toEqual('result');
    });

    it('makes a PUT request', async () => {
      const client = new Client('id', 'key');

      mock.onPut('/products/{id}').reply(200, 'result');

      const response = await client.request('put', '/products/{id}', { id: 'foo' });

      expect(response).toEqual('result');
    });

    it('makes a DELETE request', async () => {
      const client = new Client('id', 'key');

      mock.onDelete('/products/{id}').reply(200, 'result');

      const response = await client.request('delete', '/products/{id}', { id: 'foo' });

      expect(response).toEqual('result');
    });

    it('handles an error response', async () => {
      const client = new Client('id', 'key');

      mock.onGet('/products/:count').reply(500, 'Internal Server Error');

      await expect(client.request('get', '/products/:count', {}))
        .rejects
        .toThrow(new Error('Internal Server Error'));
    });

    it('handles a timeout', async () => {
      const client = new Client('id', 'key');

      mock.onGet('/products/:count').timeout();

      await expect(client.request('get', '/products/:count', {}))
        .rejects
        .toThrow(new Error('timeout of 0ms exceeded'));
    });
  }); // describe: #request
});
