// Interactive Skeleton Builder — the approved catalogue (seed data).
//
// The live source of truth is the database (skeleton_items / skeleton_bundles,
// seeded from this file by supabase/migration_skeleton_1_tables.sql). This file
// is kept identical so tests can prove the seed matches the approved prices.
//
// Prices are the owner's supplied bone pricing brief, unchanged, with the
// owner's explicit decisions of 5 Nov 2026:
//   - Hyoid Bone ৳180 (the only price override).
//   - Foot Bones: one foot ৳1,550, both feet ৳3,100.
//   - Lumbar vertebrae L1–L5: ৳200 each when bought on their own.
//   - Pelvis Articulated (assembled: 2 hip bones + sacrum + coccyx): one price, ৳4,750.
//   - Half Set ৳16,300 and Full Set ৳23,500 (both legs). Both sets also include
//     any two lumbar vertebrae (the workshop chooses which).
//   - Manubrium stays unavailable until a real product exists.
// Weights are the existing shop product weights (they drive the delivery
// charge exactly as today).
//
// kind:  paired  — has a left and a right; Half = one side, Full = both sides
//        single  — midline bone, one piece, one price
//        grouped — an assembled/grouped product with one price
//        pool    — "any N of these" (used only inside the sets)
// meshes: 3D object names in public/models/skeleton-*.glb, per side (L/R) or S.

export const SECTIONS = [
  { key: 'head', name_en: 'Head & Neck', name_bn: 'মাথা ও ঘাড়' },
  { key: 'upper', name_en: 'Suprex (Upper Limb)', name_bn: 'সুপ্রেক্স (ঊর্ধ্ব অঙ্গ)' },
  { key: 'abdomen', name_en: 'Abdomen & Pelvic Region', name_bn: 'উদর ও পেলভিক অঞ্চল' },
  { key: 'lower', name_en: 'Infrex (Lower Limb)', name_bn: 'ইনফ্রেক্স (নিম্ন অঙ্গ)' },
  { key: 'thorax', name_en: 'Thorax', name_bn: 'থোরাক্স (বক্ষ)' },
]

const P = (L, R) => ({ L: [L], R: [R] })
const S = (...names) => ({ S: names })

let sort = 0
const it = (key, section, grp, name_en, name_bn, kind, half, full, weight, meshes, extra = {}) => ({
  key, section, grp, name_en, name_bn, kind,
  half_price: half, full_price: full, weight_kg: weight, meshes,
  aliases: extra.aliases || {}, pool_of: extra.pool_of || null,
  product_slug: extra.slug || null, note_en: extra.note_en || '', note_bn: extra.note_bn || '',
  is_active: extra.active !== false, is_available: extra.available !== false, listed: extra.listed !== false,
  sort: (sort += 10),
})

const SKULL_VAULT = ['frontal', 'parietal_L', 'parietal_R', 'occipital', 'temporal_L', 'temporal_R', 'sphenoid', 'ethmoid']
const SKULL_BASE = ['occipital', 'temporal_L', 'temporal_R', 'sphenoid', 'ethmoid']

