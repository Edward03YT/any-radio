import { RadioDecoder, DecodeResult, DecoderValidation, registerDecoder } from './registry';

/**
 * Reverses the bits of a 32-bit unsigned integer.
 */
function reverseBits32(x: bigint): bigint {
  let rev = 0n;
  for (let i = 0n; i < 32n; i++) {
    const bit = (x >> (31n - i)) & 1n;
    rev |= bit << i;
  }
  return rev;
}

/**
 * Toyota ERC (Emergency Response Code / Electronic Reset Code) unlock calculation.
 * 16-character hexadecimal challenge -> 8-character hexadecimal unlock response.
 * Reverse-engineered from Fujitsu Ten / Eclipse navigation firmware.
 */
export function calculateToyotaErc(erc: string): string {
  const cleanErc = erc.trim().toUpperCase().replace(/[\s-]/g, '');
  if (cleanErc.length !== 16 || !/^[0-9A-F]{16}$/i.test(cleanErc)) {
    throw new Error('ERC code must be exactly 16 hexadecimal characters.');
  }

  const firstPart = BigInt(`0x${cleanErc.slice(0, 8)}`);
  const secondPart = BigInt(`0x${cleanErc.slice(8, 16)}`);

  const reversedSecondPart = reverseBits32(secondPart);
  const xor = firstPart ^ reversedSecondPart;
  const result = (xor - 0x0E010A11n) & 0xffffffffn;

  return result.toString(16).toUpperCase().padStart(8, '0');
}

export const toyotaDecoder: RadioDecoder = {
  brandId: 'toyota',
  brandName: 'Toyota / Lexus / Daihatsu',
  aliases: ['lexus', 'daihatsu', 'eclipse'],
  supportedModels: [
    'NSDN-W59 / W60',
    'NSCN-W59 / W60',
    'NSZT-W60 / W61G / W62G / W64 / W66T',
    'NHZD-W62G / NHZN-W60G',
    'NSLN-W62',
    'Fujitsu Ten / Eclipse AVN Units',
  ],
  serialPattern: /^[0-9A-F]{16}$/i,
  placeholder: 'Ex: 66EECE00F2724BA5',
  exampleSerials: ['66EECE00F2724BA5', '0123456789ABCDEF'],
  method: 'challenge_response',
  helpInstructions: {
    labelLocation: 'Pe ecranul de navigatie (meniul secret de service). Nu este necesara demontarea.',
    removalRequired: false,
    buttonShortcut: 'Tineti apasata tasta principala (MENU sau NAVI) si comutati luminile de pozitie (farurile) ON si OFF de 3 sau 4 ori. Va aparea meniul de diagnostic service. Selectati "Service Information" -> "ERC" pentru a vizualiza codul de 16 caractere.',
    removalGuide: 'La sistemele multimedia Toyota / Eclipse din Japonia sau import, dupa deconectarea bateriei, sistemul afiseaza o provocare ERC de 16 caractere hexazecimale.',
  },
  validate(serial: string): DecoderValidation {
    const cleaned = serial.trim().toUpperCase().replace(/[\s-]/g, '');

    if (/^[0-9A-F]{16}$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, subType: 'ERC_16_HEX' };
    }

    return {
      valid: false,
      error: 'Codul Toyota ERC trebuie sa contina exact 16 caractere hexazecimale (cifre 0-9 si litere A-F). Ex: 66EECE00F2724BA5.',
    };
  },
  decode(serial: string): DecodeResult {
    const cleaned = serial.trim().toUpperCase().replace(/[\s-]/g, '');

    if (!/^[0-9A-F]{16}$/.test(cleaned)) {
      return {
        ok: false,
        brand: 'Toyota / Lexus',
        method: 'challenge_response',
        confidence: 'guaranteed',
        error: 'Codul ERC trebuie sa aiba exact 16 caractere hexazecimale.',
      };
    }

    const code = calculateToyotaErc(cleaned);
    return {
      ok: true,
      code,
      brand: 'Toyota / Lexus',
      model: 'Fujitsu Ten / Eclipse ERC System',
      method: 'challenge_response',
      confidence: 'guaranteed',
      technicalNote: `Decodare challenge-response 100% offline pentru ERC ${cleaned}. Calculat prin permutare de biti pe 32 de biti si scazator polinomial Fujitsu Ten.`,
      instructions: 'Introduceti acest cod de 8 caractere pe ecranul tactil in campul "Password" / "Unlock Key" si apasati Enter. Unitatea se va debloca imediat.',
    };
  },
};

registerDecoder(toyotaDecoder);
