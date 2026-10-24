/** Electronic component categories (they show the Value / Voltage / Package fields). */
export const ELECTRONIC_CATEGORIES = [
  'Resistors',
  'Capacitors',
  'Inductors',
  'Diodes',
  'Transistors',
  'LEDs',
  'PSU',
  'ICs',
  'Microcontrollers',
  'Connectors',
  'Switches',
  'Crystals',
  'Sensors',
  'RF',
  'Cables',
  'Components',
] as const;

const electronic = new Set(ELECTRONIC_CATEGORIES.map(c => c.toLowerCase()));

export const isElectronicCategory = (category?: string) =>
  !!category && electronic.has(category.trim().toLowerCase());

// Order matters: the first matching rule wins
const RULES: [RegExp, string][] = [
  [/thermistor|\bNTC\b|\bPTC\b|current sensor|\bhall\b|compass|magnetic sensor|temperature sensor|humidity|accelerometer|gyro/i, 'Sensors'],
  [/crystal|oscillator|resonator/i, 'Crystals'],
  [/antenna/i, 'RF'],
  [/\bFFC\b|cable/i, 'Cables'],
  [/power management|power receiver|\bPD\b controller|USB PD/i, 'PSU'],
  [/resistor|résistance/i, 'Resistors'],
  [/capacitor|condensateur/i, 'Capacitors'],
  [/inductor|inductance/i, 'Inductors'],
  [/\bLED\b/i, 'LEDs'],
  [/diode|schottky|rectifier|zener|\bTVS\b|\bESD\b/i, 'Diodes'],
  [/mosfet|\bFETs?\b|transistor|\bBJT\b/i, 'Transistors'],
  [/microcontroller|\bMCU\b|ESP32|ESP8266|STM32|ATmega|RP2040|transceiver module|RF module|wi-?fi|bluetooth/i, 'Microcontrollers'],
  [/connector|header|receptacle|socket/i, 'Connectors'],
  [/\bswitch(es)?\b|tactile|push ?button/i, 'Switches'],
  [/DC[ -]?DC|boost|buck|step[ -]?(up|down)|switching regulator/i, 'PSU'],
  [/regulator|converter|\bLDO\b|amplifier|\bop-?amp\b|driver|\bIC\b|logic|sensor|memory|eeprom|flash/i, 'ICs'],
];

/** Guesses a component category from its description / LCSC category. */
export function categorizeComponent(...texts: (string | undefined)[]): string {
  const text = texts.filter(Boolean).join(' ');
  return RULES.find(([re]) => re.test(text))?.[1] ?? 'Components';
}

/** SKU prefix per category. */
export const SKU_PREFIXES: Record<string, string> = {
  'resistors': 'RES', 'capacitors': 'CAP', 'inductors': 'IND', 'diodes': 'DIO',
  'transistors': 'TRA', 'leds': 'LED', 'ics': 'IC', 'microcontrollers': 'MCU',
  'connectors': 'CON', 'switches': 'SW', 'psu': 'PSU', 'crystals': 'XTAL', 'sensors': 'SEN',
  'rf': 'RF', 'cables': 'CBL', 'components': 'COMP',
  'hardware': 'HW', 'raw materials': 'MAT', 'electrical': 'ELEC',
};