export const ITEMS = [
  // ---- Head & Neck --------------------------------------------------------
  it('base_vault', 'head', 'Base', 'Base of the skull with vault', 'বেস অব দ্য স্কাল (ভল্টসহ)', 'grouped', 4100, null, 0.763, S(...SKULL_VAULT),
    { slug: 'base-of-the-skull-with-vault', note_en: 'One assembled model of the skull base and vault.', note_bn: 'খুলির বেস ও ভল্টের একটি সম্পূর্ণ মডেল।' }),
  it('base_only', 'head', 'Base', 'Only Base of the skull', 'বেস অব দ্য স্কাল (ভল্ট ছাড়া)', 'grouped', 3000, null, 0.3, S(...SKULL_BASE),
    { slug: 'base-of-the-skull-without-vault', note_en: 'One model of the skull base, without the vault.', note_bn: 'ভল্ট ছাড়া খুলির বেসের একটি মডেল।' }),
  it('mandible', 'head', 'Skull Bones', 'Mandible', 'ম্যান্ডিবল', 'single', 350, 350, 0.2, S('mandible'), { slug: 'mandible' }),
  it('maxilla', 'head', 'Skull Bones', 'Maxilla', 'ম্যাক্সিলা', 'paired', 250, 500, 0.122, P('maxilla_L', 'maxilla_R'), { slug: 'maxilla-left-right' }),
  it('occipital', 'head', 'Skull Bones', 'Occipital', 'অক্সিপিটাল বোন', 'single', 550, 550, 0.172, S('occipital'), { slug: 'occipital-bone' }),
  it('frontal', 'head', 'Skull Bones', 'Frontal', 'ফ্রন্টাল বোন', 'single', 450, 450, 0.155, S('frontal'), { slug: 'frontal-bone' }),
  it('temporal', 'head', 'Skull Bones', 'Temporal', 'টেম্পোরাল বোন', 'paired', 450, 900, 0.155, P('temporal_L', 'temporal_R'), { slug: 'temporal-bone' }),
  it('parietal', 'head', 'Skull Bones', 'Parietal', 'প্যারাইটাল বোন', 'paired', 450, 900, 0.155, P('parietal_L', 'parietal_R'), { slug: 'parietal-bone-left-right' }),
  it('sphenoid', 'head', 'Skull Bones', 'Sphenoid', 'স্ফেনয়েড বোন', 'single', 700, 700, 0.197, S('sphenoid'), { slug: 'sphenoid-bone' }),
  it('ethmoid', 'head', 'Skull Bones', 'Ethmoid', 'এথময়েড বোন', 'single', 100, 100, 0.097, S('ethmoid'),
    { slug: 'ethmoid-bone', note_en: 'Sits deep inside the skull — easiest to pick from the list.', note_bn: 'খুলির ভেতরে থাকে — তালিকা থেকে বেছে নেওয়া সহজ।' }),
  it('hyoid', 'head', 'Vertebrae & Hyoid', 'Hyoid Bone', 'হায়য়েড বোন', 'single', 180, 180, 0.093, S('hyoid'), { slug: 'hyoid-bone' }),
  it('atlas', 'head', 'Vertebrae & Hyoid', 'Atlas (C1 vertebra)', 'অ্যাটলাস (C1 ভার্টিব্রা)', 'single', 150, 150, 0.105, S('c1'), { slug: 'atlas-c1-vertebra' }),
  it('axis', 'head', 'Vertebrae & Hyoid', 'Axis (C2 vertebra)', 'অ্যাক্সিস (C2 ভার্টিব্রা)', 'single', 150, 150, 0.105, S('c2'), { slug: 'axis-c2-vertebra' }),
  it('c3', 'head', 'Vertebrae & Hyoid', 'C3 Vertebra (typical cervical)', 'C3 ভার্টিব্রা (টিপিক্যাল সার্ভাইক্যাল)', 'single', 150, 150, 0.105, S('c3'), { slug: 'c3-vertebra' }),
  it('c4', 'head', 'Vertebrae & Hyoid', 'C4 Vertebra (typical cervical)', 'C4 ভার্টিব্রা (টিপিক্যাল সার্ভাইক্যাল)', 'single', 150, 150, 0.105, S('c4'), { slug: 'c4-vertebra' }),
  it('c5', 'head', 'Vertebrae & Hyoid', 'C5 Vertebra (typical cervical)', 'C5 ভার্টিব্রা (টিপিক্যাল সার্ভাইক্যাল)', 'single', 150, 150, 0.105, S('c5'), { slug: 'c5-vertebra' }),
  it('c6', 'head', 'Vertebrae & Hyoid', 'C6 Vertebra (typical cervical)', 'C6 ভার্টিব্রা (টিপিক্যাল সার্ভাইক্যাল)', 'single', 150, 150, 0.105, S('c6'), { slug: 'c6-vertebra' }),
  it('c7', 'head', 'Vertebrae & Hyoid', 'C7 Vertebra', 'C7 ভার্টিব্রা', 'single', 150, 150, 0.105, S('c7'), { slug: 'c7-vertebra' }),

  // ---- Suprex (Upper Limb) ------------------------------------------------
  it('scapula', 'upper', 'Shoulder Girdle', 'Scapula', 'স্ক্যাপুলা', 'paired', 380, 760, 0.15, P('scapula_L', 'scapula_R'), { slug: 'scapula-leftright' }),
  it('clavicle', 'upper', 'Shoulder Girdle', 'Clavicle Bone', 'ক্ল্যাভিকল', 'paired', 250, 480, 0.15, P('clavicle_L', 'clavicle_R'), { slug: 'clavicle-bone-leftright' }),
  it('humerus', 'upper', 'Arm', 'Humerus', 'হিউমেরাস', 'paired', 650, 1300, 0.2, P('humerus_L', 'humerus_R'), { slug: 'humerus' }),
  it('radius', 'upper', 'Forearm', 'Radius', 'রেডিয়াস', 'paired', 360, 720, 0.15, P('radius_L', 'radius_R'), { slug: 'radius' }),
  it('ulna', 'upper', 'Forearm', 'Ulna', 'আলনা', 'paired', 360, 720, 0.15, P('ulna_L', 'ulna_R'), { slug: 'ulna' }),
  it('wrist', 'upper', 'Hand', 'Wrist Bones', 'কব্জি ও হাতের হাড়', 'paired', 1000, 1850, 0.25, P('hand_L', 'hand_R'),
    { slug: 'wrist-bones-one-hand', note_en: 'The complete hand: carpals, metacarpals and phalanges.', note_bn: 'সম্পূর্ণ হাত: কার্পাল, মেটাকার্পাল ও ফ্যালাঞ্জেস।' }),

  // ---- Abdomen & Pelvic Region -------------------------------------------
  it('sacrum', 'abdomen', 'Pelvic Girdle', 'Sacrum', 'স্যাক্রাম', 'single', 1000, 1000, 0.2, S('sacrum'), { slug: 'sacrum' }),
  it('coccyx', 'abdomen', 'Pelvic Girdle', 'Coccyx', 'কক্সিক্স', 'single', 120, 120, 0.15, S('coccyx'), { slug: 'coccyx' }),
  it('hip', 'abdomen', 'Pelvic Girdle', 'Hip Bone (Female)', 'হিপ বোন (নারী)', 'paired', 1800, 3600, 0.25, P('hip_L', 'hip_R'),
    { slug: 'hip-bone-female', note_en: 'A loose hip bone. The assembled pelvis is a separate product.', note_bn: 'আলাদা একটি হিপ বোন। জোড়া লাগানো পেলভিস আলাদা পণ্য।' }),
  it('pelvis', 'abdomen', 'Pelvic Girdle', 'Pelvis Articulated', 'পেলভিস (আর্টিকুলেটেড)', 'grouped', 4750, null, 0.8, S('hip_L', 'hip_R', 'sacrum', 'coccyx'),
    { slug: 'pelvis-articulated', note_en: 'Assembled with all joints: 2 hip bones, sacrum and coccyx in one model.', note_bn: 'সব জয়েন্টসহ জোড়া লাগানো: ২টি হিপ বোন, স্যাক্রাম ও কক্সিক্স একসাথে।' }),
  it('l1', 'abdomen', 'Lumbar Vertebrae', 'L1 Vertebra', 'L1 ভার্টিব্রা', 'single', 200, 200, 0.15, S('l1'), { slug: 'l1-vertebra' }),
  it('l2', 'abdomen', 'Lumbar Vertebrae', 'L2 Vertebra', 'L2 ভার্টিব্রা', 'single', 200, 200, 0.15, S('l2'), { slug: 'l2-vertebra' }),
  it('l3', 'abdomen', 'Lumbar Vertebrae', 'L3 Vertebra', 'L3 ভার্টিব্রা', 'single', 200, 200, 0.15, S('l3'), { slug: 'l3-vertebra' }),
  it('l4', 'abdomen', 'Lumbar Vertebrae', 'L4 Vertebra', 'L4 ভার্টিব্রা', 'single', 200, 200, 0.15, S('l4'), { slug: 'l4-vertebra' }),
  it('l5', 'abdomen', 'Lumbar Vertebrae', 'L5 Vertebra', 'L5 ভার্টিব্রা', 'single', 200, 200, 0.15, S('l5'), { slug: 'l5-vertebra' }),
  it('lumbar_any', 'abdomen', 'Lumbar Vertebrae', 'Any lumbar vertebra (we choose)', 'যেকোনো লাম্বার ভার্টিব্রা (আমরা বেছে দেব)', 'pool', 200, 200, 0.15, S('l3', 'l4'),
    { pool_of: ['l1', 'l2', 'l3', 'l4', 'l5'], listed: false }),

  // ---- Infrex (Lower Limb) -----------------------------------------------
  it('femur', 'lower', 'Lower Limb', 'Femur', 'ফিমার', 'paired', 1640, 3200, 0.353, P('femur_L', 'femur_R'), { slug: 'femur' }),
  it('tibia', 'lower', 'Lower Limb', 'Tibia', 'টিবিয়া', 'paired', 1540, 3000, 0.2, P('tibia_L', 'tibia_R'), { slug: 'tibia' }),
  it('fibula', 'lower', 'Lower Limb', 'Fibula', 'ফিবুলা', 'paired', 820, 1600, 0.15, P('fibula_L', 'fibula_R'), { slug: 'fibula' }),
  it('patella', 'lower', 'Lower Limb', 'Patella', 'প্যাটেলা', 'paired', 100, 180, 0.15, P('patella_L', 'patella_R'), { slug: 'patella' }),
  it('foot', 'lower', 'Lower Limb', 'Foot Bones', 'পায়ের পাতার হাড় (ফুট বোনস)', 'paired', 1550, 3100, 0.3, P('foot_L', 'foot_R'),
    { slug: 'foot-bones', note_en: 'One complete foot: tarsals, metatarsals and phalanges.', note_bn: 'একটি সম্পূর্ণ পায়ের পাতা: টারসাল, মেটাটারসাল ও ফ্যালাঞ্জেস।' }),

  // ---- Thorax --------------------------------------------------------------
  it('sternum', 'thorax', 'Sternum & Ribs', 'Sternum', 'স্টার্নাম', 'single', 350, 350, 0.15, S('sternum_body', 'manubrium', 'xiphoid'),
    { slug: 'sternum', note_en: 'Includes manubrium, body and xiphoid process.', note_bn: 'ম্যানুব্রিয়াম, বডি ও জিফয়েড প্রসেসসহ।' }),
  it('manubrium', 'thorax', 'Sternum & Ribs', 'Manubrium', 'ম্যানুব্রিয়াম', 'single', 100, 100, 0.15, S('manubrium'),
    { active: false, available: false, note_en: 'Not available yet.', note_bn: 'এখনো পাওয়া যাচ্ছে না।' }),
  it('typical_rib', 'thorax', 'Sternum & Ribs', 'Typical Rib', 'টিপিক্যাল রিব', 'paired', 210, 420, 0.15, P('rib_06_L', 'rib_06_R'),
    {
      slug: 'typical-rib-leftright',
      aliases: Object.fromEntries(['03', '04', '05', '07', '08', '09'].flatMap((n) => [[`rib_${n}_L`, 'L'], [`rib_${n}_R`, 'R']])),
      note_en: 'One typical rib (3rd–9th) per side. The 3D view shows rib 6 as the example.',
      note_bn: 'প্রতি পাশে একটি টিপিক্যাল রিব (৩য়–৯ম)। ৩ডি ভিউতে উদাহরণ হিসেবে ৬ নম্বর রিব দেখানো হয়।',
    }),
  it('rib1', 'thorax', 'Sternum & Ribs', 'Atypical Rib 1', 'অ্যাটিপিক্যাল রিব ১', 'paired', 200, 400, 0.15, P('rib_01_L', 'rib_01_R'), { slug: 'atypical-rib-1-leftright' }),
  it('rib2', 'thorax', 'Sternum & Ribs', 'Atypical Rib 2', 'অ্যাটিপিক্যাল রিব ২', 'paired', 340, 680, 0.15, P('rib_02_L', 'rib_02_R'), { slug: 'atypical-rib-2-leftright' }),
  it('rib11', 'thorax', 'Sternum & Ribs', 'Atypical Rib 11', 'অ্যাটিপিক্যাল রিব ১১', 'paired', 150, 300, 0.15, P('rib_11_L', 'rib_11_R'), { slug: 'atypical-rib-11-leftright' }),
  ...Array.from({ length: 12 }, (_, i) => it(`th${i + 1}`, 'thorax', 'Thoracic Vertebrae', `Th${i + 1} Vertebra`, `Th${i + 1} ভার্টিব্রা`, 'single', 180, 180, 0.15, S(`th${i + 1}`), { slug: `th${i + 1}-vertebra` })),
]

