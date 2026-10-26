import { RadioDecoder, DecodeResult, DecoderValidation, registerDecoder } from './registry';

export const psaDecoder: RadioDecoder = {
  brandId: 'psa',
  brandName: 'PSA (Peugeot / Citroën / DS)',
  aliases: ['peugeot', 'citroen', 'citroën', 'ds'],
  supportedModels: [
    'RD4 / RD45 (Bosch / Continental)',
    'RT4 / RT5 / RT6 (Magneti Marelli)',
    'SMEG / SMEG+ / SMEG+ IV2 (Magneti Marelli)',
    'NAC / RCC (Continental / Bosch)',
    'Clarion PU-xxxx (modele pre-2004)',
  ],
  serialPattern: /^(VF[37][A-Z0-9]{14}|CL\d{12}|C7[A-Z0-9]{12})$/i,
  placeholder: 'Introduceti VIN-ul (ex: VF3...) sau seria Clarion (ex: CL...)',
  exampleSerials: ['VF3XXXXXXXXXXXXXX', 'VF7XXXXXXXXXXXXXX', 'CL0401Y0123456'],
  method: 'vin_locked',
  helpInstructions: {
    labelLocation: 'Pe certificatul de inmatriculare (talon), la baza parbrizului sau pe eticheta usii soferului.',
    removalRequired: false,
    buttonShortcut: 'Unitatile moderne Peugeot/Citroën NU au cod de tastat si nu solicita PIN!',
    removalGuide: 'Daca radioul emite un "beep" repetat la fiecare secunda dupa ce a fost montat pe alta masina, este din cauza ca VIN-ul stocat in memoria radioului nu corespunde cu VIN-ul din BSI (calculatorul de habitaclu).',
  },
  validate(serial: string): DecoderValidation {
    const cleaned = serial.trim().toUpperCase().replace(/[\s-]/g, '');

    // Check if it's a 17-character VIN
    if (/^VF[37][A-HJ-NPR-Z0-9]{14}$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, subType: 'PSA_VIN' };
    }

    // Check if it's an older Clarion serial
    if (/^CL\d{12}$/.test(cleaned) || /^C7[A-Z0-9]{12}$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, subType: 'CLARION_LEGACY' };
    }

    return {
      valid: false,
      error: 'Pentru PSA introduceti VIN-ul masinii de 17 caractere (incepe cu VF3 sau VF7) sau seria Clarion (ex: CL...).',
    };
  },
  decode(serial: string): DecodeResult {
    const cleaned = serial.trim().toUpperCase().replace(/[\s-]/g, '');

    if (/^VF[37]/.test(cleaned)) {
      return {
        ok: true,
        brand: 'PSA (Peugeot / Citroën)',
        model: 'RD4 / RD45 / RT6 / SMEG / NAC (CAN-Bus Architecture)',
        method: 'vin_locked',
        confidence: 'guaranteed',
        technicalNote: `Unitatile PSA moderne nu utilizeaza cod PIN! Securitatea antifurt este bazata pe protocolul CAN-Bus: radioul compara VIN-ul salvat in EEPROM cu VIN-ul transmis de BSI. Pentru VIN ${cleaned}, solutia este telecodarea VIN-ului.`,
        instructions: 'Solutie tehnica antifurt:\n1. Conectati interfata de diagnoza Lexia / Diagbox la mufa OBD a vehiculului.\n2. Accesati meniul "Autoradio / Telematique" -> "Telecodage / Configuration".\n3. Introduceti seria de sasiu (VIN) a vehiculului dumneavoastra: ' + cleaned + '.\n4. Salvati configuratia (Telecodare manuala). Sunetul de "beep" va inceta instantaneu.',
      };
    }

    return {
      ok: false,
      brand: 'PSA (Peugeot / Citroën)',
      model: 'Clarion Legacy',
      method: 'lookup',
      confidence: 'database_required',
      error: 'Unitatile vechi Clarion (pre-2004) necesita baza de date de fabrica sau citirea cipului EEPROM.',
    };
  },
};

registerDecoder(psaDecoder);
