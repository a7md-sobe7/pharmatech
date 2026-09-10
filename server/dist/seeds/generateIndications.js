import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { DrugProduct } from '../models/DrugProduct.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const classIndicationsMap = {
    'ANTIHYPERTENSIVE': [
        'Management of hypertension',
        'Reduction of cardiovascular risk'
    ],
    'NSAID': [
        'Relief of mild to moderate pain',
        'Reduction of inflammation and swelling',
        'Management of osteoarthritis and rheumatoid arthritis'
    ],
    'ANALGESIC': [
        'Relief of mild to moderate pain',
        'Fever reduction (antipyretic)'
    ],
    'ANTIBIOTIC': [
        'Treatment of susceptible bacterial infections',
        'Prophylaxis in specific surgical procedures'
    ],
    'ANTIBACTERIAL': [
        'Treatment of susceptible bacterial infections'
    ],
    'ANTIDIABETIC': [
        'Management of type 2 diabetes mellitus',
        'Improvement of glycemic control'
    ],
    'INSULIN': [
        'Treatment of type 1 diabetes mellitus',
        'Treatment of type 2 diabetes mellitus requiring insulin therapy'
    ],
    'ANTIHISTAMINE': [
        'Relief of symptoms associated with allergic rhinitis',
        'Management of chronic idiopathic urticaria'
    ],
    'CORTICOSTEROID': [
        'Management of severe inflammatory conditions',
        'Treatment of allergic states and asthma',
        'Immunosuppression'
    ],
    'ANTIVIRAL': [
        'Treatment of specific viral infections (e.g., Herpes, Influenza, HIV)'
    ],
    'ANTIFUNGAL': [
        'Treatment of susceptible fungal infections (e.g., Candidiasis, Dermatophytosis)'
    ],
    'ANTINEOPLASTIC': [
        'Treatment of various malignancies and cancers'
    ],
    'ANTIDEPRESSANT': [
        'Treatment of major depressive disorder',
        'Management of anxiety disorders'
    ],
    'ANTIPSYCHOTIC': [
        'Management of schizophrenia',
        'Treatment of bipolar disorder'
    ],
    'BRONCHODILATOR': [
        'Relief of bronchospasm in conditions such as asthma and COPD'
    ],
    'ANTIULCER': [
        'Treatment of gastroesophageal reflux disease (GERD)',
        'Healing of peptic ulcers',
        'Eradication of H. pylori (in combination therapy)'
    ],
    'LIPID REGULATING': [
        'Reduction of elevated total cholesterol and LDL-C',
        'Prevention of cardiovascular disease'
    ],
    'ANTIHYPERLIPIDEMIC': [
        'Reduction of elevated total cholesterol and LDL-C',
        'Prevention of cardiovascular disease'
    ],
    'ANTICOAGULANT': [
        'Prevention and treatment of deep vein thrombosis (DVT) and pulmonary embolism (PE)',
        'Stroke prevention in atrial fibrillation'
    ]
};
async function generateIndications() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('❌ MONGO_URI not set.');
        process.exit(1);
    }
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected.\n');
    console.log('Starting bulk update of class-based indications...\n');
    let totalUpdated = 0;
    for (const [className, indications] of Object.entries(classIndicationsMap)) {
        const regex = new RegExp(className, 'i');
        try {
            const result = await DrugProduct.updateMany({
                therapeuticClass: regex,
                // Only update if indications is currently empty
                $or: [
                    { indications: { $exists: false } },
                    { indications: { $size: 0 } }
                ]
            }, {
                $set: { indications: indications }
            });
            if (result.modifiedCount > 0) {
                console.log(`Updated ${result.modifiedCount} drugs in class containing '${className}'`);
                totalUpdated += result.modifiedCount;
            }
        }
        catch (err) {
            console.error(`Error updating class ${className}:`, err);
        }
    }
    // Fallback for everything else
    const fallbackResult = await DrugProduct.updateMany({
        $or: [
            { indications: { $exists: false } },
            { indications: { $size: 0 } }
        ]
    }, {
        $set: { indications: ['Refer to the official product monograph or physician guidelines for specific clinical indications.'] }
    });
    if (fallbackResult.modifiedCount > 0) {
        console.log(`Updated ${fallbackResult.modifiedCount} unclassified/other drugs with generic indication statement.`);
        totalUpdated += fallbackResult.modifiedCount;
    }
    console.log(`\n✅ Finished generating indications. Total updated: ${totalUpdated}`);
    await mongoose.disconnect();
}
generateIndications().catch(console.error);
