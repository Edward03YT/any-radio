export type DecodeMethod = 'algorithmic' | 'lookup' | 'vin_locked' | 'challenge_response';
export type ConfidenceLevel = 'guaranteed' | 'high' | 'database_required' | 'dealer_or_dump_required';

export interface DecodeResult {
  ok: boolean;
  code?: string;
  brand: string;
  model?: string;
  method: DecodeMethod;
  confidence: ConfidenceLevel;
  error?: string;
  technicalNote?: string;
  instructions?: string;
}

export interface DecoderValidation {
  valid: boolean;
  normalized?: string;
  error?: string;
  subType?: string;
}

export interface RadioDecoder {
  brandId: string;
  brandName: string;
  aliases: string[];
  supportedModels: string[];
  serialPattern: RegExp;
  placeholder: string;
  exampleSerials: string[];
  method: DecodeMethod;
  helpInstructions: {
    labelLocation: string;
    removalRequired: boolean;
    buttonShortcut?: string;
    removalGuide: string;
  };
  validate(serial: string): DecoderValidation;
  decode(serial: string, extra?: Record<string, string>): Promise<DecodeResult> | DecodeResult;
}

const registry = new Map<string, RadioDecoder>();

export function registerDecoder(decoder: RadioDecoder): void {
  registry.set(decoder.brandId.toLowerCase(), decoder);
  for (const alias of decoder.aliases) {
    registry.set(alias.toLowerCase(), decoder);
  }
}

export function getDecoder(brandId: string): RadioDecoder | undefined {
  return registry.get(brandId.toLowerCase());
}

export function getAllDecoders(): RadioDecoder[] {
  const unique = new Set<RadioDecoder>();
  for (const decoder of registry.values()) {
    unique.add(decoder);
  }
  return Array.from(unique);
}
