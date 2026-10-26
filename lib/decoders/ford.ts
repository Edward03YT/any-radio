import { RadioDecoder, DecodeResult, DecoderValidation, registerDecoder } from './registry';

// Ford M-Series substitution table reverse-engineered from Visteon microcode
const M_LOOKUP = [
  [9, 5, 3, 4, 8, 7, 2, 6, 1, 0],
  [2, 1, 5, 6, 9, 3, 7, 0, 4, 8],
  [0, 4, 7, 3, 1, 9, 6, 5, 8, 2],
  [5, 6, 4, 1, 2, 8, 0, 9, 3, 7],
  [6, 3, 1, 2, 0, 5, 4, 8, 7, 9],
  [4, 0, 8, 7, 6, 1, 9, 3, 2, 5],
  [7, 8, 0, 5, 3, 2, 1, 4, 9, 6],
  [1, 9, 6, 8, 7, 4, 5, 2, 0, 3],
  [3, 2, 9, 0, 4, 6, 8, 7, 5, 1],
  [8, 7, 2, 9, 5, 0, 3, 1, 6, 4],
];

/**
 * Calculates unlock code for Ford M-series (Mxxxxxx).
 * 100% deterministic offline math.
 */
export function calculateFordMCode(serial: string): string {
  const digits = serial.slice(1).split('').map(s => parseInt(s, 10)).reverse();

  const [n1, n2, n3, n4, n5, n6] = digits;
  const n7 = 0;

  const r1 = M_LOOKUP[n1][5];
  const r2 = M_LOOKUP[n2][3];
  const r3 = M_LOOKUP[n3][8];
  const r4 = M_LOOKUP[n4][2];
  const r5 = M_LOOKUP[n5][1];
  const r6 = M_LOOKUP[n6][6];
  const r7 = M_LOOKUP[n7][9];

  const res1 = ((M_LOOKUP[r2][r1] + 1) * (M_LOOKUP[r6][r2] + 1) + (M_LOOKUP[r4][r3] + 1) * (M_LOOKUP[r7][r5] + 1) + (M_LOOKUP[r1][r4])) % 10;
  const res2 = ((M_LOOKUP[r2][r1] + 1) * (M_LOOKUP[r5][r4] + 1) + (M_LOOKUP[r5][r2] + 1) + (M_LOOKUP[r7][r3] + 1) + (M_LOOKUP[r1][r6])) % 10;
  const res3 = ((M_LOOKUP[r2][r1] + 1) * (M_LOOKUP[r4][r2] + 1) + (M_LOOKUP[r3][r6] + 1) * (M_LOOKUP[r7][r4] + 1) + (M_LOOKUP[r1][r5])) % 10;
  const res4 = ((M_LOOKUP[r2][r1] + 1) * (M_LOOKUP[r6][r3] + 1) + (M_LOOKUP[r3][r7] + 1) * (M_LOOKUP[r2][r5] + 1) + (M_LOOKUP[r4][r1])) % 10;

  const xres1 = (M_LOOKUP[res1][5] + 1) * (M_LOOKUP[res2][1] + 1) + 105;
  const xres2 = (M_LOOKUP[res2][1] + 1) * (M_LOOKUP[res4][0] + 1) + 102;
  const xres3 = (M_LOOKUP[res1][5] + 1) * (M_LOOKUP[res3][8] + 1) + 103;
  const xres4 = (M_LOOKUP[res3][8] + 1) * (M_LOOKUP[res4][0] + 1) + 108;

  const xres11 = Math.trunc(xres1 / 10) % 10;
  const xres10 = xres1 % 10;

  const xres21 = Math.trunc(xres2 / 10) % 10;
  const xres20 = xres2 % 10;

  const xres31 = Math.trunc(xres3 / 10) % 10;
  const xres30 = xres3 % 10;

  const xres41 = Math.trunc(xres4 / 10) % 10;
  const xres40 = xres4 % 10;

  const code3 = (xres11 + xres10 + r1) % 10;
  const code2 = (xres21 + xres20 + r1) % 10;
  const code1 = (xres31 + xres30 + r1) % 10;
  const code0 = (xres41 + xres40 + r1) % 10;

  return `${code0}${code1}${code2}${code3}`;
}