// The two sets. Exactly the owner's inclusion list, plus any two lumbar
// vertebrae (owner's decision). "half" = one side of each paired bone,
// "full" = both sides (the Full Set includes both legs).
const SET_KEYS = ['mandible', 'maxilla', 'occipital', 'frontal', 'temporal', 'parietal', 'sphenoid', 'ethmoid', 'hyoid', 'atlas', 'axis',
  'scapula', 'clavicle', 'humerus', 'radius', 'ulna', 'wrist',
  'sacrum', 'coccyx', 'hip',
  'femur', 'tibia', 'fibula', 'patella', 'foot',
  'sternum', 'typical_rib', 'rib1', 'rib2', 'rib11', 'th4', 'th5']

function setItems(paired) {
  const kind = Object.fromEntries(ITEMS.map((i) => [i.key, i.kind]))
  return [
    ...SET_KEYS.map((k) => ({ item_key: k, mode: kind[k] === 'paired' ? paired : 'single', qty: 1 })),
    { item_key: 'lumbar_any', mode: 'pool', qty: 2 },
  ]
}

export const BUNDLES = [
  { key: 'half', name_en: 'Complete Half Set', name_bn: 'কমপ্লিট হাফ সেট', price: 16300, weight_kg: 2.797, is_active: true, product_slug: 'half-set-bones', items: setItems('half') },
  { key: 'full', name_en: 'Complete Full Set', name_bn: 'কমপ্লিট ফুল সেট', price: 23500, weight_kg: 3.997, is_active: true, product_slug: 'full-set-bones', items: setItems('full') },
]

// 3D objects shown for context only (never selectable or sold).
export const CONTEXT_MESHES = ['ctx_face', 'ctx_cartilage', 'rib_10_L', 'rib_10_R', 'rib_12_L', 'rib_12_R']

export const SKELETON_CATALOG = { sections: SECTIONS, items: ITEMS, bundles: BUNDLES, context: CONTEXT_MESHES }
