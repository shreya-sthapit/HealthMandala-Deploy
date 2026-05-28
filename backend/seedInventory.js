/**
 * seedInventory.js
 * Run once to populate the medicines collection:
 *   node seedInventory.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Medicine = require('./src/models/Medicine');

const dbURI = process.env.MONGODB_URI;
if (!dbURI) {
  console.error('MONGODB_URI not found in .env');
  process.exit(1);
}

const dummyMedicines = [
  // --- 1. ANALGESICS & ANTIPYRETICS ---
  { medicine_name: "Cetamol 500mg (Paracetamol)",          unit_price:  2.00, stock_quantity: 500 },
  { medicine_name: "Napa 500mg Tablet",                    unit_price:  1.50, stock_quantity: 400 },
  { medicine_name: "Flexon Tablet (Ibuprofen+Paracetamol)",unit_price:  5.00, stock_quantity: 250 },
  { medicine_name: "Nimucet Tablet",                       unit_price:  6.00, stock_quantity: 180 },
  { medicine_name: "Zerodol-P (Aceclofenac+Paracetamol)",  unit_price:  8.00, stock_quantity: 220 },
  { medicine_name: "Ultracet (Tramadol+Paracetamol)",      unit_price: 15.00, stock_quantity:  75 },
  { medicine_name: "Brufen 400mg",                         unit_price:  4.00, stock_quantity: 300 },

  // --- 2. GASTROINTESTINAL ---
  { medicine_name: "Pantocid 40mg (Pantoprazole)",         unit_price:  7.00, stock_quantity: 350 },
  { medicine_name: "Pan-D Capsule",                        unit_price: 12.00, stock_quantity: 190 },
  { medicine_name: "Omez 20mg (Omeprazole)",               unit_price:  5.00, stock_quantity: 450 },
  { medicine_name: "Aciloc 150mg (Ranitidine)",            unit_price:  3.00, stock_quantity: 500 },
  { medicine_name: "Digene Gel Liquid (200ml)",            unit_price:145.00, stock_quantity:  40 },
  { medicine_name: "Emeset 4mg (Ondansetron)",             unit_price:  6.50, stock_quantity: 120 },
  { medicine_name: "Domstal 10mg (Domperidone)",           unit_price:  4.50, stock_quantity: 200 },
  { medicine_name: "Cremaffin Syrup (225ml)",              unit_price:260.00, stock_quantity:  25 },
  { medicine_name: "Librax Tablet",                        unit_price:  9.00, stock_quantity: 110 },

  // --- 3. ANTIBIOTICS & ANTIVIRALS ---
  { medicine_name: "Azithral 500mg (Azithromycin)",        unit_price: 25.00, stock_quantity:  90 },
  { medicine_name: "Almox 500mg (Amoxicillin)",            unit_price:  8.00, stock_quantity: 150 },
  { medicine_name: "Taxim-O 200mg (Cefixime)",             unit_price: 18.00, stock_quantity: 100 },
  { medicine_name: "Augmentin 625 DUO",                    unit_price: 30.00, stock_quantity:  85 },
  { medicine_name: "Cifran 500mg (Ciprofloxacin)",         unit_price: 11.00, stock_quantity: 130 },
  { medicine_name: "Metrogyl 400mg (Metronidazole)",       unit_price:  3.50, stock_quantity: 300 },
  { medicine_name: "Zyloric 100mg",                        unit_price:  7.00, stock_quantity: 140 },
  { medicine_name: "Acivir 400mg (Acyclovir)",             unit_price: 22.00, stock_quantity:  60 },

  // --- 4. RESPIRATORY ---
  { medicine_name: "Sinex Cold Tablet",                    unit_price:  4.00, stock_quantity:   0 },
  { medicine_name: "Montair-FX (Montelukast+Fexofenadine)",unit_price: 20.00, stock_quantity: 140 },
  { medicine_name: "Allegra 120mg",                        unit_price: 16.00, stock_quantity:  95 },
  { medicine_name: "Ascoril-D Cough Syrup",                unit_price:130.00, stock_quantity:  50 },
  { medicine_name: "Benadryl Cough Syrup (100ml)",         unit_price:115.00, stock_quantity:  45 },
  { medicine_name: "Alex Cough Lozenges",                  unit_price:  5.00, stock_quantity: 400 },
  { medicine_name: "Deriphyllin Tablet",                   unit_price:  3.00, stock_quantity: 250 },

  // --- 5. CARDIOVASCULAR & DIABETES ---
  { medicine_name: "Amlong 5mg (Amlodipine)",              unit_price:  6.00, stock_quantity: 400 },
  { medicine_name: "Telma 40mg (Telmisartan)",             unit_price:  9.50, stock_quantity: 320 },
  { medicine_name: "Glycomet 500mg (Metformin)",           unit_price:  4.00, stock_quantity: 600 },
  { medicine_name: "Glimy-M2 Tablet",                      unit_price: 14.00, stock_quantity: 180 },
  { medicine_name: "Atorva 10mg (Atorvastatin)",           unit_price: 11.00, stock_quantity: 210 },
  { medicine_name: "Concor 5mg (Bisoprolol)",              unit_price: 12.50, stock_quantity: 150 },
  { medicine_name: "Clopilet 75mg (Clopidogrel)",          unit_price: 14.00, stock_quantity: 130 },

  // --- 6. VITAMINS & SUPPLEMENTS ---
  { medicine_name: "Becosules Capsule (Vitamin B-Complex)", unit_price:  4.00, stock_quantity: 500 },
  { medicine_name: "Evion 400mg (Vitamin E)",               unit_price:  7.50, stock_quantity: 300 },
  { medicine_name: "Shelcal 500mg (Calcium + Vit D3)",      unit_price:  8.50, stock_quantity: 350 },
  { medicine_name: "Neurobion Forte Injection",             unit_price: 15.00, stock_quantity:  80 },
  { medicine_name: "Zincovit Tablet",                       unit_price:  6.00, stock_quantity: 240 },
  { medicine_name: "Autrin Capsule (Iron Supplement)",      unit_price: 10.00, stock_quantity: 160 },

  // --- 7. TOPICALS & EYE/EAR DROPS ---
  { medicine_name: "Betadine Ointment (20gm)",             unit_price: 85.00, stock_quantity:  65 },
  { medicine_name: "Volini Gel (30gm)",                    unit_price:110.00, stock_quantity:  55 },
  { medicine_name: "Quadriderm RF Cream",                  unit_price: 95.00, stock_quantity:   0 },
  { medicine_name: "Ciplox Eye/Ear Drops",                 unit_price: 35.00, stock_quantity: 120 },
  { medicine_name: "Tears Naturale Eye Drops",             unit_price:210.00, stock_quantity:  40 },
  { medicine_name: "Candid Mouth Paint",                   unit_price: 75.00, stock_quantity:  70 },

  // --- 8. CENTRAL NERVOUS SYSTEM ---
  { medicine_name: "Alprax 0.25mg (Alprazolam)",           unit_price:  4.50, stock_quantity: 150 },
  { medicine_name: "Clonam 0.5mg (Clonazepam)",            unit_price:  5.50, stock_quantity: 130 },
  { medicine_name: "Stemetil 5mg",                         unit_price:  6.00, stock_quantity:  90 },
  { medicine_name: "Encorate Chrono 300 (Sodium Valproate)",unit_price: 13.00, stock_quantity: 110 },
  { medicine_name: "Pacific 10mg",                         unit_price:  5.00, stock_quantity: 100 },

  // --- 9. AYURVEDIC & HERBAL ---
  { medicine_name: "Liv-52 Syrup (200ml)",                 unit_price:170.00, stock_quantity:  45 },
  { medicine_name: "Cystone Tablet (Himalaya)",            unit_price:  3.50, stock_quantity: 300 },
  { medicine_name: "Koflet Syrup (100ml)",                 unit_price:105.00, stock_quantity:  60 },
  { medicine_name: "Septilin Tablet",                      unit_price:  4.00, stock_quantity: 150 },
  { medicine_name: "Pudin Hara Pearls",                    unit_price:  2.50, stock_quantity: 400 },
];

mongoose.connect(dbURI)
  .then(async () => {
    console.log('Connected to MongoDB...');
    await Medicine.deleteMany({});
    console.log('Cleared existing medicines.');
    await Medicine.insertMany(dummyMedicines);
    console.log(`Seeded ${dummyMedicines.length} medicines successfully.`);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  });
