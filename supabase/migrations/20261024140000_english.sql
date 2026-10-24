-- Switch stored data to English

-- Categories
UPDATE public.stock_items SET category = CASE category
  WHEN 'Résistances' THEN 'Resistors'
  WHEN 'Condensateurs' THEN 'Capacitors'
  WHEN 'Inductances' THEN 'Inductors'
  WHEN 'LED' THEN 'LEDs'
  WHEN 'Circuits intégrés' THEN 'ICs'
  WHEN 'Microcontrôleurs' THEN 'Microcontrollers'
  WHEN 'Connecteurs' THEN 'Connectors'
  WHEN 'Interrupteurs' THEN 'Switches'
  WHEN 'Composants' THEN 'Components'
  WHEN 'Visserie' THEN 'Hardware'
  WHEN 'Matières premières' THEN 'Raw materials'
  WHEN 'Électrique' THEN 'Electrical'
  ELSE category END;

-- Spec labels
UPDATE public.stock_items SET specs = (
  SELECT coalesce(jsonb_agg(
    jsonb_set(s, '{name}', to_jsonb(CASE s->>'name'
      WHEN 'Fabricant' THEN 'Manufacturer'
      WHEN 'Réf. fabricant' THEN 'MPN'
      WHEN 'Boîtier' THEN 'Package'
      ELSE s->>'name' END))
    ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements(specs) WITH ORDINALITY AS e(s, ord)
);

-- Resistors
UPDATE public.stock_items SET
  name = replace(name, 'Résistance ', 'Resistor '),
  description = replace(description, 'Résistance CMS ', 'SMD resistor ')
WHERE name LIKE 'Résistance %';

-- Other parts from the LCSC order
UPDATE public.stock_items AS t SET name = v.name
FROM (VALUES
  ('C709357', 'USB-C connector 16 pins'),
  ('C78162', 'SX1308 boost converter 2A'),
  ('C2926676', 'ESP32-C3-WROOM-02U module (4 MB, ext. antenna)'),
  ('C970661', 'Electrolytic capacitor 22µF 10V'),
  ('C18906017', 'AMS1117-3.3 LDO regulator 1A'),
  ('C318884', 'SMD push button 5.1×5.1mm'),
  ('C20917', 'N-MOSFET AO3400A 30V'),
  ('C19702', 'Ceramic capacitor 10µF 10V X5R'),
  ('C14663', 'Ceramic capacitor 100nF 50V X7R'),
  ('C602037', 'Ceramic capacitor 22µF 25V X5R'),
  ('C22448055', 'Schottky diode SS34 40V 3A'),
  ('C181721', 'Inductor 10µH 3.2A'),
  ('C114586', 'WS2812B 5050 addressable RGB LED'),
  ('C347476', 'P-MOSFET AO3401A 30V'),
  ('C82460', 'NPN transistor MMBT2222A'),
  ('C5197386', 'USBLC6-4SC6 ESD protection'),
  ('C2827654', 'USBLC6-2SC6 ESD protection'),
  ('C42163197', 'XL-6028 addressable RGBW LED (2812B)'),
  ('C5454926', 'USB-C connector 24 pins'),
  ('C49678', 'Ceramic capacitor 100nF 50V X7R')
) AS v(code, name)
WHERE t.lcsc_part = v.code;

UPDATE public.stock_items SET component_value = CASE component_value
  WHEN '4 lignes' THEN '4 lines'
  WHEN '2 lignes' THEN '2 lines'
  ELSE component_value END;

-- Shopping lists
ALTER TABLE public.shopping_lists ALTER COLUMN name SET DEFAULT 'Shopping list';
UPDATE public.shopping_lists SET name = 'Shopping list' WHERE name = 'Liste de courses';

NOTIFY pgrst, 'reload schema';
