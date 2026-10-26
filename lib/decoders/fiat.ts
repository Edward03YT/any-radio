import { RadioDecoder, DecodeResult, DecoderValidation, registerDecoder } from './registry';

export const fiatDecoder: RadioDecoder = {
  brandId: 'fiat',
  brandName: 'Fiat / Alfa Romeo / Lancia',
  aliases: ['alfa', 'alfa-romeo', 'lancia'],
  supportedModels: [
    'Blaupunkt CD / MP3 (Punto, Grande Punto, Panda, Doblo, Ducato)',
    'Bosch High / Mid (Fiat 500, Ducato)',
    'Continental VP1 / VP2 (Fiat 500, Tipo, 500X)',
    'Magneti Marelli Connect Nav',
  ],
  serialPattern: /^(BP\d{12}|764\d{7}|A2C\d{8}|FA\d{10})$/i,
  placeholder: 'Ex: BP738982403096 sau 7646389316',
  exampleSerials: ['BP738982403096', 'BP237534091234', '7646389316'],
  method: 'lookup',
  helpInstructions: {
    labelLocation: 'Gravat direct pe sasiul metalic sau pe eticheta de hartie de pe partea laterala a radioului.',
    removalRequired: true,
    buttonShortcut: 'Unitatile Fiat nu afiseaza seria pe ecran prin combinatii de taste. Este obligatorie extragerea unitatii.',
    removalGuide: 'Introduceti doua tije de extractie (tip tije U standard Blaupunkt/Fiat) in cele 4 orificii de pe panoul frontal pentru a elibera clemele si a trage radioul afara.',
  },
  validate(serial: string): DecoderValidation {
    const cleaned = serial.trim().toUpperCase().replace(/[\s-]/g, '');

    // Blaupunkt 14-char: BP + 12 digits
    if (/^BP\d{12}$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, subType: 'BLAUPUNKT_BP' };
    }

    // Blaupunkt 10-char part number: 764x...
    if (/^764\d{7}$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, subType: 'BLAUPUNKT_PART' };
    }

    // Continental A2C or FA series
    if (/^(A2C\d{8}|FA\d{10})$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, subType: 'CONTINENTAL_VP' };
    }

    return {
      valid: false,
      error: 'Seria Fiat Blaupunkt trebuie sa aiba formatul BP urmat de 12 cifre (ex: BP738982403096) sau codul de piesa 764xxxxxxx.',
    };
  },
  decode(serial: string): DecodeResult {
    const cleaned = serial.trim().toUpperCase().replace(/[\s-]/g, '');

    if (/^BP\d{12}$/.test(cleaned) || /^764\d{7}$/.test(cleaned)) {
      return {
        ok: false,
        brand: 'Fiat',
        model: 'Blaupunkt OEM',
        method: 'lookup',
        confidence: 'database_required',
        error: `Seria ${cleaned} a fost validata cu succes, dar unitatile Fiat Blaupunkt/Bosch utilizeaza mapare de fabrica sau stocare in memoria EEPROM (ST95320 / 24C16) si nu o formula pur liniara.`,
        technicalNote: 'Pentru deblocare instantanee este necesara interogarea bazei de date de fabrica Fiat/Blaupunkt sau citirea dump-ului binar din cipul EEPROM 95320 de pe placa de baza a radioului.',
        instructions: 'Pentru recuperare fara demontare de cip, apelati la un reprezentant Fiat cu cartea de identitate a vehiculului (CarPass) sau consultati un specialist in deblocare dump EEPROM.',
      };
    }

    return {
      ok: false,
      brand: 'Fiat',
      model: 'Continental / VP',
      method: 'lookup',
      confidence: 'dealer_or_dump_required',
      error: 'Unitatile Continental VP1 / VP2 nu pot fi decodate dupa serie seriala simpla. Codul este asociat prin CAN de Body Computer sau salvat in memoria flash securizata.',
    };
  },
};

registerDecoder(fiatDecoder);
