import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { DrugProduct } from '../models/DrugProduct.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const classContraindicationsMap: Record<string, string[]> = {
  'ANTIHYPERTENSIVE': [
    'Known hypersensitivity to the active ingredient',
    'Severe hypotension',
    'Cardiogenic shock'
  ],
  'NSAID': [
    'Active peptic ulcer or gastrointestinal bleeding',
    'Severe heart failure',
    'History of asthma or allergic reactions after taking aspirin or other NSAIDs',
    'Third trimester of pregnancy'
  ],
  'ANALGESIC': [
    'Severe hepatic impairment',
    'Known hypersensitivity'
  ],
  'ANTIBIOTIC': [
    'Known hypersensitivity to this class of antibiotics',
    'History of severe allergic reactions (e.g., anaphylaxis)'
  ],
  'ANTIBACTERIAL': [
    'Known hypersensitivity to this class of antibiotics',
    'History of severe allergic reactions (e.g., anaphylaxis)'
  ],
  'ANTIDIABETIC': [
    'Type 1 diabetes mellitus (for type 2 specific drugs)',
    'Diabetic ketoacidosis',
    'Severe renal impairment'
  ],
  'INSULIN': [
    'Episodes of hypoglycemia',
    'Hypersensitivity to insulin or any excipients'
  ],
  'ANTIHISTAMINE': [
    'Narrow-angle glaucoma',
    'Symptomatic prostatic hypertrophy',
    'Acute asthma attacks'
  ],
  'CORTICOSTEROID': [
    'Systemic fungal infections',
    'Administration of live virus vaccines',
    'Known hypersensitivity'
  ],
  'ANTIVIRAL': [
    'Known hypersensitivity to the active substance'
  ],
  'ANTIFUNGAL': [
    'Severe hepatic impairment',
    'Co-administration with specific CYP3A4 substrates'
  ],
  'ANTINEOPLASTIC': [
    'Severe bone marrow suppression',
    'Pregnancy and lactation',
    'Severe active infections'
  ],
  'ANTIDEPRESSANT': [
    'Concomitant use of MAOIs',
    'Severe hepatic impairment'
  ],
  'ANTIPSYCHOTIC': [
    'Comatose states',
    'Severe CNS depression'
  ],
  'BRONCHODILATOR': [
    'Tachyarrhythmias',
    'Known hypersensitivity'
  ],
  'ANTIULCER': [
    'Known hypersensitivity to PPIs or H2 blockers',
    'Co-administration with rilpivirine'
  ],
  'LIPID REGULATING': [
    'Active liver disease',
    'Unexplained persistent elevations of serum transaminases',
    'Pregnancy and lactation'
  ],
  'ANTIHYPERLIPIDEMIC': [
    'Active liver disease',
    'Unexplained persistent elevations of serum transaminases',
    'Pregnancy and lactation'
  ],
  'ANTICOAGULANT': [
    'Active major bleeding',
    'Severe uncontrolled hypertension',
    'Recent brain, spinal, or ophthalmic surgery'
  ]
};

async function generateContraindications() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI not set.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected.\n');

  console.log('Starting bulk update of class-based contraindications...\n');

  let totalUpdated = 0;

  for (const [className, contraindications] of Object.entries(classContraindicationsMap)) {
    // Match therapeuticClass containing the keyword (case-insensitive)
    const regex = new RegExp(className, 'i');
    
    try {
      const result = await DrugProduct.updateMany(
        { 
          therapeuticClass: regex,
          // Only update if contraindications is currently empty
          $or: [
            { contraindications: { $exists: false } },
            { contraindications: { $size: 0 } }
          ]
        },
        { 
          $set: { contraindications: contraindications } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`Updated ${result.modifiedCount} drugs in class containing '${className}'`);
        totalUpdated += result.modifiedCount;
      }
    } catch (err) {
      console.error(`Error updating class ${className}:`, err);
    }
  }

  // Fallback for everything else
  const fallbackResult = await DrugProduct.updateMany(
    {
      $or: [
        { contraindications: { $exists: false } },
        { contraindications: { $size: 0 } }
      ]
    },
    {
      $set: { contraindications: ['Known hypersensitivity to the active ingredient or any excipients.'] }
    }
  );

  if (fallbackResult.modifiedCount > 0) {
    console.log(`Updated ${fallbackResult.modifiedCount} unclassified/other drugs with generic hypersensitivity warning.`);
    totalUpdated += fallbackResult.modifiedCount;
  }

  console.log(`\n✅ Finished generating contraindications. Total updated: ${totalUpdated}`);
  await mongoose.disconnect();
}

generateContraindications().catch(console.error);
