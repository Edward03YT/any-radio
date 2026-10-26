import { RadioDecoder, DecodeResult, DecoderValidation, registerDecoder } from './registry';

export const chryslerDecoder: RadioDecoder = {
  brandId: 'chrysler',
  brandName: 'Chrysler / Jeep / Dodge / RAM',
  aliases: ['jeep', 'dodge', 'ram', 'mopar'],
  supportedModels: [
    'Uconnect 5.0 / 8.4 / 12.0 (Harman / Panasonic)',
    'RB1 / RB3 / RB4 Navigation (Alpine / Becker)',
    'RAZ / RBP / RBU / REQ / RES / RHR (Mitsubishi / Alpine)',
    'MyGIG (REN, REW, RER - Harman Becker)',
  ],
  serialPattern: /^(T00AM\w{9}|T[A-Z0-9]{13}|P[0-9A-Z]{8,14})$/i,
  placeholder: 'Ex: T00AM123456789 sau TQN1234567890',
  exampleSerials: ['T00AM123456789', 'TQN1234567890', 'P05064385AF'],
  method: 'lookup',
  helpInstructions: {
    labelLocation: 'Pe eticheta de pe partea superioara sau laterala a sasiului metalic.',
    removalRequired: true,
    buttonShortcut: 'Sistemele Chrysler nu afiseaza seria prin taste de pe panoul frontal. Unitatea trebuie demontata.',
    removalGuide: 'Demontati rama consolei centrale (panoul trim) cu parghii din plastic pentru a avea acces la cele 4 suruburi Torx T20 care fixeaza unitatea Uconnect in bord.',
  },
  validate(serial: string): DecoderValidation {
    const cleaned = serial.trim().toUpperCase().replace(/[\s-]/g, '');

    // Common Chrysler serial formats: T00AM (14 chars) or T followed by 13 chars
    if (/^T00AM[0-9A-Z]{9}$/.test(cleaned) || /^T[0-9A-Z]{13}$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, subType: 'CHRYSLER_T_SERIAL' };
    }

    // Chrysler Mopar Part Number (starts with P followed by numbers/letters)
    if (/^P[0-9A-Z]{8,14}$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, subType: 'CHRYSLER_PART_NUMBER' };
    }

    return {
      valid: false,
      error: 'Format invalid pentru Chrysler/Jeep/Dodge. Introduceti seria de 14 caractere (incepe de obicei cu litera T sau T00AM).',
    };
  },
  decode(serial: string): DecodeResult {
    const cleaned = serial.trim().toUpperCase().replace(/[\s-]/g, '');

    if (/^T/.test(cleaned) || /^P/.test(cleaned)) {
      return {
        ok: false,
        brand: 'Chrysler / Jeep / Dodge',
        model: 'Uconnect / Harman / Alpine',
        method: 'lookup',
        confidence: 'database_required',
        error: `Seria ${cleaned} este valida, insa unitatile FCA / Chrysler (in special Uconnect si MyGIG) utilizeaza criptare AES/RSA si stocheaza cheia de deblocare pe serverele centrale Mopar / Dealer WiTECH.`,
        technicalNote: 'Nu exista un algoritm public matematic pentru decodarea offline a unitatilor Chrysler T00AM/Uconnect. Solicitarea se face prin baza de date oficiala Mopar pe baza part number-ului si serial number-ului.',
        instructions: 'Pentru a obtine codul PIN (4 cifre):\n1. Notati Serial Number (ex: T00AM...) si Part Number (ex: P05064...).\n2. Contactati un dealer autorizat Jeep/Dodge/Chrysler sau o platforma autorizata de interogare a bazei de date Mopar cu actul de proprietate al masinii.',
      };
    }

    return {
      ok: false,
      brand: 'Chrysler / Jeep / Dodge',
      method: 'lookup',
      confidence: 'database_required',
      error: 'Format serial invalid.',
    };
  },
};

registerDecoder(chryslerDecoder);
