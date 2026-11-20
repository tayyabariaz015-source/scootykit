-- =====================================================================
-- ScootyKit seed — the 27 default categories + initial store settings.
-- No products are seeded: add real, verified products from /admin.
-- Safe to re-run (upserts on slug).
-- =====================================================================

insert into public.categories (name, slug, description, icon, sort_order, seo_title, seo_description) values
  ('Scooty Helmets', 'scooty-helmets', 'Lightweight, comfortable helmets for daily scooty rides — half-face, open-face and full-face options for city commuting.', 'hard-hat', 1, 'Scooty Helmets in Pakistan', 'Shop helmets for electric scooty and scooter riders in Pakistan. Comfortable, lightweight options for daily commuting.'),
  ('Riding Gloves', 'riding-gloves', 'Breathable riding gloves for better grip, sun protection and comfort on long commutes.', 'hand', 2, 'Riding Gloves for Scooty Riders', 'Breathable, grippy riding gloves for scooty and scooter riders across Pakistan.'),
  ('Riding Glasses', 'riding-glasses', 'Riding glasses that shield your eyes from dust, wind and glare during the ride.', 'glasses', 3, 'Riding Glasses & Goggles', 'Protect your eyes from dust, wind and sun glare with riding glasses for scooty riders.'),
  ('Scooty Covers', 'scooty-covers', 'Full-body covers to protect your scooty from sun, rain and dust when parked.', 'umbrella', 4, 'Scooty Body Covers', 'Weather-resistant scooty covers to protect your ride from sun, rain and dust.'),
  ('Scooty Seat Covers', 'scooty-seat-covers', 'Seat covers that keep your seat cooler, cleaner and more comfortable.', 'armchair', 5, 'Scooty Seat Covers', 'Comfortable, easy-fit seat covers for electric scooty and scooter seats.'),
  ('Scooty Mirrors', 'scooty-mirrors', 'Replacement and upgrade side mirrors for clear rear visibility.', 'scan-eye', 6, 'Scooty Side Mirrors', 'Replacement and upgrade mirrors for clearer, safer rear visibility on your scooty.'),
  ('Scooty Stickers & Decals', 'scooty-stickers-decals', 'Stickers and decals to personalise your scooty''s look.', 'sticker', 7, 'Scooty Stickers & Decals', 'Personalise your scooty with stickers and decals.'),
  ('Scooty Mobile Holders', 'scooty-mobile-holders', 'Secure handlebar phone mounts for navigation on the go.', 'smartphone', 8, 'Scooty Mobile Holders', 'Secure handlebar mobile holders for navigation while riding.'),
  ('GPS Trackers', 'gps-trackers', 'GPS trackers to keep an eye on your scooty''s location for extra peace of mind.', 'map-pin', 9, 'GPS Trackers for Scooty', 'GPS trackers to monitor your scooty location and improve security.'),
  ('Anti-Theft Disc Locks', 'anti-theft-disc-locks', 'Sturdy disc locks that make your parked scooty harder to steal.', 'lock', 10, 'Anti-Theft Disc Locks', 'Sturdy anti-theft disc locks to secure your parked scooty.'),
  ('Scooty Baskets', 'scooty-baskets', 'Front and rear baskets for groceries, bags and everyday carry.', 'shopping-basket', 11, 'Scooty Baskets', 'Front and rear baskets for carrying bags and groceries on your scooty.'),
  ('Scooty Storage Boxes', 'scooty-storage-boxes', 'Lockable top boxes and storage cases for helmets and essentials.', 'package', 12, 'Scooty Storage Boxes', 'Lockable storage boxes for helmets and daily essentials.'),
  ('Riding Raincoats', 'riding-raincoats', 'Rain suits and raincoats designed for riding through monsoon showers.', 'cloud-rain', 13, 'Riding Raincoats', 'Riding raincoats and rain suits for monsoon commutes in Pakistan.'),
  ('Knee & Elbow Guards', 'knee-elbow-guards', 'Protective knee and elbow guards for safer riding.', 'shield', 14, 'Knee & Elbow Guards', 'Protective knee and elbow guards for scooty and scooter riders.'),
  ('Scooty LED Lights', 'scooty-led-lights', 'LED lights for better visibility and a modern look.', 'lightbulb', 15, 'Scooty LED Lights', 'LED lights for brighter, safer night riding on your scooty.'),
  ('Scooty Horns', 'scooty-horns', 'Clear, loud replacement horns for safer city riding.', 'megaphone', 16, 'Scooty Horns', 'Replacement horns for safer city riding.'),
  ('Portable Tyre Inflators', 'portable-tyre-inflators', 'Compact inflators to top up tyre pressure anywhere.', 'gauge', 17, 'Portable Tyre Inflators', 'Compact portable tyre inflators for scooty and motorcycle tyres.'),
  ('Tyre Puncture Repair Kits', 'tyre-puncture-repair-kits', 'Puncture repair kits so a flat tyre doesn''t end your day.', 'wrench', 18, 'Tyre Puncture Repair Kits', 'Tyre puncture repair kits for quick roadside fixes.'),
  ('Scooty Handlebar Grips', 'scooty-handlebar-grips', 'Comfortable, non-slip handlebar grips.', 'grip-horizontal', 19, 'Scooty Handlebar Grips', 'Comfortable non-slip handlebar grips for scooty riders.'),
  ('Scooty Backrests', 'scooty-backrests', 'Backrests for added pillion comfort and support.', 'armchair', 20, 'Scooty Backrests', 'Backrests for pillion comfort on your scooty.'),
  ('Scooty Footrests', 'scooty-footrests', 'Footrests and foot pegs for comfortable riding posture.', 'footprints', 21, 'Scooty Footrests', 'Footrests for a comfortable riding posture.'),
  ('Scooty Side Bags', 'scooty-side-bags', 'Side and saddle bags for extra carrying space.', 'briefcase', 22, 'Scooty Side Bags', 'Side bags and saddle bags for extra storage on your scooty.'),
  ('Helmet Bluetooth Intercoms', 'helmet-bluetooth-intercoms', 'Bluetooth intercoms for calls, music and navigation inside your helmet.', 'headphones', 23, 'Helmet Bluetooth Intercoms', 'Bluetooth helmet intercoms for calls, music and navigation.'),
  ('Scooty Dupatta Guards', 'scooty-dupatta-guards', 'Dupatta and saree guards that help keep loose clothing away from the rear wheel.', 'shield-check', 24, 'Scooty Dupatta Guards', 'Dupatta guards to help keep loose clothing away from the rear wheel.'),
  ('Scooty Windshields', 'scooty-windshields', 'Windshields that cut wind and dust on the ride.', 'wind', 25, 'Scooty Windshields', 'Windshields to reduce wind and dust while riding.'),
  ('Scooty Battery Voltage Meters', 'scooty-battery-voltage-meters', 'Voltage meters to monitor your electric scooty''s battery health.', 'battery-charging', 26, 'Scooty Battery Voltage Meters', 'Battery voltage meters to monitor your electric scooty battery.'),
  ('Scooty Parking Side Stand Pads', 'scooty-parking-side-stand-pads', 'Side stand pads that stop your scooty sinking into soft ground.', 'square-parking', 27, 'Scooty Side Stand Pads', 'Side stand pads to keep your parked scooty stable on soft ground.')
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  icon = excluded.icon;

-- Store settings: contact/bank details intentionally empty — fill them in /admin/settings.
insert into public.store_settings (id, store_name, tagline, cod_enabled, bank_transfer_enabled)
values (1, 'ScootyKit', 'Everything Your Scooty Needs.', true, false)
on conflict (id) do nothing;

-- Nationwide default delivery charge.
-- ⚠️ PLACEHOLDER — confirm your real courier rate in /admin/delivery before launch.
insert into public.delivery_zones (name, province, city, charge, sort_order)
values ('All Pakistan (default)', null, null, 250, 0)
on conflict do nothing;
