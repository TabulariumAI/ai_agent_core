import { FileTypeService } from '../../infrastructure/services/fileTypeService';

describe('FileTypeService', () => {
  const service = new FileTypeService();

  it.each([
    ['application/pdf', 'pdf'],
    ['image/tiff', 'tiff'],
    ['application/json', 'json'],
  ])('maps %s to %s', (mimeType, fileType) => {
    expect(service.getFileType(mimeType)).toBe(fileType);
  });

  it('normalizes whitespace and case when mapping MIME types', () => {
    expect(service.getFileType('  APPLICATION/PDF  ')).toBe('pdf');
  });

  it.each([
    ['pdf', 'application/pdf'],
    ['tiff', 'image/tiff'],
    ['json', 'application/json'],
  ])('maps file type %s to %s', (fileType, mimeType) => {
    expect(service.getMimeType(fileType)).toBe(mimeType);
  });

  it('rejects unsupported MIME types and file types', () => {
    expect(() => service.getFileType('text/plain')).toThrow('Unsupported file type: text/plain');
    expect(() => service.getMimeType('txt')).toThrow('Unsupported file type: txt');
  });

  it('validates supported file types without case sensitivity', () => {
    expect(service.validateFileType(' PDF ')).toBe(true);
    expect(service.validateFileType('txt')).toBe(false);
  });

  it('identifies PDF and TIFF types', () => {
    expect(service.isPdf(' PDF ')).toBe(true);
    expect(service.isPdf('tiff')).toBe(false);
    expect(service.isTiff(' TIFF ')).toBe(true);
    expect(service.isTiff('pdf')).toBe(false);
  });
});