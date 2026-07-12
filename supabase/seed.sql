-- Optional sample data. Run AFTER schema.sql. Replace image_url with real Storage URLs later.
insert into public.products (name, slug, price, description, category, tags, image_url, in_stock)
values
  ('Human Skull Anatomical Model', 'human-skull-anatomical-model', 1200, 'Life-size 3D printed human skull with removable calvaria. Great for medical and dental students.', 'bone-models', array['skull','anatomy','medical','study','bone'], array[]::text[], true),
  ('Human Heart Cross-Section Model', 'human-heart-cross-section-model', 950, 'Detailed heart model showing chambers, valves and major vessels. Custom colours available.', 'bone-models', array['heart','anatomy','medical','organ','study'], array[]::text[], true),
  ('Vertebral Column Segment', 'vertebral-column-segment', 800, 'Five-vertebra lumbar spine segment with intervertebral discs. Useful for physiotherapy demos.', 'bone-models', array['spine','vertebra','anatomy','physio','bone'], array[]::text[], true),
  ('Custom Name Keyring', 'custom-name-keyring', 150, 'Personalised keyring with any name or short text in Bangla or English. Choose your colour.', 'keyrings', array['keyring','custom','name','gift','personalised'], array[]::text[], true),
  ('Logo Keyring (Bulk)', 'logo-keyring-bulk', 120, 'Your business logo printed as a durable keyring. Bulk pricing for 25+ pieces.', 'keyrings', array['keyring','logo','business','bulk','promo'], array[]::text[], true),
  ('Geometric Planter Pot', 'geometric-planter-pot', 450, 'Low-poly geometric planter with drainage tray, for succulents and small plants.', 'home-decor', array['planter','pot','decor','plant','geometric'], array[]::text[], true),
  ('Spiral Table Lamp Shade', 'spiral-table-lamp-shade', 700, 'Sculptural spiral lampshade that casts a warm patterned glow. Fits standard E27 holders.', 'home-decor', array['lamp','light','decor','spiral','home'], array[]::text[], true),
  ('Personalised Photo Frame', 'personalised-photo-frame', 350, 'Custom photo frame with a name or date printed into the border. A thoughtful gift.', 'gifts', array['frame','photo','gift','custom','personalised'], array[]::text[], true),
  ('Miniature Articulated Dragon', 'miniature-articulated-dragon', 550, 'Fully articulated print-in-place dragon that bends and poses — no assembly needed.', 'gifts', array['dragon','toy','articulated','fidget','gift'], array[]::text[], false),
  ('Adjustable Phone Stand', 'adjustable-phone-stand', 280, 'Foldable desk phone stand with adjustable viewing angle. Sturdy and lightweight.', 'miscellaneous', array['phone','stand','desk','gadget','accessory'], array[]::text[], true),
  ('Cable Organizer Clips (Set of 6)', 'cable-organizer-clips-set', 180, 'Set of six adhesive-backed cable clips to keep charging cables tidy.', 'miscellaneous', array['cable','organizer','desk','clips','accessory'], array[]::text[], true),
  ('Pelvis Anatomical Model', 'pelvis-anatomical-model', 1400, 'Life-size pelvic bone model with accurate landmarks for anatomy study.', 'bone-models', array['pelvis','anatomy','bone','medical','study'], array[]::text[], true)
on conflict (slug) do nothing;
