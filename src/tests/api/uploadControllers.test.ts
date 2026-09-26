import 'reflect-metadata';

import { AutoRecordController } from '../../api/controllers/autoRecordController';
import { AutoRedactController } from '../../api/controllers/autoRedactController';
import { IndexController } from '../../api/controllers/indexController';
import { ProvisionController } from '../../api/controllers/provisionController';

const response = {} as never;
const file = { mimetype: 'application/pdf', buffer: Buffer.from('document') } as Express.Multer.File;

function createHelper() {
  return {
    initIndexing: jest.fn().mockReturnValue('pdf'),
    withErrorHandling: jest.fn(async (action: () => Promise<unknown>) => action()),
  };
}

describe('file upload controllers', () => {
  it('passes uploaded PDF content to the index use case', async () => {
    const helper = createHelper();
    const execute = jest.fn().mockResolvedValue('session-1');
    const controller = new IndexController(helper as never, { execute } as never);

    await expect(controller.index({ file } as never, response)).resolves.toEqual({ session: 'session-1' });
    expect(helper.initIndexing).toHaveBeenCalledWith(file);
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ documentType: 'pdf' }));
    expect(execute.mock.calls[0][0].stream).toBeDefined();
  });

  it('passes uploaded PDF content to the auto-redact use case', async () => {
    const helper = createHelper();
    const execute = jest.fn().mockResolvedValue('session-2');
    const controller = new AutoRedactController(helper as never, { execute } as never);

    await expect(controller.autoredact({ file } as never, response)).resolves.toEqual({ session: 'session-2' });
    expect(helper.initIndexing).toHaveBeenCalledWith(file);
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ documentType: 'pdf' }));
    expect(execute.mock.calls[0][0].stream).toBeDefined();
  });

  it('passes uploaded PDF content to the auto-record use case', async () => {
    const helper = createHelper();
    const execute = jest.fn().mockResolvedValue('session-3');
    const controller = new AutoRecordController(helper as never, { execute } as never, {} as never, {} as never);

    await expect(controller.autorecord({ file } as never, response)).resolves.toEqual({ session: 'session-3' });
    expect(helper.initIndexing).toHaveBeenCalledWith(file);
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ documentType: 'pdf' }));
    expect(execute.mock.calls[0][0].stream).toBeDefined();
  });

  it('passes uploaded PDF content to the provision use case', async () => {
    const helper = createHelper();
    const execute = jest.fn().mockResolvedValue('session-4');
    const controller = new ProvisionController(helper as never, { execute } as never);

    await expect(controller.provision({ file } as never, response, { items: [] })).resolves.toEqual({ session: 'session-4' });
    expect(helper.initIndexing).toHaveBeenCalledWith(file);
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ documentType: 'pdf' }));
    expect(execute.mock.calls[0][0].stream).toBeDefined();
  });
});