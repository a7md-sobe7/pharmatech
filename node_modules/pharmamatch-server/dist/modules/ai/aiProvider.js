import { AIToolsExecutor } from './aiTools.js';
export class MockDeterministicProvider {
    async processQuery(userQuery) {
        const trimmed = userQuery.trim();
        const isArabic = /[\u0600-\u06FF]/.test(trimmed);
        const toolCalls = [];
        // Extract potential drug keyword from user query
        // e.g. "Calmag مش موجود، عندي حاجة شبهه؟" -> "Calmag" or "كالماج"
        const words = trimmed.split(/[\s,?.!]+/);
        let detectedDrugQuery = '';
        // Common query stopwords in EN and AR
        const stopwords = new Set([
            'do', 'you', 'have', 'is', 'the', 'available', 'similar', 'not', 'out', 'of', 'stock',
            'what', 'alternative', 'alternatives', 'for', 'to', 'can', 'i', 'get', 'product', 'medicine',
            'مش', 'موجود', 'غير', 'متوفر', 'عندي', 'حاجة', 'شبهه', 'بديل', 'بدائل', 'هل', 'يوجد', 'في', 'المخزن', 'الصيدلية'
        ]);
        for (const w of words) {
            const cleanW = w.toLowerCase().replace(/[^\w\u0600-\u06FF]/g, '');
            if (cleanW.length >= 3 && !stopwords.has(cleanW)) {
                detectedDrugQuery = cleanW;
                break;
            }
        }
        if (!detectedDrugQuery && words.length > 0) {
            detectedDrugQuery = words[0];
        }
        // 1. Tool Call: searchProduct
        const searchArgs = { query: detectedDrugQuery || trimmed };
        const searchRes = await AIToolsExecutor.executeTool('searchProduct', searchArgs);
        toolCalls.push({ toolName: 'searchProduct', arguments: searchArgs, result: searchRes });
        if (!searchRes.found || searchRes.results.length === 0) {
            const naturalResponse = isArabic
                ? `لم أتمكن من العثور على الدواء "${detectedDrugQuery || trimmed}" في قاعدة بيانات الأدوية. يرجى التحقق من صحة الاسم أو البحث في الفهرس.`
                : `I could not find the medication "${detectedDrugQuery || trimmed}" in the Drug Knowledge Database. Please verify the spelling or search the full catalog.`;
            return {
                intent: 'PRODUCT_NOT_FOUND',
                language: isArabic ? 'ar' : 'en',
                query: userQuery,
                toolCalls,
                similarProductsFound: [],
                naturalResponse,
                safetyDisclaimer: 'This system is an informational clinical tool. Pharmacist review is required.',
                requiresPharmacistReview: false
            };
        }
        const matchedProduct = searchRes.results[0];
        // 2. Tool Call: checkPharmacyInventory
        const invArgs = { productId: matchedProduct.id };
        const invRes = await AIToolsExecutor.executeTool('checkPharmacyInventory', invArgs);
        toolCalls.push({ toolName: 'checkPharmacyInventory', arguments: invArgs, result: invRes });
        let similarCandidates = [];
        // 3. Tool Call: If out of stock, find available similar products
        if (!invRes.isAvailableInStock) {
            const simArgs = { targetProductId: matchedProduct.id };
            const simRes = await AIToolsExecutor.executeTool('getAvailableSimilarProducts', simArgs);
            toolCalls.push({ toolName: 'getAvailableSimilarProducts', arguments: simArgs, result: simRes });
            similarCandidates = simRes.candidates || [];
        }
        // 4. Construct Natural Language Clinical Response
        let naturalResponse = '';
        const disclaimer = isArabic
            ? 'تنبيه سريري: هذه الاقتراحات مبنية على تطابق المادة الفعالة الرئيسية فقط وليست بديلاً تلقائياً. يجب مراجعة الصيدلي للجرعة والشكل الصيدلي وحالة المريض.'
            : 'Clinical Note: These candidate products share the same primary active ingredient. They are not automatic clinical substitutions. Professional pharmacist verification of dosage, formulation, and clinical factors is required.';
        if (invRes.isAvailableInStock) {
            naturalResponse = isArabic
                ? `المنتج "${matchedProduct.productName}" متوفر حالياً في الصيدلية (الكمية المتاحة: ${invRes.availableQuantity} عبوة - السعر: ${invRes.price} ${invRes.currency} - مكان التخزين: ${invRes.storageLocation}).`
                : `Product "${matchedProduct.productName}" is currently AVAILABLE in inventory (${invRes.availableQuantity} units in stock - Price: ${invRes.price} ${invRes.currency} - Location: ${invRes.storageLocation}).`;
        }
        else {
            if (similarCandidates.length > 0) {
                const topCandidatesSummary = similarCandidates.slice(0, 3).map((c, idx) => {
                    return `${idx + 1}. **${c.productName}** (${c.dosageForm}) - المتاح: ${c.availableQuantity} عبوة | نسبة التطابق: ${c.percentageScore}% (${c.similarityLevel})`;
                }).join('\n');
                const topCandidatesSummaryEn = similarCandidates.slice(0, 3).map((c, idx) => {
                    return `${idx + 1}. **${c.productName}** (${c.dosageForm}) - In Stock: ${c.availableQuantity} units | Match: ${c.percentageScore}% (${c.similarityLevel})`;
                }).join('\n');
                if (isArabic) {
                    naturalResponse = `المنتج المطلوب **${matchedProduct.productName}** غير متوفر حالياً في المخزن.\n\nبناءً على المادة الفعالة الرئيسية (**${matchedProduct.primaryIngredient}**)، تم العثور على ${similarCandidates.length} منتجات بديلة متوفرة في صيدليتك:\n\n${topCandidatesSummary}\n\nيرجى مراجعة التفاصيل والموافقة الصيدلانية قبل الصرف.`;
                }
                else {
                    naturalResponse = `The requested product **${matchedProduct.productName}** is currently OUT OF STOCK.\n\nBased on the primary active ingredient (**${matchedProduct.primaryIngredient}**), I identified ${similarCandidates.length} potentially similar candidate(s) currently available in your pharmacy:\n\n${topCandidatesSummaryEn}\n\nPlease review full formulation details and exercise clinical pharmacist judgment before substitution.`;
                }
            }
            else {
                naturalResponse = isArabic
                    ? `المنتج **${matchedProduct.productName}** غير متوفر حالياً في الصيدلية، ولم يتم العثور على أي منتج بديل متوفر في المخزن بنفس المادة الفعالة الرئيسية (${matchedProduct.primaryIngredient}).`
                    : `The requested product **${matchedProduct.productName}** is OUT OF STOCK, and no similar products with the same primary active ingredient (${matchedProduct.primaryIngredient}) were found in current inventory.`;
            }
        }
        return {
            intent: invRes.isAvailableInStock ? 'CHECK_INVENTORY_AVAILABLE' : 'FIND_SIMILAR_AVAILABLE_PRODUCT',
            language: isArabic ? 'ar' : 'en',
            query: userQuery,
            toolCalls,
            targetProduct: {
                id: matchedProduct.id,
                name: matchedProduct.productName,
                arabicName: matchedProduct.arabicName,
                inventoryStatus: invRes.status,
                availableQuantity: invRes.availableQuantity,
                primaryIngredient: matchedProduct.primaryIngredient
            },
            similarProductsFound: similarCandidates,
            naturalResponse,
            safetyDisclaimer: disclaimer,
            requiresPharmacistReview: true
        };
    }
}
