import { SegmentService } from '../../infrastructure/services/segmentService';

describe('SegmentService', () => {
  const service = new SegmentService();

  it.each([
    'endorsement',
    'property',
    'legal',
    'party',
    'reference',
    'monetary',
    'acknowledgment',
    'court',
    'vital',
    'transaction',
    'fiscal',
    'secrets',
    'chain',
    'history',
    'undefined',
  ])('accepts the supported segment %s', (segment) => {
    expect(service.validateSegment(segment)).toBe(true);
  });

  it.each(['', 'unknown', 'Party', 'property/child'])('rejects unsupported segment %s', (segment) => {
    expect(service.validateSegment(segment)).toBe(false);
  });
});