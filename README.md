# AnyRadio Code Recovery (OEM Security Forge)

Aplicatie web profesionala construita in **Next.js (App Router)**, **TypeScript Strict**, **Tailwind CSS** si **Vitest** pentru recuperarea codurilor de securitate radio dupa deconectarea bateriei, adresata exclusiv proprietarilor legitimi de vehicule.

---

## 1. Arhitectura de Securitate OEM: Algoritmic vs. Lookup vs. VIN-Locked

| Marca | Metoda | Algoritm / Protocol | Format Serie | Status Executie |
| :--- | :--- | :--- | :--- | :--- |
| **Renault & Dacia** | **Algoritmic pur (100% Offline)** | Transformare Philips/Continental Security Pre-code | `[A-Z]\d{3}` (ex: `T123`) sau final cod bare | PIN 4 cifre garantat instant |
| **Ford (Seria M)** | **Algoritmic pur (100% Offline)** | Matrice substitutie Visteon microcode | `M\d{6}` (ex: `M123456`) | PIN 4 cifre garantat instant |
| **Ford (Seria V)** | **Lookup Database / Dealer** | Hash table proprietar din fabrica (~1M perechi) | `V\d{6}` (ex: `V012345`) | Necesita baza de date dealer |
| **Toyota / Lexus** | **Challenge-Response (Algoritmic)** | Permutare pe 32 de biti Fujitsu Ten / Eclipse | 16 caractere HEX | Cheie deblocare 8 caractere |
| **PSA (Peugeot / Citroën)** | **CAN-Bus VIN-Locked** | Fara PIN! Unitatea verifica VIN din BSI | VIN 17 caractere (`VF3...`, `VF7...`) | Ghid telecodare Diagbox / EEPROM |
| **Fiat** | **Lookup / EEPROM Dump** | Blaupunkt / Bosch (ST95320 / 24C16) & VP1/VP2 | `BP\d{12}` sau `764xxxxxxx` | Baza date dealer / Dump EEPROM |
| **GM (Opel / Vauxhall)** | **CarPass / CAN Theftlock** | Memorie securizata TMS370 / 24C16 | `GM\d{12}` sau 6 cifre challenge US | Card CarPass / SPS Programming |
| **Chrysler / Jeep / Dodge** | **Server Mopar / WiTECH** | Uconnect / MyGIG AES hash | `T00AM...` / `P0506...` | Baza date Mopar / Dealer |

---

## 2. Structura Proiectului

```
├── app/
│   ├── api/
│   │   └── decode/
│   │       └── route.ts         # Route Handler cu Rate Limiting si validare
│   ├── globals.css              # Styling modern Tailwind CSS v4 (Dark Theme)
│   ├── layout.tsx               # Root Layout & Metadata SEO
│   └── page.tsx                 # UI complet: selectie, validare live, afisare PIN, ghid
├── lib/
│   ├── decoders/
│   │   ├── registry.ts          # Interfata comuna RadioDecoder & Register
│   │   ├── renault.ts           # Algoritm Renault/Dacia pre-code
│   │   ├── ford.ts              # Algoritm Ford Seria M & tratare V-Series
│   │   ├── toyota.ts            # Algoritm Toyota ERC 16-hex
│   │   ├── fiat.ts              # Parser Fiat Blaupunkt & Continental
│   │   ├── psa.ts               # Arhitectura PSA CAN-Bus VIN protection
│   │   ├── gm.ts                # Parser GM Opel CarPass & Theftlock
│   │   ├── chrysler.ts          # Parser Chrysler T00AM & Uconnect
│   │   └── index.ts             # Barrel export
│   ├── validation/
│   │   └── index.ts             # Validare request, schema si declaratie proprietate
│   └── rateLimit.ts             # Rate limiter sliding-window in-memory
├── tests/
│   └── decoders.test.ts         # 19 teste unitare Vitest cu vectori cunoscuti
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 3. Rulare Locala & Testare

### Cerinte:
- Node.js >= 18.x
- npm >= 9.x

### Comenzi:
```bash
# Instalare dependinte
npm install

# Rulare teste unitare (Vitest)
npm test

# Pornire server de dezvoltare
npm run dev

# Build de productie
npm run build

# Rulare server de productie
npm run start
```

---

## 4. Deploy pe Vercel

1. Trimite codul intr-un repository GitHub / GitLab.
2. Acceseaza [vercel.com](https://vercel.com) si apasa **"Add New Project"**.
3. Selecteaza repository-ul. Next.js este detectat automat.
4. Apasa **"Deploy"**.
Aplicatia este complet compatibila cu Vercel Edge / Serverless functions.
