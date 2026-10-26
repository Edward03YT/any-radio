import { describe, it, expect } from 'vitest';
import {
  getDecoder,
  getAllDecoders,
  calculateRenaultCode,
  extractRenaultPrecode,
  calculateFordMCode,
  calculateToyotaErc,
} from '../lib/decoders';

describe('Radio Decoders Registry', () => {
  it('should register all 7 required automotive brands', () => {
    const decoders = getAllDecoders();
    expect(decoders.length).toBe(7);

    const brandIds = decoders.map(d => d.brandId);
    expect(brandIds).toContain('renault');
    expect(brandIds).toContain('ford');
    expect(brandIds).toContain('toyota');
    expect(brandIds).toContain('fiat');
    expect(brandIds).toContain('psa');
    expect(brandIds).toContain('gm');
    expect(brandIds).toContain('chrysler');
  });

  it('should support brand aliases correctly', () => {
    expect(getDecoder('dacia')?.brandId).toBe('renault');
    expect(getDecoder('peugeot')?.brandId).toBe('psa');
    expect(getDecoder('citroen')?.brandId).toBe('psa');
    expect(getDecoder('opel')?.brandId).toBe('gm');
    expect(getDecoder('vauxhall')?.brandId).toBe('gm');
    expect(getDecoder('jeep')?.brandId).toBe('chrysler');
    expect(getDecoder('dodge')?.brandId).toBe('chrysler');
    expect(getDecoder('lexus')?.brandId).toBe('toyota');
  });
});

describe('Renault / Dacia Decoder (100% Algorithmic)', () => {
  it('should calculate accurate PIN codes for standard test vectors', () => {
    expect(calculateRenaultCode('T123')).toBe('6889');
    expect(calculateRenaultCode('A123')).toBe('0086');
    expect(calculateRenaultCode('I123')).toBe('1682');
    expect(calculateRenaultCode('Q718')).toBe('9259');
    expect(calculateRenaultCode('V783')).toBe('4200');
  });

  it('should extract precode from complex barcode strings', () => {
    expect(extractRenaultPrecode('T123')).toBe('T123');
    expect(extractRenaultPrecode('SECURITY T123')).toBe('T123');
    expect(extractRenaultPrecode('281155052RTO888')).toBe('O888');
    expect(extractRenaultPrecode('T0U888')).toBe('U888');
  });

  it('should reject A0xx precodes and invalid inputs', async () => {
    expect(extractRenaultPrecode('A012')).toBeNull();
    const decoder = getDecoder('renault')!;
    const validation = decoder.validate('A012');
    expect(validation.valid).toBe(false);

    const result = await decoder.decode('INVALID');
    expect(result.ok).toBe(false);
  });

  it('should successfully decode valid precode through decoder interface', async () => {
    const decoder = getDecoder('renault')!;
    const result = await decoder.decode('T123');
    expect(result.ok).toBe(true);
    expect(result.code).toBe('6889');
    expect(result.method).toBe('algorithmic');
    expect(result.confidence).toBe('guaranteed');
  });
});

describe('Ford Decoder (M-Series Algorithmic vs V-Series Lookup)', () => {
  it('should calculate accurate PIN codes for Ford M-series', () => {
    expect(calculateFordMCode('M123456')).toBe('2477');
    expect(calculateFordMCode('M000001')).toBe('9608');
    expect(calculateFordMCode('M012345')).toBe('9739');
    expect(calculateFordMCode('M111111')).toBe('8618');
  });

  it('should decode M-series through the decoder interface', async () => {
    const decoder = getDecoder('ford')!;
    const result = await decoder.decode('M123456');
    expect(result.ok).toBe(true);
    expect(result.code).toBe('2477');
    expect(result.method).toBe('algorithmic');
  });

  it('should properly flag V-series as requiring database lookup', async () => {
    const decoder = getDecoder('ford')!;
    const validation = decoder.validate('V012345');
    expect(validation.valid).toBe(true);
    expect(validation.subType).toBe('V_SERIES');

    const result = await decoder.decode('V012345');
    expect(result.ok).toBe(false);
    expect(result.method).toBe('lookup');
    expect(result.confidence).toBe('database_required');
  });

  it('should reject invalid Ford serial format', () => {
    const decoder = getDecoder('ford')!;
    const validation = decoder.validate('X123456');
    expect(validation.valid).toBe(false);
  });
});

