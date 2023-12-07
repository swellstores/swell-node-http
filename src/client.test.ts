import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { Client, HttpMethod } from './client';

const mock = new MockAdapter(axios);

describe('Client', () => {
  describe('#constructor', () => {
    test('creates an instance without initialization', () => {
      const client = new Client();

      expect(client.options).toEqual({});
      expect(client.httpClient).toBeUndefined();
    });

    test('creates an instance with initialization', () => {
      const client = new Client('id', 'key', { timeout: 1000 });

      expect(client.options.timeout).toEqual(1000);
      expect(client.httpClient).toBeDefined();
    });
  });

  describe('#init', () => {
    let client: Client;

    beforeEach(() => {
      client = new Client();
    });

    test('throws an error if "id" is missing', () => {
      expect(() => {
        client.init();
      }).toThrow("Swell store 'id' is required to connect");
    });

    test('throws an error if "key" is missing', () => {
      expect(() => {
        client.init('id');
      }).toThrow("Swell store 'key' is required to connect");
    });

    test('applies default options when none are specified', () => {
      client.init('id', 'key');

      expect(client.options).toEqual({
        headers: {},
        url: 'https://api.swell.store',
        verifyCert: true,
        version: 1,
      });
    });

    test('overrides default options', () => {
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
      test('sets default content-type header', () => {
        client.init('id', 'key');
        expect(
          client.httpClient?.defaults.headers.common['Content-Type'],
        ).toEqual('application/json');
      });

      test('sets default user-agent header', () => {
        client.init('id', 'key');
        expect(
          client.httpClient?.defaults.headers.common['User-Agent'],
        ).toEqual(
          `${process.env.npm_package_name} (${process.env.npm_package_version})`,
        );
      });

      test('sets authorization header', () => {
        client.init('id', 'key');

        const authToken: string = Buffer.from('id:key', 'utf8').toString(
          'base64',
        );

        expect(
          client.httpClient?.defaults.headers.common['Authorization'],
        ).toEqual(`Basic ${authToken}`);
      });

      test('passes in extra headers', () => {
        const headers = {
          'X-Header-1': 'foo',
          'X-Header-2': 'bar',
        };

        client.init('id', 'key', { headers });

        expect(
          client.httpClient?.defaults.headers.common['X-Header-1'],
        ).toEqual('foo');
        expect(
          client.httpClient?.defaults.headers.common['X-Header-2'],
        ).toEqual('bar');
      });
    }); // describe: concerning headers
  }); // describe: #init

  describe('#request', () => {
    test('makes a GET request', async () => {
      const client = new Client('id', 'key');

      mock.onGet('/products/:count').reply(200, 42);

      const response: any = await client.request(
        HttpMethod.get,
        '/products/:count',
        {},
      );

      expect(response).toEqual(42);
    });

    test('makes a POST request', async () => {
      const client = new Client('id', 'key');

      mock.onPost('/products').reply(200, 'result');

      const response: any = await client.request(
        HttpMethod.post,
        '/products',
        {},
      );

      expect(response).toEqual('result');
    });

    test('makes a PUT request', async () => {
      const client = new Client('id', 'key');

      mock.onPut('/products/{id}').reply(200, 'result');

      const response: any = await client.request(
        HttpMethod.put,
        '/products/{id}',
        { id: 'foo' },
      );

      expect(response).toEqual('result');
    });

    test('makes a DELETE request', async () => {
      const client = new Client('id', 'key');

      mock.onDelete('/products/{id}').reply(200, 'result');

      const response: any = await client.request(
        HttpMethod.delete,
        '/products/{id}',
        { id: 'foo' },
      );

      expect(response).toEqual('result');
    });

    test('handles an error response', async () => {
      const client = new Client('id', 'key');

      mock.onGet('/products/:count').reply(500, 'Internal Server Error');

      await expect(
        client.request(HttpMethod.get, '/products/:count', {}),
      ).rejects.toEqual('Internal Server Error');
    });

    test('handles a timeout', async () => {
      const client = new Client('id', 'key');

      mock.onGet('/products/:count').timeout();

      await expect(
        client.request(HttpMethod.get, '/products/:count', {}),
      ).rejects.toEqual('timeout of 0ms exceeded');
    });
  }); // describe: #request
});
