import { RadioDecoder, DecodeResult, DecoderValidation, registerDecoder } from './registry';

/**
 * Extracts a 4-character Renault Security Pre-code from various barcode and sticker formats:
 * - Direct: "T123"
 * - Security label: "SECURITY T123"
 * - Full part barcode: "281155052RTO888" -> "O888"
 * - Security block: "T0U888" -> "U888"
 */
export function extractRenaultPrecode(rawInput: string): string | null {
  const cleaned = rawInput.trim().toUpperCase().replace(/[\s-]/g, '');

  // 1. Direct 4-char precode
  if (/^[A-Z]\d{3}$/.test(cleaned) && !cleaned.startsWith('A0')) {
    return cleaned;
  }

  // 2. Barcode pattern with "SECURITY" followed by precode
  const securityMatch = rawInput.toUpperCase().match(/SECURITY\s*[:#]?\s*([A-Z]\d{3})/i);
  if (securityMatch && !securityMatch[1].startsWith('A0')) {
    return securityMatch[1];
  }

  // 3. Renault OEM part number ending with precode (e.g., 281155052RTO888 -> precode O888)
  const partMatch = cleaned.match(/28115\w*([A-Z]\d{3})$/);
  if (partMatch && !partMatch[1].startsWith('A0')) {
    return partMatch[1];
  }

  // 4. Barcode containing precode in the last 4 characters if they match [A-Z]\d{3}
  if (cleaned.length >= 4) {
    const trailing = cleaned.slice(-4);
    if (/^[A-Z]\d{3}$/.test(trailing) && !trailing.startsWith('A0')) {
      return trailing;
    }
  }

  return null;
}

/**
 * Renault / Dacia radio PIN calculation algorithm.
 * Verified mathematical transformation reverse-engineered from Philips / Continental firmware.
 */
export function calculateRenaultCode(precode: string): string {
  const normalized = precode.toUpperCase();
  const x = normalized.charCodeAt(1) + normalized.charCodeAt(0) * 10 - 698;
  const y = normalized.charCodeAt(3) + normalized.charCodeAt(2) * 10 + x - 528;
  const z = (y * 7) % 100;
  const code = Math.floor(z / 10) + (z % 10) * 10 + ((259 % x) % 100) * 100;
  return code.toString().padStart(4, '0');
}

export const renaultDecoder: RadioDecoder = {
  brandId: 'renault',
  brandName: 'Renault / Dacia',
  aliases: ['dacia', 'renault-dacia'],
  supportedModels: [
    'Tuner List',
    'Update List',
    'MediaNav (1, Evolution, Linux)',
    'R-Link / R-Link 2',
    'Daewoo AGC-0070 / AGC-0071',
    'Dacia Duster / Sandero / Logan OEM Units',
  ],
  serialPattern: /^[A-Z]\d{3}$/i,
  placeholder: 'Ex: T123 sau 281155052RTO888',
  exampleSerials: ['T123', 'A123', 'Q718', 'V783', 'I123'],
  method: 'algorithmic',
  helpInstructions: {
    labelLocation: 'Pe eticheta de pe carcasa metalica sau pe afisaj la pornire.',
    removalRequired: false,
    buttonShortcut: 'Tineti apasate tastele 1 si 6 simultan timp de 3-5 secunde cand porniti radioul. Pe ecran va aparea un pre-cod (ex: T123).',
    removalGuide: 'Daca metoda tastelor nu functioneaza, introduceti doua sarme U (sau chei de extractie radio) in orificiile laterale pentru a glisa unitatea afara din bord. Cautati eticheta cu codul de bare si textul "SECURITY" sau ultimele 4 caractere (o litera si 3 cifre).',
  },
  validate(serial: string): DecoderValidation {
    const precode = extractRenaultPrecode(serial);
    if (!precode) {
      if (serial.trim().toUpperCase().startsWith('A0')) {
        return {
          valid: false,
          error: 'Pre-codurile din seria A0xx nu sunt suportate algoritmic (necesita interogare baza date dealer).',
        };
      }
      return {
        valid: false,
        error: 'Format invalid. Introduceti pre-codul de 4 caractere (ex: T123) sau seria completa de pe eticheta.',
      };
    }
    return {
      valid: true,
      normalized: precode,
    };
  },
  decode(serial: string): DecodeResult {
    const precode = extractRenaultPrecode(serial);
    if (!precode) {
      return {
        ok: false,
        brand: 'Renault / Dacia',
        method: 'algorithmic',
        confidence: 'guaranteed',
        error: 'Pre-cod invalid. Formatul trebuie sa fie o litera urmata de 3 cifre (ex: T123).',
      };
    }

    const code = calculateRenaultCode(precode);
    return {
      ok: true,
      code,
      brand: 'Renault / Dacia',
      method: 'algorithmic',
      confidence: 'guaranteed',
      technicalNote: `Decodare algoritmica 100% offline pentru pre-cod ${precode}. Generat pe baza algoritmului Philips/Continental Security.`,
      instructions: 'Introducere cod: apasati tasta 1 de mai multe ori pentru prima cifra, tasta 2 pentru a doua, tasta 3 pentru a treia, tasta 4 pentru a patra. Confirmati tinand apasat tasta 6 (sau comanda satelit volan).',
    };
  },
};

registerDecoder(renaultDecoder);
