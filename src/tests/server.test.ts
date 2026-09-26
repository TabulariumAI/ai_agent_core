const startServer = jest.fn();

jest.mock('../index', () => ({ startServer }));

import '../server';

it('starts the server from the dedicated executable entrypoint', () => {
  expect(startServer).toHaveBeenCalledTimes(1);
});