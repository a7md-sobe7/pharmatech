import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // ─── Brand & Navigation ───────────────────────────────────────────────────
  'app.name': { en: 'PharmaMatch AI', ar: 'فارما ماتش AI' },
  'app.subtitle': { en: 'Pharmacy Intelligence & Similarity Platform', ar: 'منصة الذكاء الصيدلاني وبدائل الأدوية' },
  'nav.dashboard': { en: 'Dashboard', ar: 'لوحة القيادة' },
  'nav.search': { en: 'Similarity Search', ar: 'بحث البدائل' },
  'nav.shortages': { en: 'Shortages', ar: 'النواقص' },
  'nav.catalog': { en: 'Drug Knowledge DB', ar: 'دليل الأدوية' },
  'nav.inventory': { en: 'Inventory', ar: 'المخزون' },
  'nav.admin': { en: 'Admin Center', ar: 'لوحة الإدارة' },
  'role.pharmacist': { en: 'Pharmacist', ar: 'صيدلي' },
  'role.admin': { en: 'Admin', ar: 'مدير النظام' },

  // ─── Common Actions & Labels ──────────────────────────────────────────────
  'common.search': { en: 'Search', ar: 'بحث' },
  'common.filter': { en: 'Filter', ar: 'تصفية' },
  'common.all': { en: 'All', ar: 'الكل' },
  'common.save': { en: 'Save Changes', ar: 'حفظ التعديلات' },
  'common.saving': { en: 'Saving…', ar: 'جاري الحفظ…' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'common.delete': { en: 'Delete', ar: 'حذف' },
  'common.edit': { en: 'Edit', ar: 'تعديل' },
  'common.close': { en: 'Close', ar: 'إغلاق' },
  'common.view': { en: 'View Details', ar: 'عرض التفاصيل' },
  'common.actions': { en: 'Actions', ar: 'إجراءات' },
  'common.status': { en: 'Status', ar: 'الحالة' },
  'common.loading': { en: 'Loading…', ar: 'جاري التحميل…' },
  'common.done': { en: 'Done', ar: 'تم' },
  'common.yes': { en: 'Yes', ar: 'نعم' },
  'common.no': { en: 'No', ar: 'لا' },
  'common.total': { en: 'Total', ar: 'الإجمالي' },
  'common.currency': { en: 'EGP', ar: 'ج.م' },
  'common.units': { en: 'Units', ar: 'وحدة' },
  'common.quickSuggestions': { en: 'Quick Suggestions', ar: 'اقتراحات سريعة' },
  'common.processing': { en: 'Processing…', ar: 'جاري المعالجة…' },

  // ─── Status Badges ────────────────────────────────────────────────────────
  'status.available': { en: 'Available', ar: 'متوفر' },
  'status.lowStock': { en: 'Low Stock', ar: 'أوشك على النفاد' },
  'status.outOfStock': { en: 'Out of Stock', ar: 'غير متوفر' },
  'status.expired': { en: 'Expired', ar: 'منتهي الصلاحية' },
  'status.discontinued': { en: 'Discontinued', ar: 'ملغي' },
  'status.pending': { en: 'Pending', ar: 'قيد الانتظار' },
  'status.ordered': { en: 'Ordered', ar: 'تم الطلب' },
  'status.resolved': { en: 'Resolved', ar: 'تم التوفير' },

  // ─── Urgency Levels ───────────────────────────────────────────────────────
  'urgency.critical': { en: 'Critical', ar: 'حرجة' },
  'urgency.high': { en: 'High', ar: 'عالية' },
  'urgency.medium': { en: 'Medium', ar: 'متوسطة' },

  // ─── Similarity Match Levels ──────────────────────────────────────────────
  'similarity.veryHigh': { en: 'Very High Match', ar: 'تطابق ممتاز' },
  'similarity.high': { en: 'High Similarity', ar: 'تطابق عالي' },
  'similarity.moderate': { en: 'Moderate Match', ar: 'تطابق متوسط' },
  'similarity.low': { en: 'Low Similarity', ar: 'تطابق منخفض' },
  'similarity.none': { en: 'Not Similar', ar: 'غير متطابق' },

  // ─── Dashboard ────────────────────────────────────────────────────────────
  'dashboard.hero.title': { en: 'Find Drug Alternatives Instantly', ar: 'اعثر على بدائل الأدوية فوراً' },
  'dashboard.hero.subtitle': {
    en: 'Search any out-of-stock medication to discover clinically verified substitutions based on active ingredients.',
    ar: 'ابحث عن أي دواء ناقص لاكتشاف البدائل الدوائية المعتمدة سريرياً والمطابقة للمادة الفعالة والتركيز.'
  },
  'dashboard.hero.placeholder': {
    en: 'Search drug name (e.g. Augmentin, كالماج)...',
    ar: 'ابحث باسم الدواء التجاري أو العلمي (مثل: أوجمنتين، كالماج)...'
  },
  'dashboard.hero.searchBtn': { en: 'Search', ar: 'بحث' },
  'dashboard.overview.title': { en: 'Pharmacy Overview', ar: 'نظرة عامة على الصيدلية' },
  'dashboard.stats.catalog': { en: 'Drug Catalog', ar: 'قاعدة الأدوية' },
  'dashboard.stats.inStock': { en: 'In Stock', ar: 'المتوفر بالمخزن' },
  'dashboard.stats.outOfStock': { en: 'Out of Stock', ar: 'المنتهي من المخزن' },
  'dashboard.stats.shortages': { en: 'Reported Shortages', ar: 'النواقص المسجلة' },
  'dashboard.actions.title': { en: 'Quick Actions', ar: 'إجراءات سريعة' },
  'dashboard.actions.reportShortage': { en: 'Report New Shortage', ar: 'تسجيل دواء ناقص' },
  'dashboard.actions.runSimilarity': { en: 'Run Similarity Search', ar: 'البحث عن بدائل دوائية' },
  'dashboard.actions.browseCatalog': { en: 'Browse Drug Catalog', ar: 'تصفح دليل الأدوية' },
  'dashboard.activity.title': { en: 'Recent Activity', ar: 'النشاط الأخير' },
  'dashboard.activity.empty': { en: 'No recent activity. Run a search to generate records.', ar: 'لا يوجد نشاط حديث. قم بعملية بحث لعرض السجلات.' },

  // ─── Search & Similarity Page ─────────────────────────────────────────────
  'search.title': { en: 'Drug Similarity & Alternative Finder', ar: 'محرك بحث ومطابقة بدائل الأدوية' },
  'search.subtitle': { en: 'Deterministic clinical substitution engine cross-referenced with real-time stock', ar: 'محرك سريري دقيق لمطابقة البدائل مع التحقق الفوري من توفرها بالمخزون' },
  'search.placeholder': {
    en: 'Search medicine by brand, generic, or Arabic name (e.g. Calmag, Augmentin, كتافلام)...',
    ar: 'ابحث عن الدواء بالاسم التجاري أو العلمي أو بالعربي (مثل: كالماج، أوجمنتين، كتافلام)...'
  },
  'search.filter.onlyAvailable': { en: 'Only In-Stock Alternatives', ar: 'عرض البدائل المتوفرة فقط' },
  'search.targetDrug': { en: 'Target Medication (Selected)', ar: 'الدواء المطلوب (المحدد)' },
  'search.activeIngredient': { en: 'Active Ingredient', ar: 'المادة الفعالة' },
  'search.dosageForm': { en: 'Dosage Form', ar: 'الشكل الصيدلاني' },
  'search.manufacturer': { en: 'Manufacturer', ar: 'الشركة المصنعة' },
  'search.strength': { en: 'Concentration / Strength', ar: 'التركيز / القوة' },
  'search.route': { en: 'Route of Administration', ar: 'طريقة الإعطاء' },
  'search.therapeuticClass': { en: 'Therapeutic Class', ar: 'المجموعة العلاجية' },
  'search.alternativesFound': { en: 'Available Alternatives Found', ar: 'البدائل المتاحة المطابقة' },
  'search.noAlternatives': { en: 'No matching alternatives found in the pharmacy stock.', ar: 'لم يتم العثور على بدائل متوفرة في مخزون الصيدلية.' },
  'search.compare': { en: 'Compare Formulations', ar: 'مقارنة التركيبات' },
  'search.monograph': { en: 'Full Monograph', ar: 'النشرة الدوائية' },
  'search.similarityScore': { en: 'Match Score', ar: 'نسبة التطابق' },
  'search.breakdown': { en: 'Similarity Breakdown & Explainability', ar: 'تفاصيل وتحليل التطابق السريري' },
  'search.pharmacistReview': { en: 'Pharmacist Review', ar: 'تقييم الصيدلي' },
  'search.logged': { en: 'Logged', ar: 'تم التسجيل' },
  'search.feedback.useful': { en: 'Useful', ar: 'بديل ملائم' },
  'search.feedback.notSuitable': { en: 'Not Suitable', ar: 'غير ملائم سريرياً' },
  'search.emptyStateTitle': { en: 'Search for Medication', ar: 'ابحث عن دواء' },
  'search.emptyStateDesc': {
    en: 'Enter the name of an unavailable medication to extract its primary active ingredient and discover available in-stock alternatives.',
    ar: 'أدخل اسم الدواء غير المتوفر لاستخراج المادة الفعالة واقتراح البدائل المتاحة في المخزون فوراً.'
  },
  'search.disclaimerTitle': { en: 'Mandatory Clinical Safety Notice', ar: 'إشعار السلامة الدوائية والسريرية' },
  'search.disclaimerText': {
    en: 'PharmaMatch AI identifies candidate medications based on shared primary active ingredient and deterministic structured attributes. The system does not issue autonomous prescription changes. Final substitution requires licensed pharmacist review of dosage, formulation excipients, patient renal/hepatic function, and doctor approval where mandated.',
    ar: 'يحدد نظام فارما ماتش البدائل المقترحة بناءً على تطابق المادة الفعالة الرئيسية والخصائص الدوائية الدقيقة. هذا النظام لا يُصدر أوامر صرف تلقائية، والمراجعة السريرية من قبل الصيدلي المرخص ضرورية وإلزامية.'
  },

  // ─── Comparison Modal ─────────────────────────────────────────────────────
  'comparison.title': { en: 'Side-by-Side Formulation Comparison', ar: 'مقارنة التركيبات الدوائية جنباً إلى جنب' },
  'comparison.subtitle': { en: 'Deterministic structured attribute cross-examination', ar: 'فحص سريري دقيق للخصائص والتركيبات الصيدلانية' },
  'comparison.requestedTarget': { en: 'Requested Target', ar: 'الدواء المطلوب' },
  'comparison.inStockAlternative': { en: 'In Stock Alternative', ar: 'البديل المتوفر' },
  'comparison.attribute': { en: 'Clinical Attribute', ar: 'الخاصية الدوائية' },
  'comparison.target': { en: 'Target', ar: 'المطلوب' },
  'comparison.candidate': { en: 'Candidate', ar: 'البديل المرشح' },
  'comparison.primaryIngredient': { en: 'Primary Active Ingredient (60% Weight)', ar: 'المادة الفعالة الرئيسية (وزن 60%)' },
  'comparison.strength': { en: 'Strength / Concentration (20% Weight)', ar: 'التركيز والقوة (وزن 20%)' },
  'comparison.dosageForm': { en: 'Dosage Form & Route (10% Weight)', ar: 'الشكل الدوائي وطريقة الإعطاء (وزن 10%)' },
  'comparison.secondaryIngredients': { en: 'Secondary Active Ingredients (10% Weight)', ar: 'المواد الفعالة الثانوية (وزن 10%)' },
  'comparison.singleAgent': { en: 'None (Single active agent)', ar: 'لا يوجد (مستحضر أحادي المادة)' },
  'comparison.shared': { en: 'shared', ar: 'مشترك' },
  'comparison.match': { en: 'match', ar: 'تطابق' },
  'comparison.overallScore': { en: 'Overall Deterministic Similarity Score:', ar: 'إجمالي نسبة التطابق الخوارزمي:' },
  'comparison.scorePrimary': { en: 'Primary Active', ar: 'المادة الفعالة' },
  'comparison.scoreStrength': { en: 'Strength', ar: 'التركيز' },
  'comparison.scoreForm': { en: 'Form', ar: 'الشكل' },
  'comparison.scoreSecondary': { en: 'Secondary', ar: 'المواد الثانوية' },
  'comparison.verificationNotice': {
    en: 'Pharmacist Verification Notice: This side-by-side comparison is an informational tool based on structured catalog properties. It does not replace clinical pharmacokinetics, patient allergy history, or practitioner prescription requirements.',
    ar: 'تنبيه تدقيق الصيدلي: هذه المقارنة أداة استرشادية مبنية على الخصائص المسجلة في الدليل، ولا تغني عن التقييم السريري الدوائي، أو حساسية المريض، أو الوصفة الطبية المعتمدة.'
  },
  'comparison.closeBtn': { en: 'Close Comparison', ar: 'إغلاق المقارنة' },

  // ─── Product Details / Monograph Modal ────────────────────────────────────
  'product.primaryIngredient': { en: 'Primary Active Ingredient', ar: 'المادة الفعالة الرئيسية' },
  'product.confidence': { en: 'Confidence', ar: 'مستوى الثقة' },
  'product.source': { en: 'Source', ar: 'المصدر' },
  'product.allIngredients': { en: 'Full Active Ingredients Breakdown', ar: 'التركيب التفصيلي للمواد الفعالة' },
  'product.ingredient': { en: 'Ingredient', ar: 'المادة' },
  'product.role': { en: 'Role', ar: 'الدور الدوائي' },
  'product.strength': { en: 'Strength', ar: 'التركيز' },
  'product.unspecified': { en: 'Unspecified', ar: 'غير محدد' },
  'product.indications': { en: 'Indications', ar: 'دواعي الاستعمال' },
  'product.contraindications': { en: 'Contraindications', ar: 'موانع الاستعمال' },
  'product.provenance': { en: 'Source Provenance', ar: 'المصدر المرجعي' },
  'product.lastVerified': { en: 'Last verified', ar: 'تاريخ آخر تدقيق' },
  'product.closeMonograph': { en: 'Close Monograph', ar: 'إغلاق النشرة' },

  // ─── Catalog Page ─────────────────────────────────────────────────────────
  'catalog.title': { en: 'Drug Knowledge Database', ar: 'دليل الأدوية المصري الشامل' },
  'catalog.subtitle': { en: 'Comprehensive Egyptian pharmaceutical formulations and scientific properties', ar: 'قاعدة بيانات شاملة لتركيبات وخصائص الأدوية المصرية المعتمدة' },
  'catalog.searchPlaceholder': { en: 'Search catalog by brand, active ingredient, or Arabic name...', ar: 'ابحث في الدليل بالاسم التجاري، المادة الفعالة، أو الاسم العربي...' },
  'catalog.table.product': { en: 'Product Name', ar: 'اسم الدواء' },
  'catalog.table.ingredient': { en: 'Primary Ingredient', ar: 'المادة الفعالة الرئيسية' },
  'catalog.table.form': { en: 'Dosage Form', ar: 'الشكل الدوائي' },
  'catalog.table.manufacturer': { en: 'Manufacturer', ar: 'الشركة المصنعة' },
  'catalog.table.stock': { en: 'Stock Status', ar: 'حالة التوفر' },
  'catalog.page': { en: 'Page', ar: 'صفحة' },
  'catalog.of': { en: 'of', ar: 'من' },
  'catalog.next': { en: 'Next', ar: 'التالي' },
  'catalog.previous': { en: 'Previous', ar: 'السابق' },

  // ─── Inventory Page ───────────────────────────────────────────────────────
  'inventory.title': { en: 'Pharmacy Inventory Management', ar: 'إدارة مخزون الصيدلية' },
  'inventory.subtitle': { en: 'Real-time shelf batches, quantities, expiration dates, and quarantine status', ar: 'متابعة الأرصدة، التشغيلات، تواريخ الصلاحية، وأماكن التخزين على الأرفف' },
  'inventory.searchPlaceholder': { en: 'Search batch, product name...', ar: 'ابحث برقم التشغيلة، اسم الدواء...' },
  'inventory.table.product': { en: 'Product / Arabic Name', ar: 'اسم المستحضر' },
  'inventory.table.batch': { en: 'Batch #', ar: 'رقم التشغيلة' },
  'inventory.table.quantity': { en: 'Available Stock', ar: 'الكمية المتاحة' },
  'inventory.table.price': { en: 'Price', ar: 'السعر' },
  'inventory.table.expiry': { en: 'Expiration Date', ar: 'تاريخ الصلاحية' },
  'inventory.table.location': { en: 'Shelf Location', ar: 'مكان التخزين' },
  'inventory.table.status': { en: 'Status', ar: 'الحالة' },

  // ─── Shortages Page (نواقص) ───────────────────────────────────────────────
  'shortages.title': { en: 'Pharmacy Shortages Center (النواقص)', ar: 'سجل نواقص الأدوية (النواقص)' },
  'shortages.subtitle': { en: 'Real-time drug shortages tracking, urgency prioritization, and replacement requests', ar: 'متابعة النواقص، تحديد أولويات التوفير، وإدارة طلبات البدائل' },
  'shortages.reportBtn': { en: 'Report Shortage', ar: 'تسجيل دواء ناقص' },
  'shortages.searchPlaceholder': { en: 'Search shortages list...', ar: 'ابحث في قائمة النواقص...' },
  'shortages.empty': { en: 'No shortage entries found', ar: 'لا توجد نواقص مسجلة حالياً' },
  'shortages.tab.all': { en: 'All Shortages', ar: 'جميع النواقص' },
  'shortages.tab.critical': { en: 'Critical', ar: 'حرجة جداً' },
  'shortages.tab.high': { en: 'High', ar: 'عالية الأولوية' },
  'shortages.tab.medium': { en: 'Medium', ar: 'متوسطة' },
  'shortages.tab.ordered': { en: 'Ordered', ar: 'تم طلبها' },
  'shortages.tab.resolved': { en: 'Resolved', ar: 'تم توفيرها' },
  'shortages.stats.total': { en: 'Total Shortages', ar: 'إجمالي النواقص' },
  'shortages.stats.critical': { en: 'Critical Deficits', ar: 'نواقص حرجة' },
  'shortages.stats.ordered': { en: 'Pending Orders', ar: 'طلبيات مرسلة' },
  'shortages.stats.resolved': { en: 'Resolved Items', ar: 'نواقص تم توفيرها' },
  'shortages.table.medicine': { en: 'Medicine Name', ar: 'اسم الدواء' },
  'shortages.table.needed': { en: 'Needed Qty', ar: 'الكمية المطلوبة' },
  'shortages.table.urgency': { en: 'Urgency', ar: 'درجة الأهمية' },
  'shortages.table.status': { en: 'Status', ar: 'حالة الطلب' },
  'shortages.table.reportedBy': { en: 'Reported By', ar: 'سجل بواسطة' },
  'shortages.table.date': { en: 'Date Added', ar: 'تاريخ التسجيل' },
  'shortages.modal.addTitle': { en: 'Report New Shortage', ar: 'تسجيل دواء ناقص جديد' },
  'shortages.modal.editTitle': { en: 'Edit Shortage Record', ar: 'تعديل بيانات الدواء الناقص' },
  'shortages.modal.medName': { en: 'Medicine Name', ar: 'اسم الدواء' },
  'shortages.modal.medPlaceholder': { en: 'Type medicine brand or generic name...', ar: 'اكتب اسم الدواء التجاري أو العلمي...' },
  'shortages.modal.concentration': { en: 'Concentration / Form', ar: 'التركيز / الشكل الدوائي' },
  'shortages.modal.currentQty': { en: 'Current Quantity on Shelf', ar: 'الرصيد المتبقي على الرف' },
  'shortages.modal.neededQty': { en: 'Needed Quantity (Units/Packs)', ar: 'الكمية المطلوبة (علب/وحدات)' },
  'shortages.modal.urgency': { en: 'Urgency Level', ar: 'مستوى الأولوية' },
  'shortages.modal.urgencyHint': { en: 'Urgency is auto-suggested based on this quantity', ar: 'يتم تحديد الأولوية تلقائياً وفقاً للكمية المطلوبة' },
  'shortages.modal.criticalDesc': { en: 'Critical shortage — immediate action required', ar: 'نقص حرج — يتطلب اتخاذ إجراء فوري' },
  'shortages.modal.highDesc': { en: 'High priority — order soon', ar: 'أولوية عالية — يجب الطلب قريباً' },
  'shortages.modal.mediumDesc': { en: 'Medium — monitor and plan order', ar: 'أولوية متوسطة — المتابعة والتخطيط للطلب' },
  'shortages.modal.notes': { en: 'Pharmacist Notes (Optional)', ar: 'ملاحظات الصيدلي (اختياري)' },
  'shortages.modal.submitAdd': { en: 'Add Shortage', ar: 'تسجيل النقص' },
  'shortages.modal.submitSave': { en: 'Save Changes', ar: 'حفظ التعديلات' },
  'shortages.delete.title': { en: 'Delete Entry?', ar: 'حذف هذا السجل؟' },
  'shortages.delete.desc': { en: 'This action cannot be undone.', ar: 'لا يمكن التراجع عن هذا الإجراء.' },
  'shortages.delete.confirm': { en: 'Yes, Delete', ar: 'نعم، تأكيد الحذف' },

  // ─── Admin Center ─────────────────────────────────────────────────────────
  'admin.title': { en: 'System Administration & Algorithm Weights', ar: 'لوحة التحكم وأوزان خوارزمية المطابقة' },
  'admin.subtitle': { en: 'Fine-tune clinical similarity weights and audit system activity logs', ar: 'تعديل معاملات مطابقة الأدوية ومتابعة سجلات التدقيق والمراجعة' },
  'admin.weights.title': { en: 'Similarity Algorithm Weight Configuration', ar: 'أوزان خوارزمية التطابق الصيدلاني' },
  'admin.weights.primary': { en: 'Primary Active Ingredient Match', ar: 'تطابق المادة الفعالة الرئيسية' },
  'admin.weights.strength': { en: 'Strength & Concentration Match', ar: 'تطابق التركيز والقوة' },
  'admin.weights.form': { en: 'Dosage Form Compatibility', ar: 'توافق الشكل الصيدلاني' },
  'admin.weights.secondary': { en: 'Secondary / Inactive Ingredients', ar: 'المواد الإضافية والمساندة' },
  'admin.weights.total': { en: 'Total Weight', ar: 'مجموع الأوزان' },
  'admin.weights.saved': { en: 'Weights Saved!', ar: 'تم حفظ الأوزان بنجاح!' },
  'admin.weights.mustEqual': { en: 'Must equal 100%', ar: 'يجب أن يساوي 100%' },
  'admin.logs.title': { en: 'Audit & Clinical Activity Logs', ar: 'سجل العمليات والنشاط السريري' },
  'admin.logs.timestamp': { en: 'Timestamp', ar: 'الوقت والتاريخ' },
  'admin.logs.action': { en: 'Action', ar: 'نوع العملية' },
  'admin.logs.user': { en: 'Pharmacist / User', ar: 'المستخدم / الصيدلي' },
  'admin.logs.target': { en: 'Target Drug / Entity', ar: 'المستحضر / الكيان' },
  'admin.logs.status': { en: 'Status', ar: 'الحالة' },
  'admin.feedback.title': { en: 'Pharmacist Substitution Acceptance', ar: 'معدل قبول الصيادلة للبدائل' },
  'admin.feedback.rate': { en: 'Acceptance Rate', ar: 'نسبة القبول' },

  // ─── Notifications & Web Push ─────────────────────────────────────────────
  'notif.title': { en: 'Notifications', ar: 'التنبيهات' },
  'notif.unread': { en: 'new', ar: 'جديد' },
  'notif.readAll': { en: 'Mark all as read', ar: 'تعليم الكل كمقروء' },
  'notif.markRead': { en: 'Mark read', ar: 'تم القراءة' },
  'notif.preferences': { en: 'Preferences', ar: 'الإعدادات' },
  'notif.empty': { en: 'No notifications yet', ar: 'لا توجد تنبيهات حالياً' },
  'notif.emptyDesc': { en: 'Real-time alerts will appear here as stock changes.', ar: 'ستظهر التنبيهات الفورية هنا عند تغير المخزون أو الصلاحية.' },
  'notif.enablePush': { en: 'Enable Push Notifications', ar: 'تفعيل إشعارات المتصفح' },
  'notif.pushActive': { en: 'Push alerts enabled', ar: 'إشعارات المتصفح مفعلة' },
  'notif.banner.title': { en: 'Enable Real-time Pharmacy Push Alerts', ar: 'تفعيل إشعارات المتصفح الفورية للصيدلية' },
  'notif.banner.desc': {
    en: 'Receive instant alerts for low stock thresholds, out-of-stock medicines, and expiry dates even when the tab is closed.',
    ar: 'احصل على إشعارات فورية عند نقص الأدوية أو انتهاء المخزون وتواريخ الصلاحية حتى في حال إغلاق التبويب.'
  },
  'notif.banner.btn': { en: 'Enable Notifications', ar: 'تفعيل الإشعارات' },
  'notif.banner.later': { en: 'Not Now', ar: 'ليس الآن' },
  'notif.settings.title': { en: 'Notification Preferences', ar: 'تفضيلات الإشعارات' },
  'notif.settings.subtitle': { en: 'Customize browser push and alert triggers', ar: 'تخصيص تنبيهات المتصفح وفئات الإشعارات' },
  'notif.settings.masterPush': { en: 'Browser Push Notifications', ar: 'إشعارات المتصفح (Web Push)' },
  'notif.settings.enableAll': { en: 'Enable All', ar: 'تفعيل الكل' },
  'notif.settings.disableAll': { en: 'Disable All', ar: 'تعطيل الكل' },
  'notif.settings.categories': { en: 'Alert Categories', ar: 'فئات التنبيهات' },
  'notif.settings.test': { en: 'Test Web Push Delivery', ar: 'اختبار وصول الإشعارات' },
  'notif.settings.testDesc': {
    en: 'Trigger instant test notifications to verify system push banners in your operating system.',
    ar: 'أرسل إشعاراً تجريبياً فورياً للتحقق من ظهور تنبيهات النظام في المتصفح ونظام التشغيل.'
  },
  'notif.settings.lowStockTitle': { en: 'Low Stock Alerts', ar: 'تنبيهات اقتراب نفاد المخزون' },
  'notif.settings.lowStockDesc': { en: 'Notify when medicine quantity drops below minimum threshold', ar: 'إشعار فوري عند انخفاض رصيد الدواء عن حد إعادة الطلب' },
  'notif.settings.outOfStockTitle': { en: 'Out of Stock Alerts', ar: 'تنبيهات نفاد المخزون تماماً' },
  'notif.settings.outOfStockDesc': { en: 'Critical alert when inventory drops to zero', ar: 'تنبيه حرج عند وصول رصيد أي مستحضر إلى الصفر' },
  'notif.settings.expiryTitle': { en: 'Medicine Expiry Warnings', ar: 'تنبيهات تواريخ الصلاحية' },
  'notif.settings.expiryDesc': { en: 'Alerts at 30, 14, 7 days before batch expiration and on expiry', ar: 'تنبيهات قبل 30 و14 و7 أيام من انتهاء التشغيلة وعند انتهائها' },
  'notif.settings.shiftTitle': { en: 'Shift & Handover Notices', ar: 'إشعارات تسليم الشيفت والورديات' },
  'notif.settings.shiftDesc': { en: 'Handover notifications and shift-specific alerts', ar: 'تنبيهات تسليم العهدة وملاحظات الشيفت' },
  'notif.settings.adminTitle': { en: 'Administrative & Security Alerts', ar: 'تنبيهات الإدارة والأمان' },
  'notif.settings.adminDesc': { en: 'New registrations, severe shortages, and system errors', ar: 'تسجيل مستخدمين جدد، نواقص حرجة، وأخطاء النظام' },
  'notif.settings.salesTitle': { en: 'Sales & Inventory Transactions', ar: 'حركات البيع والتحويلات المخزنية' },
  'notif.settings.salesDesc': { en: 'Alerts when large orders or stock sales occur', ar: 'إشعارات عند إتمام مبيعات كبرى أو حركات مخزن' },
  'notif.settings.masterActive': { en: 'Active and receiving background alerts', ar: 'مفعلة وتستقبل التنبيهات الفورية في الخلفية' },
  'notif.settings.masterInactive': { en: 'Inactive on this device', ar: 'غير مفعلة على هذا الجهاز' },
  'notif.settings.masterBlocked': { en: 'Blocked by browser permissions', ar: 'محظورة في إعدادات المتصفح' },
  'notif.settings.disablePush': { en: 'Disable Push', ar: 'تعطيل الإشعارات' },
  'notif.settings.enablePush': { en: 'Enable Push', ar: 'تفعيل الإشعارات' },
  'notif.settings.blockedNotice': {
    en: 'Notifications are blocked in your browser settings. To receive push alerts, please click the lock/settings icon in your browser address bar and allow notifications.',
    ar: 'الإشعارات محظورة في إعدادات المتصفح. لاستقبال التنبيهات، يرجى النقر على أيقونة القفل في شريط العنوان والسماح بالإشعارات.'
  },
  'notif.settings.testLowStock': { en: 'Test Low Stock', ar: 'تجربة نقص المخزون' },
  'notif.settings.testOutOfStock': { en: 'Test Out of Stock', ar: 'تجربة نفاد المخزون' },
  'notif.settings.testExpiry': { en: 'Test Expiry Warning', ar: 'تجربة تنبيه الصلاحية' },
  'notif.settings.testAdmin': { en: 'Test Admin Alert', ar: 'تجربة تنبيه إداري' },

  // ─── Medical Safety Disclaimer ────────────────────────────────────────────
  'disclaimer.banner': {
    en: 'Medical Safety Principle: System similarity matches are based on structured primary active ingredient rules and are NOT autonomous substitution orders. Pharmacist verification is mandatory.',
    ar: 'مبدأ السلامة الدوائية: اقتراحات النظام مبنية على تطابق المادة الفعالة الرئيسية فقط وليست أمراً تلقائياً بالصرف. المراجعة السريرية للصيدلي إلزامية.'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('pharmamatch_lang') as Language) || 'ar'; // Default to Arabic or saved
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('pharmamatch_lang', language);
  }, [language, isRTL]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
