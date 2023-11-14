## Swell API library for NodeJS

[Swell](https://www.swell.is) is a customizable, API-first platform for powering modern B2C/B2B shopping experiences and marketplaces. Build and connect anything using your favorite technologies, and provide admins with an easy to use dashboard.

## Install

    npm install swell-node-http --save

## Connect

```javascript
const swell = require('swell-node-http');

TODO
```

## Usage

```javascript
try {
  const products = await swell.get('/products', {
    active: true
  });
  console.log(products);
} catch (err) {
  console.error(err);
}
```

## Documentation

This library is intended for use with the Swell Backend API: https://developers.swell.is/backend-api

## Contributing

Pull requests are welcome

## License

MIT
