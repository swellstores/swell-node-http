'use strict';

class SwellError extends Error {
  constructor(error) {
    const { code, message, status } = error;

    super(message);

    this.name = 'SwellError';
    this.code =
      typeof code === 'string'
        ? code.toUpperCase().replace(/ /g, '_')
        : 'ERROR';

    if (status) {
      this.status = status;
    }
  }
}

module.exports = SwellError;