describe('Toyota ERC Challenge-Response Decoder (100% Algorithmic)', () => {
  it('should calculate accurate unlock code for known test vector', () => {
    expect(calculateToyotaErc('66EECE00F2724BA5')).toBe('B53B763E');
  });

  it('should validate and decode ERC via decoder interface', async () => {
    const decoder = getDecoder('toyota')!;
    const validation = decoder.validate('66EECE00F2724BA5');
    expect(validation.valid).toBe(true);

    const result = await decoder.decode('66EECE00F2724BA5');
    expect(result.ok).toBe(true);
    expect(result.code).toBe('B53B763E');
    expect(result.method).toBe('challenge_response');
  });

  it('should reject invalid ERC length or non-hex characters', () => {
    const decoder = getDecoder('toyota')!;
    expect(decoder.validate('66EECE00F2724BA').valid).toBe(false);
    expect(decoder.validate('66EECE00F2724BAZ').valid).toBe(false);
  });
});

describe('Fiat Decoder', () => {
  it('should validate BP 14-character serials and part numbers', () => {
    const decoder = getDecoder('fiat')!;
    expect(decoder.validate('BP738982403096').valid).toBe(true);
    expect(decoder.validate('7646389316').valid).toBe(true);
    expect(decoder.validate('INVALID').valid).toBe(false);
  });

  it('should accurately report lookup and EEPROM requirements without false promises', async () => {
    const decoder = getDecoder('fiat')!;
    const result = await decoder.decode('BP738982403096');
    expect(result.ok).toBe(false);
    expect(result.method).toBe('lookup');
    expect(result.confidence).toBe('database_required');
  });
});

describe('PSA (Peugeot / Citroen) Decoder', () => {
  it('should validate 17-character VIN and provide CAN-bus telecoding guidance', async () => {
    const decoder = getDecoder('psa')!;
    const validation = decoder.validate('VF33CNFUC84123456');
    expect(validation.valid).toBe(true);

    const result = await decoder.decode('VF33CNFUC84123456');
    expect(result.ok).toBe(true);
    expect(result.method).toBe('vin_locked');
    expect(result.instructions).toContain('Diagbox');
  });
});

describe('GM (Opel / Vauxhall) Decoder', () => {
  it('should validate 14-char GM serials and 6-digit US challenge codes', () => {
    const decoder = getDecoder('gm')!;
    expect(decoder.validate('GM0500X1234567').valid).toBe(true);
    expect(decoder.validate('123456').valid).toBe(true);
    expect(decoder.validate('INVALID').valid).toBe(false);
  });
});

describe('Chrysler / Jeep / Dodge Decoder', () => {
  it('should validate T00AM and Mopar part numbers', () => {
    const decoder = getDecoder('chrysler')!;
    expect(decoder.validate('T00AM123456789').valid).toBe(true);
    expect(decoder.validate('P05064385AF').valid).toBe(true);
    expect(decoder.validate('INVALID').valid).toBe(false);
  });
});

describe('API Payload Validation & Legal Check', () => {
  it('should strictly require confirmed ownership', async () => {
    const { validateDecodeRequest } = await import('../lib/validation');
    const invalid = validateDecodeRequest({
      brand: 'renault',
      serial: 'T123',
      confirmedOwnership: false,
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.confirmedOwnership).toBeDefined();

    const valid = validateDecodeRequest({
      brand: 'renault',
      serial: 'T123',
      confirmedOwnership: true,
    });
    expect(valid.isValid).toBe(true);
    expect(valid.normalizedSerial).toBe('T123');
  });
});

