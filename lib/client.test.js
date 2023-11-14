'use strict';

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const Client = require('./client');

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
        url: 'https://api.swell.store',
        verifyCert: false,
        version: 2,
      });
    });
  }); // describe: #init

  describe('#request', () => {
    it('makes a GET request', async () => {
      const client = new Client('id', 'key');

      mock.onGet('/products/:count').reply(200, 42);

      const response = await client.request('get', '/products/:count', {});

      expect(response.status).toEqual(200);
      expect(response.data).toEqual(42);
      expect(response.headers.size).toEqual(0);
    });

    it('makes a POST request', async () => {
      const client = new Client('id', 'key');

      mock.onPost('/products').reply(200, 'result');

      const response = await client.request('post', '/products', {});

      expect(response.status).toEqual(200);
      expect(response.data).toEqual('result');
      expect(response.headers.size).toEqual(0);
    });

    it('makes a PUT request', async () => {
      const client = new Client('id', 'key');

      mock.onPut('/products/{id}').reply(200, 'result');

      const response = await client.request('put', '/products/{id}', { id: 'foo' });

      expect(response.status).toEqual(200);
      expect(response.data).toEqual('result');
      expect(response.headers.size).toEqual(0);
    });

    it('makes a DELETE request', async () => {
      const client = new Client('id', 'key');

      mock.onDelete('/products/{id}').reply(200, 'result');

      const response = await client.request('delete', '/products/{id}', { id: 'foo' });

      expect(response.status).toEqual(200);
      expect(response.data).toEqual('result');
      expect(response.headers.size).toEqual(0);
    });
  }); // describe: #request
});
