import { CallbackService } from '../../infrastructure/services/callbackService';
import { ChoiceService } from '../../infrastructure/services/choiceService';
import { CallbackStatus } from '../../core/entities/callback';

describe('CallbackService', () => {
  const service = new CallbackService();

  it.each(Object.values(CallbackStatus))('accepts callback status %s', (status) => {
    expect(service.validateCallbackData({ status, data: 'payload' })).toBe(true);
  });

  it('rejects missing callback data and unknown statuses', () => {
    expect(service.validateCallbackData(undefined as never)).toBe(false);
    expect(service.validateCallbackData({ status: 1 as never, data: '' })).toBe(false);
    expect(service.validateCallbackData({ status: 'unknown' as CallbackStatus, data: '' })).toBe(false);
  });

  it('accepts only completed callback data as successful', () => {
    expect(service.validateCallbackSucessData(undefined as never)).toBe(false);
    expect(service.validateCallbackSucessData({ status: CallbackStatus.COMPLETED, data: '' })).toBe(true);
    expect(service.validateCallbackSucessData({ status: CallbackStatus.ERROR, data: '' })).toBe(false);
    expect(service.validateCallbackSucessData({ status: CallbackStatus.PROCESSING, data: '' })).toBe(false);
  });

  it.each([
    ['"document.PDF"', 'document.pdf', 'pdf'],
    ['result.tiff', 'result.tiff', 'tiff'],
    ['metadata.json', 'metadata.json', 'json'],
    ['document.txt', 'document.txt', ''],
  ])('resolves callback filename and extension for %s', (type, filename, extension) => {
    expect(service.getCallbackDataFile(type)).toBe(filename);
    expect(service.getCallbackDataFileExtension(type)).toBe(extension);
  });
});

describe('ChoiceService', () => {
  const service = new ChoiceService();

  it('accepts a non-empty list of supported choices', () => {
    expect(service.validateChoice({ items: [
      { service: 'Indexing', level: 0 },
      { service: 'Redaction', level: 2 },
    ] })).toBe(true);
  });

  it.each([
    undefined,
    { items: [] },
    { items: 'Indexing' },
    { items: [{ service: 'Unsupported', level: 1 }] },
    { items: [{ service: 'Indexing', level: -1 }] },
    { items: [{ service: 'Indexing', level: '1' }] },
  ])('rejects invalid choices: %o', (choice) => {
    expect(service.validateChoice(choice as never)).toBe(false);
  });
});