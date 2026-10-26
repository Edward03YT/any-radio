import { getDecoder, DecoderValidation } from '../decoders';

export interface DecodeApiRequest {
  brand: string;
  serial: string;
  confirmedOwnership: boolean;
  model?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  normalizedSerial?: string;
  decoderValidation?: DecoderValidation;
}

export function validateDecodeRequest(payload: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      errors: { _general: 'Corpul cererii este invalid.' },
    };
  }

  const data = payload as Partial<DecodeApiRequest>;

  if (!data.brand || typeof data.brand !== 'string' || !data.brand.trim()) {
    errors.brand = 'Selectati marca autovehiculului.';
  }

  if (!data.serial || typeof data.serial !== 'string' || !data.serial.trim()) {
    errors.serial = 'Introduceti seria radioului sau pre-codul.';
  }

  if (data.confirmedOwnership !== true) {
    errors.confirmedOwnership = 'Trebuie sa confirmati ca sunteti proprietarul legitim al vehiculului sau al radioului.';
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  const decoder = getDecoder(data.brand!.trim());
  if (!decoder) {
    errors.brand = `Marca "${data.brand}" nu este suportata.`;
    return { isValid: false, errors };
  }

  const decoderValidation = decoder.validate(data.serial!.trim());
  if (!decoderValidation.valid) {
    errors.serial = decoderValidation.error || 'Formatul seriei este invalid pentru aceasta marca.';
    return { isValid: false, errors, decoderValidation };
  }

  return {
    isValid: true,
    errors: {},
    normalizedSerial: decoderValidation.normalized,
    decoderValidation,
  };
}