export const fordDecoder: RadioDecoder = {
  brandId: 'ford',
  brandName: 'Ford',
  aliases: ['ford-visteon', 'ford-sony'],
  supportedModels: [
    '6000CD (Single CD / Oval)',
    '4500 RDS E-O-N',
    '5000 RDS / 5000C',
    'Sony CDX (Gen 1 & 2)',
    'TravelPilot EX / FX / NX',
  ],
  serialPattern: /^[MV]\d{6}$/i,
  placeholder: 'Ex: M123456 sau V012345',
  exampleSerials: ['M123456', 'M000001', 'M012345', 'M111111', 'V012345'],
  method: 'algorithmic',
  helpInstructions: {
    labelLocation: 'Pe afisajul LCD (tastele 1+6) sau pe eticheta carcasei metalice.',
    removalRequired: false,
    buttonShortcut: 'Porniti radioul si tineti apasate simultan tastele 1 si 6 (sau 2 si 6). Seria (ex: M123456 sau V012345) va rula pe ecran in cateva secunde.',
    removalGuide: 'Daca ecranul nu afiseaza seria, folositi 4 chei plate de extractie radio (tip PC5-132) introduse in fantele din cele 4 colturi ale panoului frontal.',
  },
  validate(serial: string): DecoderValidation {
    const cleaned = serial.trim().toUpperCase().replace(/[\s-]/g, '');

    // Match M or V series
    if (/^M\d{6}$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, subType: 'M_SERIES' };
    }

    if (/^V\d{6}$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, subType: 'V_SERIES' };
    }

    return {
      valid: false,
      error: 'Seria Ford trebuie sa inceapa cu litera M sau V, urmata de exact 6 cifre (ex: M123456 sau V012345).',
    };
  },
  decode(serial: string): DecodeResult {
    const cleaned = serial.trim().toUpperCase().replace(/[\s-]/g, '');

    if (/^M\d{6}$/.test(cleaned)) {
      const code = calculateFordMCode(cleaned);
      return {
        ok: true,
        code,
        brand: 'Ford',
        model: 'Visteon M-Series',
        method: 'algorithmic',
        confidence: 'guaranteed',
        technicalNote: `Decodare algoritmica 100% offline pentru seria ${cleaned}. Calculat prin transformarea matricei de substitutie Visteon.`,
        instructions: 'Introducere cod Ford: apasati tasta 1 repetat pentru prima cifra, tasta 2 pentru a doua, tasta 3 pentru a treia, tasta 4 pentru a patra. Apasati tasta 5 pentru confirmare.',
      };
    }

    if (/^V\d{6}$/.test(cleaned)) {
      // Ford V series is factory database lookup only (no linear public formula)
      return {
        ok: false,
        brand: 'Ford',
        model: 'Visteon / Sony V-Series',
        method: 'lookup',
        confidence: 'database_required',
        error: 'Seria Ford "V" (generatia dupa 2008) foloseste o tabela hash de securitate din fabrica si nu poate fi calculata printr-o formula matematica simpla. Necesita interogarea bazei de date Ford dealer sau server OEM.',
        technicalNote: 'V-Series nu are algoritm liniar reversibil. Fiecare serie Vxxxxxx este mapata intr-o baza de date de ~1 milion de intrari la nivel de fabrica.',
      };
    }

    return {
      ok: false,
      brand: 'Ford',
      method: 'algorithmic',
      confidence: 'guaranteed',
      error: 'Format serie invalid. Introduceti o serie M (ex: M123456) sau V (ex: V012345).',
    };
  },
};

registerDecoder(fordDecoder);
