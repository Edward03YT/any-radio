import { RadioDecoder, DecodeResult, DecoderValidation, registerDecoder } from './registry';

export const gmDecoder: RadioDecoder = {
  brandId: 'gm',
  brandName: 'General Motors (Opel / Vauxhall / Chevrolet)',
  aliases: ['opel', 'vauxhall', 'chevrolet', 'holden'],
  supportedModels: [
    'CD30 / CD30 MP3 (Grundig / Delphi)',
    'CD70 Navi / DVD90 (Siemens VDO)',
    'CDR500 / CCR600 (Delco / VDO)',
    'CAR 200 / 300 / 400 (Blaupunkt / Philips)',
    'Chevy / GMC Theftlock I & II',
    'Navi 600 / 900 / Intellilink (GMLAN / Global A)',
  ],
  serialPattern: /^(GM\d{12}|GM0\w{11}|\d{6})$/i,
  placeholder: 'Ex: GM0500X1234567 sau cod challenge 6 cifre',
  exampleSerials: ['GM0500X1234567', 'GM0205Y1234567', '123456'],
  method: 'lookup',
  helpInstructions: {
    labelLocation: 'Pe eticheta de pe carcasa metalica a radioului (Opel) sau pe ecran prin combinatia de taste (GM SUA).',
    removalRequired: true,
    buttonShortcut: 'La radiourile Delco US: tineti apasate tastele 2 si 3 (sau 1 si 4) timp de 6-10 secunde pana cand ecranul afiseaza un cod challenge de 6 cifre.',
    removalGuide: 'Pentru Opel CD30/CDR500: folositi 4 tije de extractie in orificiile din colturile panoului frontal pentru a scoate unitatea si a citi seria GM de pe eticheta laterala.',
  },
  validate(serial: string): DecoderValidation {
    const cleaned = serial.trim().toUpperCase().replace(/[\s-]/g, '');

    // Opel/Vauxhall GM 14-char serial (ex: GM0500X1234567)
    if (/^GM[0-9A-Z]{12}$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, subType: 'GM_OPEL_SERIAL' };
    }

    // GM US 6-digit challenge scrambler code
    if (/^\d{6}$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, subType: 'GM_US_CHALLENGE' };
    }

    return {
      valid: false,
      error: 'Format invalid pentru GM/Opel. Introduceti seria de 14 caractere (ex: GM0500X1234567) sau codul challenge de 6 cifre.',
    };
  },
  decode(serial: string): DecodeResult {
    const cleaned = serial.trim().toUpperCase().replace(/[\s-]/g, '');

    if (/^GM[0-9A-Z]{12}$/.test(cleaned)) {
      return {
        ok: false,
        brand: 'General Motors (Opel / Vauxhall)',
        model: 'Siemens VDO / Delco / Grundig OEM',
        method: 'lookup',
        confidence: 'dealer_or_dump_required',
        error: `Seria ${cleaned} a fost validata. Radiourile Opel (CDR500, CD30, etc.) stocheaza codul de securitate (CarPass) intr-un cip EEPROM securizat (24C16 sau microcontroler Motorola TMS370).`,
        technicalNote: 'La generatiile mai noi (CD30 MP3, CD70), radioul este asociat prin CAN-bus cu ecranul (DIS/GID/CID) si imobilizatorul masinii. Pentru schimbare, este necesara "divortarea" si "maritarea" cu interfata OP-COM sau Tech2 utilizand codul de securitate din CarPass-ul original al masinii.',
        instructions: 'Solutii disponibile:\n1. Verificati cardul de plastic "Car Pass" primit la cumpararea autovehiculului (codul din 4 cifre marcat "Radio Type / Code").\n2. Solicitati CarPass-ul la o reprezentanta Opel pe baza cartii de identitate a vehiculului.\n3. Citirea dump-ului EEPROM de catre un tehnician electronist auto.',
      };
    }

    if (/^\d{6}$/.test(cleaned)) {
      return {
        ok: false,
        brand: 'General Motors (US Theftlock)',
        model: 'Delco Electronics Theftlock',
        method: 'lookup',
        confidence: 'database_required',
        error: `Codul challenge de 6 cifre (${cleaned}) necesita interogarea bazei de date a liniei asistenta dealer GM sau a unui server IVR cu chei private Delco.`,
        technicalNote: 'Delco Theftlock foloseste un seed pseudo-aleatoriu derivat din ceasul intern al radioului la deconectarea bateriei.',
      };
    }

    return {
      ok: false,
      brand: 'General Motors',
      method: 'lookup',
      confidence: 'dealer_or_dump_required',
      error: 'Format invalid.',
    };
  },
};

registerDecoder(gmDecoder);
