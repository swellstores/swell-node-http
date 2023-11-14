'use strict';

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const Client = require('./client');

const mock = new MockAdapter(axios);

describe('Client', () => {
  describe('#constructor', () => {
    it('applies default options when none are specified', () => {
      const client = new Client('id', 'key');

      expect(client.options).toEqual({
        url: 'https://api.swell.store',
        verifyCert: true,
        version: 1,
      });
    });

    it('overrides default options', () => {
      const client = new Client('id', 'key', {
        verifyCert: false,
        version: 2,
      });

      expect(client.options).toEqual({
        url: 'https://api.swell.store',
        verifyCert: false,
        version: 2,
      });
    });
  }); // describe: #constructor

  describe('#request', () => {
    it('makes a GET request', async () => {
      const client = new Client('id', 'key');

      mock.onGet('/products/:count').reply(200, 42);

      const response = await client.request('get', '/products/:count', {});

      expect(response.status).toEqual(200);
      expect(response.data).toEqual(42);
      expect(response.headers.size).toEqual(0);
    });
  }); // describe: #request
});
