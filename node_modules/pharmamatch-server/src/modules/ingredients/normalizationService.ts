import { Ingredient } from '../../models/Ingredient.js';
import mongoose from 'mongoose';

export class NormalizationService {
  private static fallbackAliases: Record<string, string> = {
    // English variations and salt forms
    'calcium': 'calcium',
    'calcium carbonate': 'calcium',
    'calcium citrate': 'calcium',
    'calcium ca': 'calcium',
    'paracetamol': 'paracetamol',
    'acetaminophen': 'paracetamol',
    'apap': 'paracetamol',
    'amoxicillin': 'amoxicillin',
    'amoxicillin trihydrate': 'amoxicillin',
    'clavulanic acid': 'clavulanic acid',
    'clavulanate potassium': 'clavulanic acid',
    'potassium clavulanate': 'clavulanic acid',
    'ibuprofen': 'ibuprofen',
    'bisoprolol': 'bisoprolol',
    'bisoprolol fumarate': 'bisoprolol',
    'pantoprazole': 'pantoprazole',
    'pantoprazole sodium': 'pantoprazole',
    'omeprazole': 'omeprazole',
    'esomeprazole': 'esomeprazole',
    'diclofenac': 'diclofenac',
    'diclofenac potassium': 'diclofenac',
    'diclofenac sodium': 'diclofenac',
    'cetirizine': 'cetirizine',
    'cetirizine dihydrochloride': 'cetirizine',
    'metformin': 'metformin',
    'metformin hydrochloride': 'metformin',
    'atorvastatin': 'atorvastatin',
    'atorvastatin calcium': 'atorvastatin',
    'vitamin d': 'vitamin d',
    'vitamin d3': 'vitamin d',
    'cholecalciferol': 'vitamin d',
    'magnesium': 'magnesium',
    'magnesium oxide': 'magnesium',
    'zinc': 'zinc',
    'zinc sulfate': 'zinc',
    'caffeine': 'caffeine',
    'caffeine anhydrous': 'caffeine',

    // Arabic transliterations
    'كالسيوم': 'calcium',
    'كربونات الكالسيوم': 'calcium',
    'باراسيتامول': 'paracetamol',
    'اسيتامينوفين': 'paracetamol',
    'اموكسيسيلين': 'amoxicillin',
    'أموكسيسيلين': 'amoxicillin',
    'حمض الكلافولانيك': 'clavulanic acid',
    'ايبوبروفين': 'ibuprofen',
    'إيبوبروفين': 'ibuprofen',
    'بيسوبرولول': 'bisoprolol',
    'بانتوبرازول': 'pantoprazole',
    'اوميبرازول': 'omeprazole',
    'أوميبرازول': 'omeprazole',
    'ديكلوفيناك': 'diclofenac',
    'سيتريزين': 'cetirizine',
    'ميتفورمين': 'metformin',
    'اتورفاستاتين': 'atorvastatin',
    'فيتامين د': 'vitamin d',
    'ماغنسيوم': 'magnesium',
    'مغنيسيوم': 'magnesium',
    'زنك': 'zinc',
    'كافيين': 'caffeine',
  };

  /**
   * Normalize an ingredient name string deterministically
   */
  public static normalizeString(input: string): string {
    if (!input) return '';
    return input
      .trim()
      .toLowerCase()
      .replace(/[\u064B-\u065F]/g, '') // remove Arabic diacritics
      .replace(/[^\w\s\u0600-\u06FF]/g, ' ') // keep letters, numbers, and arabic characters
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Resolves canonical ingredient name using deterministic alias map and DB
   */
  public static async resolveCanonical(rawName: string): Promise<{ canonical: string; normalized: string }> {
    const normalized = this.normalizeString(rawName);

    if (this.fallbackAliases[normalized]) {
      const canonical = this.fallbackAliases[normalized];
      return { canonical, normalized: this.normalizeString(canonical) };
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const record = await Ingredient.findOne({
          $or: [
            { normalizedName: normalized },
            { aliases: normalized },
            { canonicalName: new RegExp(`^${normalized}$`, 'i') },
          ]
        }).lean();

        if (record) {
          return {
            canonical: record.canonicalName,
            normalized: record.normalizedName,
          };
        }
      } catch {
        // ignore db error
      }
    }

    // Default to cleaned normalized name
    return {
      canonical: rawName.trim(),
      normalized: normalized,
    };
  }

  /**
   * Normalize product name (removes extra dosages and symbols for matching)
   */
  public static normalizeProductName(name: string): string {
    return this.normalizeString(name)
      .replace(/\b\d+(\.\d+)?\s*(mg|g|mcg|ml|iu|%)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
