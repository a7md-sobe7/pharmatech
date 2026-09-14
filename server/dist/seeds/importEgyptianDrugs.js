/**
 * importEgyptianDrugs.ts
 * One-time import of all 25,095 Egyptian drugs from reference database into MongoDB Atlas.
 * Run with: npm run import-drugs --workspace=server
 *
 * Maps CSV fields:
 *   commercial_name_en  → productName, brandName
 *   commercial_name_ar  → arabicName
 *   scientific_name     → genericName, primaryActiveIngredient, activeIngredients
 *   manufacturer        → manufacturer
 *   drug_class          → therapeuticClass
 *   route               → route, dosageForm, dosageFormCategory
 *   price_egp           → referencePrice
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import { parse } from 'csv-parse/sync';
import { DrugProduct } from '../models/DrugProduct.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// ─── Route → DosageForm mapping ─────────────────────────────────────────────
function mapDosageForm(route) {
    const r = (route || '').toUpperCase().trim();
    if (r.includes('ORAL.SOLID'))
        return { dosageForm: 'Tablets/Capsules', dosageFormCategory: 'Oral Solid', normalizedRoute: 'Oral' };
    if (r.includes('ORAL.LIQUID'))
        return { dosageForm: 'Syrup/Solution', dosageFormCategory: 'Oral Liquid', normalizedRoute: 'Oral' };
    if (r.includes('INJECTION'))
        return { dosageForm: 'Injection', dosageFormCategory: 'Parenteral', normalizedRoute: 'Injection' };
    if (r.includes('TOPICAL'))
        return { dosageForm: 'Cream/Ointment', dosageFormCategory: 'Topical', normalizedRoute: 'Topical' };
    if (r.includes('EFF'))
        return { dosageForm: 'Effervescent', dosageFormCategory: 'Oral Solid', normalizedRoute: 'Oral' };
    if (r.includes('SOAP'))
        return { dosageForm: 'Soap', dosageFormCategory: 'Topical', normalizedRoute: 'Topical' };
    if (r.includes('NASAL'))
        return { dosageForm: 'Nasal Spray', dosageFormCategory: 'Nasal', normalizedRoute: 'Nasal' };
    if (r.includes('OPHTHALMIC') || r.includes('OCULAR'))
        return { dosageForm: 'Eye Drops', dosageFormCategory: 'Ophthalmic', normalizedRoute: 'Ophthalmic' };
    if (r.includes('INHALE') || r.includes('INHAL'))
        return { dosageForm: 'Inhaler', dosageFormCategory: 'Inhalation', normalizedRoute: 'Inhalation' };
    if (r.includes('RECTAL'))
        return { dosageForm: 'Suppository', dosageFormCategory: 'Rectal', normalizedRoute: 'Rectal' };
    if (r.includes('VAGINAL'))
        return { dosageForm: 'Vaginal', dosageFormCategory: 'Vaginal', normalizedRoute: 'Vaginal' };
    if (r.includes('PATCH'))
        return { dosageForm: 'Patch', dosageFormCategory: 'Transdermal', normalizedRoute: 'Transdermal' };
    return { dosageForm: route || 'Unknown', dosageFormCategory: 'Other', normalizedRoute: route || 'Unknown' };
}
// ─── Parse scientific name into ingredients ──────────────────────────────────
function parseIngredients(scientificName) {
    if (!scientificName?.trim()) {
        return {
            primaryActiveIngredient: { name: 'Unknown', normalizedName: 'unknown', confidence: 'LOW', source: 'EDA' },
            activeIngredients: [],
        };
    }
    // Strip parenthetical synonyms: "PARACETAMOL(ACETAMINOPHEN)" → "PARACETAMOL"
    const clean = scientificName.replace(/\([^)]*\)/g, '').trim();
    const parts = clean.split('+').map(s => s.trim()).filter(Boolean);
    const primary = parts[0] || scientificName.trim();
    const activeIngredients = parts.map((name, i) => ({
        name,
        normalizedName: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        role: i === 0 ? 'PRIMARY' : 'SECONDARY',
    }));
    return {
        primaryActiveIngredient: {
            name: primary,
            normalizedName: primary.toLowerCase().replace(/[^a-z0-9]/g, ''),
            confidence: 'HIGH',
            source: 'Egyptian Drug Authority',
        },
        activeIngredients,
    };
}
// ─── Main import function ─────────────────────────────────────────────────────
async function importDrugs() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('❌ MONGO_URI not set. Make sure .env has MONGO_URI=...');
        process.exit(1);
    }
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to Atlas.\n');
    // Load the reference JSON and CSV
    const jsonPath = path.resolve(__dirname, '../../../reference database/data/egyptian-drugs.json');
    const csvPath = path.resolve(__dirname, '../../../reference database/data/egyptian-drugs.csv');
    console.log('Loading JSON reference database...');
    let rawJson = [];
    if (fs.existsSync(jsonPath)) {
        rawJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        console.log(`✅ Loaded ${rawJson.length.toLocaleString()} drug entries from JSON.`);
    }
    else {
        console.warn(`⚠️ JSON reference database not found at: ${jsonPath}`);
    }
    console.log('Loading CSV reference database...');
    let rawCsv = [];
    if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf-8');
        rawCsv = parse(csvData, {
            columns: true,
            skip_empty_lines: true,
            relax_column_count: true,
            relax_quotes: true
        });
        console.log(`✅ Loaded ${rawCsv.length.toLocaleString()} drug entries from CSV.`);
    }
    else {
        console.warn(`⚠️ CSV reference database not found at: ${csvPath}`);
    }
    if (rawJson.length === 0 && rawCsv.length === 0) {
        console.error(`❌ No reference databases found.`);
        process.exit(1);
    }
    // Merge and deduplicate
    const mergedMap = new Map();
    for (const item of [...rawJson, ...rawCsv]) {
        const key = item.commercial_name_en?.trim();
        if (key && !mergedMap.has(key)) {
            mergedMap.set(key, item);
        }
    }
    const raw = Array.from(mergedMap.values());
    console.log(`✅ Merged and deduplicated to ${raw.length.toLocaleString()} drug entries.\n`);
    // Check existing count
    const existingCount = await DrugProduct.countDocuments();
    console.log(`Existing DrugProduct records in Atlas: ${existingCount}`);
    if (existingCount >= raw.length * 0.9) {
        console.log('✅ Database already fully imported. Skipping.');
        await mongoose.disconnect();
        return;
    }
    // Clear old seeded records (< 1000 = just the 27 seeded ones)
    if (existingCount < 1000) {
        console.log('Clearing seeded placeholder records...');
        await DrugProduct.deleteMany({});
        console.log('✅ Cleared.\n');
    }
    // Map and batch-insert
    const BATCH_SIZE = 500;
    let inserted = 0;
    let skipped = 0;
    console.log(`Importing ${raw.length.toLocaleString()} drugs in batches of ${BATCH_SIZE}...\n`);
    for (let i = 0; i < raw.length; i += BATCH_SIZE) {
        const batch = raw.slice(i, i + BATCH_SIZE);
        const docs = batch
            .filter((row) => row.commercial_name_en?.trim()) // skip blank names
            .map((row) => {
            const { dosageForm, dosageFormCategory, normalizedRoute } = mapDosageForm(row.route);
            const { primaryActiveIngredient, activeIngredients } = parseIngredients(row.scientific_name);
            return {
                productName: row.commercial_name_en.trim(),
                normalizedName: row.commercial_name_en.trim().toLowerCase().replace(/[^a-z0-9\s]/g, ''),
                arabicName: row.commercial_name_ar?.trim() || undefined,
                brandName: row.commercial_name_en.trim(),
                genericName: row.scientific_name?.trim() || row.commercial_name_en.trim(),
                manufacturer: row.manufacturer?.trim() || 'Unknown',
                activeIngredients,
                primaryActiveIngredient,
                dosageForm,
                dosageFormCategory,
                route: normalizedRoute,
                therapeuticClass: row.drug_class?.trim() || 'Unclassified',
                indications: [],
                contraindications: [],
                interactions: [],
                references: [{ title: 'Egyptian Drug Authority Database', source: 'EDA', url: '' }],
                source: 'Egyptian Drug Authority',
                sourceUrl: '',
                referencePrice: typeof row.price_egp === 'number' ? row.price_egp : parseFloat(row.price_egp) || undefined,
                referencePriceCurrency: 'EGP',
                lastVerifiedAt: new Date(),
            };
        });
        try {
            const result = await DrugProduct.insertMany(docs, { ordered: false });
            inserted += result.length;
        }
        catch (err) {
            // ordered: false continues on duplicates — count actual inserts
            if (err.insertedDocs)
                inserted += err.insertedDocs.length;
            skipped += docs.length - (err.insertedDocs?.length || 0);
        }
        const progress = Math.min(i + BATCH_SIZE, raw.length);
        const pct = ((progress / raw.length) * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${progress.toLocaleString()} / ${raw.length.toLocaleString()} (${pct}%)   `);
    }
    console.log('\n');
    const finalCount = await DrugProduct.countDocuments();
    console.log(`✅ Import complete!`);
    console.log(`   Inserted:  ${inserted.toLocaleString()}`);
    console.log(`   Skipped:   ${skipped.toLocaleString()}`);
    console.log(`   Total in Atlas: ${finalCount.toLocaleString()} drug products\n`);
    await mongoose.disconnect();
    console.log('Done. Disconnected from Atlas.');
}
importDrugs().catch((err) => {
    console.error('❌ Import failed:', err);
    process.exit(1);
});
