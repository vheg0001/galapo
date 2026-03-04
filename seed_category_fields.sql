-- ============================================
-- SEED: CATEGORY-SPECIFIC DYNAMIC FIELDS
-- ============================================
-- These define the extra form fields that appear
-- when a business selects a specific category.
-- Fields are inherited: parent category fields apply
-- to ALL subcategories. Subcategory-specific fields
-- only appear for that subcategory.
-- ============================================

DO $$
DECLARE
    -- Parent Category IDs
    cat_food UUID;
    cat_shopping UUID;
    cat_health UUID;
    cat_services UUID;
    cat_automotive UUID;
    cat_education UUID;
    cat_accommodation UUID;
    cat_government UUID;
    cat_realestate UUID;
    cat_transportation UUID;
    cat_entertainment UUID;
    cat_religious UUID;
    cat_industrial UUID;
    cat_home UUID;

    -- Subcategory IDs (Food & Dining)
    sub_restaurants UUID;
    sub_cafes UUID;
    sub_bakeries UUID;
    sub_streetfood UUID;
    sub_bars UUID;
    sub_catering UUID;
    sub_foodtrucks UUID;

    -- Subcategory IDs (Shopping)
    sub_malls UUID;
    sub_grocery UUID;
    sub_clothing UUID;
    sub_electronics UUID;
    sub_hardware UUID;
    sub_furniture UUID;
    sub_petshops UUID;

    -- Subcategory IDs (Health)
    sub_hospitals UUID;
    sub_clinics UUID;
    sub_dental UUID;
    sub_eye UUID;
    sub_obgyn UUID;
    sub_pediatric UUID;
    sub_derma UUID;
    sub_pharmacies UUID;
    sub_gym UUID;
    sub_spa UUID;
    sub_salon UUID;
    sub_veterinary UUID;

    -- Subcategory IDs (Services)
    sub_banks UUID;
    sub_legal UUID;
    sub_accounting UUID;
    sub_printing UUID;
    sub_laundry UUID;
    sub_courier UUID;
    sub_events_planning UUID;
    sub_photography UUID;
    sub_repair UUID;

    -- Subcategory IDs (Automotive)
    sub_car_dealers UUID;
    sub_motorcycle UUID;
    sub_auto_repair UUID;
    sub_carwash UUID;
    sub_gas_stations UUID;
    sub_driving_schools UUID;

    -- Subcategory IDs (Education)
    sub_schools UUID;
    sub_colleges UUID;
    sub_tutorial UUID;
    sub_daycare UUID;
    sub_tesda UUID;
    sub_language UUID;
    sub_computer UUID;

    -- Subcategory IDs (Accommodation)
    sub_hotels UUID;
    sub_resorts UUID;
    sub_apartelles UUID;
    sub_pension UUID;
    sub_transient UUID;

    -- Subcategory IDs (Real Estate)
    sub_re_agents UUID;
    sub_re_developers UUID;
    sub_re_apartments UUID;
    sub_re_commercial UUID;
    sub_coworking UUID;

    -- Subcategory IDs (Entertainment)
    sub_ktv UUID;
    sub_internet_cafe UUID;
    sub_cinemas UUID;
    sub_tourist_spots UUID;
    sub_beach_resorts UUID;
    sub_event_venues UUID;

    -- Subcategory IDs (Home & Living)
    sub_plumbing UUID;
    sub_electrical UUID;
    sub_carpentry UUID;
    sub_aircon UUID;
    sub_painting UUID;
    sub_cleaning UUID;

BEGIN
    -- ============================================
    -- FETCH ALL CATEGORY IDS
    -- ============================================
    
    -- Clear existing fields to avoid duplicates
    DELETE FROM category_fields;
    
    -- Parent Categories
    SELECT id INTO cat_food FROM categories WHERE slug = 'food-and-dining' AND parent_id IS NULL;
    SELECT id INTO cat_shopping FROM categories WHERE slug = 'shopping-and-retail' AND parent_id IS NULL;
    SELECT id INTO cat_health FROM categories WHERE slug = 'health-and-wellness' AND parent_id IS NULL;
    SELECT id INTO cat_services FROM categories WHERE slug = 'services' AND parent_id IS NULL;
    SELECT id INTO cat_automotive FROM categories WHERE slug = 'automotive' AND parent_id IS NULL;
    SELECT id INTO cat_education FROM categories WHERE slug = 'education' AND parent_id IS NULL;
    SELECT id INTO cat_accommodation FROM categories WHERE slug = 'accommodation' AND parent_id IS NULL;
    SELECT id INTO cat_government FROM categories WHERE slug = 'government-public-services' AND parent_id IS NULL;
    SELECT id INTO cat_realestate FROM categories WHERE slug = 'real-estate-property' AND parent_id IS NULL;
    SELECT id INTO cat_transportation FROM categories WHERE slug = 'transportation' AND parent_id IS NULL;
    SELECT id INTO cat_entertainment FROM categories WHERE slug = 'entertainment-recreation' AND parent_id IS NULL;
    SELECT id INTO cat_religious FROM categories WHERE slug = 'religious-community' AND parent_id IS NULL;
    SELECT id INTO cat_industrial FROM categories WHERE slug = 'industrial-business' AND parent_id IS NULL;
    SELECT id INTO cat_home FROM categories WHERE slug = 'home-and-living' AND parent_id IS NULL;

    -- Food & Dining Subcategories
    SELECT id INTO sub_restaurants FROM categories WHERE slug = 'restaurants' AND parent_id = cat_food;
    SELECT id INTO sub_cafes FROM categories WHERE slug = 'cafes-coffee-shops' AND parent_id = cat_food;
    SELECT id INTO sub_bakeries FROM categories WHERE slug = 'bakeries-pastry-shops' AND parent_id = cat_food;
    SELECT id INTO sub_streetfood FROM categories WHERE slug = 'street-food-food-stalls' AND parent_id = cat_food;
    SELECT id INTO sub_bars FROM categories WHERE slug = 'bars-nightlife' AND parent_id = cat_food;
    SELECT id INTO sub_catering FROM categories WHERE slug = 'catering-services' AND parent_id = cat_food;
    SELECT id INTO sub_foodtrucks FROM categories WHERE slug = 'food-trucks' AND parent_id = cat_food;

    -- Shopping Subcategories
    SELECT id INTO sub_malls FROM categories WHERE slug = 'malls-department-stores' AND parent_id = cat_shopping;
    SELECT id INTO sub_grocery FROM categories WHERE slug = 'grocery-supermarkets' AND parent_id = cat_shopping;
    SELECT id INTO sub_clothing FROM categories WHERE slug = 'clothing-fashion' AND parent_id = cat_shopping;
    SELECT id INTO sub_electronics FROM categories WHERE slug = 'electronics-gadgets' AND parent_id = cat_shopping;
    SELECT id INTO sub_hardware FROM categories WHERE slug = 'hardware-construction' AND parent_id = cat_shopping;
    SELECT id INTO sub_furniture FROM categories WHERE slug = 'furniture-home-decor' AND parent_id = cat_shopping;
    SELECT id INTO sub_petshops FROM categories WHERE slug = 'pet-shops-supplies' AND parent_id = cat_shopping;

    -- Health Subcategories
    SELECT id INTO sub_hospitals FROM categories WHERE slug = 'hospitals' AND parent_id = cat_health;
    SELECT id INTO sub_clinics FROM categories WHERE slug = 'clinics' AND parent_id = cat_health;
    SELECT id INTO sub_dental FROM categories WHERE slug = 'dental-clinic' AND parent_id = cat_health;
    SELECT id INTO sub_eye FROM categories WHERE slug = 'eye-clinic' AND parent_id = cat_health;
    SELECT id INTO sub_obgyn FROM categories WHERE slug = 'ob-gyn' AND parent_id = cat_health;
    SELECT id INTO sub_pediatric FROM categories WHERE slug = 'pediatric' AND parent_id = cat_health;
    SELECT id INTO sub_derma FROM categories WHERE slug = 'dermatology' AND parent_id = cat_health;
    SELECT id INTO sub_pharmacies FROM categories WHERE slug = 'pharmacies-drugstores' AND parent_id = cat_health;
    SELECT id INTO sub_gym FROM categories WHERE slug = 'gym-fitness-centers' AND parent_id = cat_health;
    SELECT id INTO sub_spa FROM categories WHERE slug = 'spa-massage' AND parent_id = cat_health;
    SELECT id INTO sub_salon FROM categories WHERE slug = 'salon-barbershop' AND parent_id = cat_health;
    SELECT id INTO sub_veterinary FROM categories WHERE slug = 'veterinary-clinics' AND parent_id = cat_health;

    -- Services Subcategories
    SELECT id INTO sub_banks FROM categories WHERE slug = 'banks-financial-services' AND parent_id = cat_services;
    SELECT id INTO sub_legal FROM categories WHERE slug = 'legal-services-law-offices' AND parent_id = cat_services;
    SELECT id INTO sub_accounting FROM categories WHERE slug = 'accounting-bookkeeping' AND parent_id = cat_services;
    SELECT id INTO sub_printing FROM categories WHERE slug = 'printing-graphics' AND parent_id = cat_services;
    SELECT id INTO sub_laundry FROM categories WHERE slug = 'laundry-dry-cleaning' AND parent_id = cat_services;
    SELECT id INTO sub_courier FROM categories WHERE slug = 'courier-delivery' AND parent_id = cat_services;
    SELECT id INTO sub_events_planning FROM categories WHERE slug = 'event-planning' AND parent_id = cat_services;
    SELECT id INTO sub_photography FROM categories WHERE slug = 'photography-videography' AND parent_id = cat_services;
    SELECT id INTO sub_repair FROM categories WHERE slug = 'repair-services' AND parent_id = cat_services;

    -- Automotive Subcategories
    SELECT id INTO sub_car_dealers FROM categories WHERE slug = 'car-dealerships' AND parent_id = cat_automotive;
    SELECT id INTO sub_motorcycle FROM categories WHERE slug = 'motorcycle-dealers' AND parent_id = cat_automotive;
    SELECT id INTO sub_auto_repair FROM categories WHERE slug = 'auto-repair-mechanic' AND parent_id = cat_automotive;
    SELECT id INTO sub_carwash FROM categories WHERE slug = 'car-wash' AND parent_id = cat_automotive;
    SELECT id INTO sub_gas_stations FROM categories WHERE slug = 'gas-stations' AND parent_id = cat_automotive;
    SELECT id INTO sub_driving_schools FROM categories WHERE slug = 'driving-schools' AND parent_id = cat_automotive;

    -- Education Subcategories
    SELECT id INTO sub_schools FROM categories WHERE slug = 'schools' AND parent_id = cat_education;
    SELECT id INTO sub_colleges FROM categories WHERE slug = 'colleges-universities' AND parent_id = cat_education;
    SELECT id INTO sub_tutorial FROM categories WHERE slug = 'tutorial-review-centers' AND parent_id = cat_education;
    SELECT id INTO sub_daycare FROM categories WHERE slug = 'daycare-preschool' AND parent_id = cat_education;
    SELECT id INTO sub_tesda FROM categories WHERE slug = 'technical-vocational-tesda' AND parent_id = cat_education;
    SELECT id INTO sub_language FROM categories WHERE slug = 'language-schools' AND parent_id = cat_education;
    SELECT id INTO sub_computer FROM categories WHERE slug = 'computer-it-training' AND parent_id = cat_education;

    -- Accommodation Subcategories
    SELECT id INTO sub_hotels FROM categories WHERE slug = 'hotels' AND parent_id = cat_accommodation;
    SELECT id INTO sub_resorts FROM categories WHERE slug = 'resorts' AND parent_id = cat_accommodation;
    SELECT id INTO sub_apartelles FROM categories WHERE slug = 'apartelles-condotels' AND parent_id = cat_accommodation;
    SELECT id INTO sub_pension FROM categories WHERE slug = 'pension-houses' AND parent_id = cat_accommodation;
    SELECT id INTO sub_transient FROM categories WHERE slug = 'transient-homestay' AND parent_id = cat_accommodation;

    -- Real Estate Subcategories
    SELECT id INTO sub_re_agents FROM categories WHERE slug = 'real-estate-agents' AND parent_id = cat_realestate;
    SELECT id INTO sub_re_developers FROM categories WHERE slug = 'property-developers' AND parent_id = cat_realestate;
    SELECT id INTO sub_re_apartments FROM categories WHERE slug = 'apartments-condos-rent' AND parent_id = cat_realestate;
    SELECT id INTO sub_re_commercial FROM categories WHERE slug = 'commercial-spaces' AND parent_id = cat_realestate;
    SELECT id INTO sub_coworking FROM categories WHERE slug = 'coworking-spaces' AND parent_id = cat_realestate;

    -- Entertainment Subcategories
    SELECT id INTO sub_ktv FROM categories WHERE slug = 'ktv-karaoke' AND parent_id = cat_entertainment;
    SELECT id INTO sub_internet_cafe FROM categories WHERE slug = 'internet-cafes-gaming' AND parent_id = cat_entertainment;
    SELECT id INTO sub_cinemas FROM categories WHERE slug = 'cinemas' AND parent_id = cat_entertainment;
    SELECT id INTO sub_tourist_spots FROM categories WHERE slug = 'tourist-spots-parks' AND parent_id = cat_entertainment;
    SELECT id INTO sub_beach_resorts FROM categories WHERE slug = 'beach-resorts' AND parent_id = cat_entertainment;
    SELECT id INTO sub_event_venues FROM categories WHERE slug = 'event-venues' AND parent_id = cat_entertainment;

    -- Home & Living Subcategories
    SELECT id INTO sub_plumbing FROM categories WHERE slug = 'plumbing-services' AND parent_id = cat_home;
    SELECT id INTO sub_electrical FROM categories WHERE slug = 'electrical-services' AND parent_id = cat_home;
    SELECT id INTO sub_carpentry FROM categories WHERE slug = 'carpentry' AND parent_id = cat_home;
    SELECT id INTO sub_aircon FROM categories WHERE slug = 'hvac-aircon' AND parent_id = cat_home;
    SELECT id INTO sub_painting FROM categories WHERE slug = 'painting-services' AND parent_id = cat_home;
    SELECT id INTO sub_cleaning FROM categories WHERE slug = 'cleaning-services' AND parent_id = cat_home;


    -- ============================================
    -- FOOD & DINING — Parent Level Fields
    -- (These apply to ALL food subcategories)
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_food, NULL, 'cuisine_type', 'Cuisine Type', 'multi_select', false, NULL, 'Select all cuisine types that apply',
     '["Filipino","Chinese","Japanese","Korean","American","Italian","Mexican","Indian","Thai","Vietnamese","Mediterranean","Seafood","Vegetarian/Vegan","Fusion","International","Other"]'::jsonb,
     NULL, 1, true),
    
    (gen_random_uuid(), cat_food, NULL, 'price_range', 'Price Range', 'select', false, NULL, 'Average meal cost per person',
     '["₱ (Under ₱150)","₱₱ (₱150-₱350)","₱₱₱ (₱350-₱700)","₱₱₱₱ (Above ₱700)"]'::jsonb,
     NULL, 2, true),
    
    (gen_random_uuid(), cat_food, NULL, 'dining_options', 'Dining Options', 'multi_select', false, NULL, 'How can customers get your food?',
     '["Dine-in","Takeout","Delivery","Drive-thru","Curbside Pickup"]'::jsonb,
     NULL, 3, true),
    
    (gen_random_uuid(), cat_food, NULL, 'delivery_platforms', 'Delivery Platforms', 'multi_select', false, NULL, 'Which delivery apps are you available on?',
     '["GrabFood","Foodpanda","LalaFood","Own Delivery","Other"]'::jsonb,
     NULL, 4, true),
    
    (gen_random_uuid(), cat_food, NULL, 'amenities', 'Amenities', 'multi_select', false, NULL, 'Select all amenities available',
     '["Free Wi-Fi","Parking","Air Conditioning","Outdoor Seating","Private Room","Live Music/Entertainment","Pet-Friendly","Kid-Friendly","Wheelchair Accessible","Smoking Area","TV/Sports Viewing","Valet Parking"]'::jsonb,
     NULL, 5, true),
    
    (gen_random_uuid(), cat_food, NULL, 'seating_capacity', 'Seating Capacity', 'number', false, 'e.g., 50', 'Total number of seats',
     NULL, '{"min": 1, "max": 10000}'::jsonb, 6, true),
    
    (gen_random_uuid(), cat_food, NULL, 'reservations', 'Accepts Reservations', 'boolean', false, NULL, 'Do you accept table reservations?',
     NULL, NULL, 7, true),
    
    (gen_random_uuid(), cat_food, NULL, 'reservation_link', 'Reservation Link', 'url', false, 'https://...', 'Link to your online reservation system (if any)',
     NULL, NULL, 8, true),


    -- ============================================
    -- RESTAURANTS — Subcategory-Specific Fields
    -- (These appear IN ADDITION to Food & Dining parent fields)
    -- ============================================
    
    (gen_random_uuid(), cat_food, sub_restaurants, 'menu_items', 'Menu', 'menu_items', false, NULL, 'Add your menu items with prices. This helps customers decide before visiting.',
     NULL, NULL, 20, true),
    
    (gen_random_uuid(), cat_food, sub_restaurants, 'specialty_dishes', 'Specialty/Signature Dishes', 'textarea', false, 'e.g., Our famous Sinigang na Baboy, Crispy Pata...', 'List your most popular or recommended dishes',
     NULL, NULL, 21, true),
    
    (gen_random_uuid(), cat_food, sub_restaurants, 'restaurant_type', 'Restaurant Type', 'select', false, NULL, 'What best describes your restaurant?',
     '["Casual Dining","Fast Casual","Fine Dining","Family Restaurant","Buffet","Fast Food","Food Court Stall","Carinderia/Eatery","Ihawan/Grill","Turo-Turo","Samgyupsal/KBBQ","Ramen/Noodle House","Pizza House","Burger Joint","Other"]'::jsonb,
     NULL, 22, true),
    
    (gen_random_uuid(), cat_food, sub_restaurants, 'alcohol_served', 'Serves Alcohol', 'boolean', false, NULL, 'Do you serve alcoholic beverages?',
     NULL, NULL, 23, true),
    
    (gen_random_uuid(), cat_food, sub_restaurants, 'average_meal_time', 'Average Meal Time', 'select', false, NULL, 'How long does an average meal take?',
     '["15-30 minutes","30-60 minutes","1-2 hours","2+ hours"]'::jsonb,
     NULL, 24, true),


    -- ============================================
    -- CAFÉS & COFFEE SHOPS — Subcategory Fields
    -- ============================================
    
    (gen_random_uuid(), cat_food, sub_cafes, 'menu_items', 'Menu', 'menu_items', false, NULL, 'Add your drinks and food items with prices.',
     NULL, NULL, 20, true),
    
    (gen_random_uuid(), cat_food, sub_cafes, 'coffee_beans', 'Coffee Bean Source', 'text', false, 'e.g., Locally sourced from Benguet', 'Where do you source your coffee beans?',
     NULL, NULL, 21, true),
    
    (gen_random_uuid(), cat_food, sub_cafes, 'cafe_features', 'Café Features', 'multi_select', false, NULL, 'What makes your café special?',
     '["Study/Work Friendly","Power Outlets Available","Quiet Zone","Book Collection","Board Games","Art Gallery","Rooftop","Garden/Patio","Instagrammable Interior","Drive-thru","Meeting Room"]'::jsonb,
     NULL, 22, true),
    
    (gen_random_uuid(), cat_food, sub_cafes, 'specialty_drinks', 'Signature Drinks', 'textarea', false, 'e.g., Iced Spanish Latte, Matcha Latte...', 'Your most popular drinks',
     NULL, NULL, 23, true),


    -- ============================================
    -- BAKERIES — Subcategory Fields
    -- ============================================
    
    (gen_random_uuid(), cat_food, sub_bakeries, 'menu_items', 'Products & Prices', 'menu_items', false, NULL, 'Add your baked goods with prices.',
     NULL, NULL, 20, true),
    
    (gen_random_uuid(), cat_food, sub_bakeries, 'custom_orders', 'Accepts Custom Orders', 'boolean', false, NULL, 'Do you accept custom cake/pastry orders?',
     NULL, NULL, 21, true),
    
    (gen_random_uuid(), cat_food, sub_bakeries, 'advance_order_days', 'Advance Order Required', 'select', false, NULL, 'How many days in advance for custom orders?',
     '["Same Day","1 Day","2-3 Days","1 Week","2+ Weeks"]'::jsonb,
     NULL, 22, true),
    
    (gen_random_uuid(), cat_food, sub_bakeries, 'specialties', 'Bakery Specialties', 'multi_select', false, NULL, 'What types of baked goods do you specialize in?',
     '["Bread","Cakes","Pastries","Cookies","Donuts","Pandesal","Ensaymada","Wedding Cakes","Birthday Cakes","Cupcakes","Pies","Kakanin","Sugar-Free/Keto Options","Other"]'::jsonb,
     NULL, 23, true),


    -- ============================================
    -- BARS & NIGHTLIFE — Subcategory Fields
    -- ============================================
    
    (gen_random_uuid(), cat_food, sub_bars, 'menu_items', 'Drinks & Food Menu', 'menu_items', false, NULL, 'Add your drinks and bar food with prices.',
     NULL, NULL, 20, true),
    
    (gen_random_uuid(), cat_food, sub_bars, 'bar_type', 'Bar Type', 'select', false, NULL, 'What type of bar?',
     '["Sports Bar","Cocktail Bar","Beer Garden","Rooftop Bar","Pub","Lounge","Wine Bar","KTV Bar","Disco/Club","Live Music Bar","Other"]'::jsonb,
     NULL, 21, true),
    
    (gen_random_uuid(), cat_food, sub_bars, 'entertainment', 'Entertainment', 'multi_select', false, NULL, 'What entertainment do you offer?',
     '["Live Band","DJ","Karaoke","Billiards/Pool","Darts","Beer Pong","Trivia Night","Ladies Night","Happy Hour","Comedy Night","Open Mic","Dancing"]'::jsonb,
     NULL, 22, true),
    
    (gen_random_uuid(), cat_food, sub_bars, 'happy_hour', 'Happy Hour', 'text', false, 'e.g., 5PM-7PM daily, Buy 1 Get 1 beers', 'Describe your happy hour specials',
     NULL, NULL, 23, true),
    
    (gen_random_uuid(), cat_food, sub_bars, 'dress_code', 'Dress Code', 'select', false, NULL, 'Is there a dress code?',
     '["None/Casual","Smart Casual","Semi-Formal","Formal"]'::jsonb,
     NULL, 24, true),
    
    (gen_random_uuid(), cat_food, sub_bars, 'age_requirement', 'Minimum Age', 'select', false, NULL, 'Minimum age for entry',
     '["No Restriction","18+","21+"]'::jsonb,
     NULL, 25, true),


    -- ============================================
    -- CATERING SERVICES — Subcategory Fields
    -- ============================================
    
    (gen_random_uuid(), cat_food, sub_catering, 'menu_items', 'Catering Packages', 'menu_items', false, NULL, 'Add your catering packages with prices per head or per package.',
     NULL, NULL, 20, true),
    
    (gen_random_uuid(), cat_food, sub_catering, 'min_pax', 'Minimum Guests', 'number', false, 'e.g., 30', 'Minimum number of guests per booking',
     NULL, '{"min": 1}'::jsonb, 21, true),
    
    (gen_random_uuid(), cat_food, sub_catering, 'max_pax', 'Maximum Guests', 'number', false, 'e.g., 500', 'Maximum number of guests you can serve',
     NULL, '{"min": 1}'::jsonb, 22, true),
    
    (gen_random_uuid(), cat_food, sub_catering, 'service_types', 'Service Types', 'multi_select', false, NULL, 'What types of events do you cater?',
     '["Weddings","Corporate Events","Birthday Parties","Debut","Fiesta","Funeral/Wake","Baptism","Graduation","Christmas Party","Office Meals","Other"]'::jsonb,
     NULL, 23, true),
    
    (gen_random_uuid(), cat_food, sub_catering, 'includes', 'Package Includes', 'multi_select', false, NULL, 'What is included in your catering packages?',
     '["Food","Drinks","Tables & Chairs","Table Setting","Serving Staff","Decoration","Sound System","Emcee","Cake","Photo/Video","Venue"]'::jsonb,
     NULL, 24, true);


    -- ============================================
    -- SHOPPING & RETAIL — Parent Level Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_shopping, NULL, 'price_range', 'Price Range', 'select', false, NULL, 'General price level of your products',
     '["Budget-Friendly","Mid-Range","Premium","Luxury"]'::jsonb,
     NULL, 1, true),
    
    (gen_random_uuid(), cat_shopping, NULL, 'store_amenities', 'Store Amenities', 'multi_select', false, NULL, 'Select all that apply',
     '["Free Wi-Fi","Parking","Air Conditioning","Fitting Room","Wheelchair Accessible","Delivery Available","Installment/Layaway","Gift Wrapping","Loyalty Program","Online Ordering"]'::jsonb,
     NULL, 2, true),
    
    (gen_random_uuid(), cat_shopping, NULL, 'brands_carried', 'Brands Carried', 'textarea', false, 'e.g., Nike, Samsung, local brands...', 'Major brands you carry (if applicable)',
     NULL, NULL, 3, true),
    
    (gen_random_uuid(), cat_shopping, NULL, 'return_policy', 'Return/Exchange Policy', 'textarea', false, 'e.g., 7-day return with receipt...', 'Describe your return/exchange policy',
     NULL, NULL, 4, true),
    
    (gen_random_uuid(), cat_shopping, NULL, 'online_store', 'Online Store Link', 'url', false, 'https://shopee.ph/...', 'Link to your online store (Shopee, Lazada, own website)',
     NULL, NULL, 5, true),


    -- Electronics — Subcategory Fields
    (gen_random_uuid(), cat_shopping, sub_electronics, 'product_categories', 'Product Categories', 'multi_select', false, NULL, 'What electronics do you sell?',
     '["Smartphones","Laptops","Tablets","Desktop PCs","TV & Monitors","Audio/Speakers","Gaming","Cameras","Accessories","Computer Parts","Printers","Networking","Smart Home","Wearables","Other"]'::jsonb,
     NULL, 20, true),
    
    (gen_random_uuid(), cat_shopping, sub_electronics, 'warranty', 'Warranty Offered', 'select', false, NULL, 'Standard warranty you provide',
     '["No Warranty","Store Warranty (7 days)","Store Warranty (30 days)","1 Year","2 Years","Brand Warranty"]'::jsonb,
     NULL, 21, true),
    
    (gen_random_uuid(), cat_shopping, sub_electronics, 'repair_services', 'Offers Repair Services', 'boolean', false, NULL, 'Do you also offer repair services?',
     NULL, NULL, 22, true),


    -- Hardware — Subcategory Fields
    (gen_random_uuid(), cat_shopping, sub_hardware, 'product_categories', 'Product Categories', 'multi_select', false, NULL, 'What do you sell?',
     '["Lumber","Cement & Concrete","Plumbing","Electrical","Paint","Tools","Roofing","Tiles & Flooring","Doors & Windows","Steel & Metal","Sand & Gravel","Nails & Screws","Safety Equipment","Other"]'::jsonb,
     NULL, 20, true),
    
    (gen_random_uuid(), cat_shopping, sub_hardware, 'delivery_available', 'Delivery Available', 'boolean', false, NULL, 'Do you deliver construction materials?',
     NULL, NULL, 21, true),
    
    (gen_random_uuid(), cat_shopping, sub_hardware, 'delivery_area', 'Delivery Coverage Area', 'text', false, 'e.g., Olongapo City and SBFZ', 'Where do you deliver?',
     NULL, NULL, 22, true),
    
    (gen_random_uuid(), cat_shopping, sub_hardware, 'bulk_orders', 'Accepts Bulk/Contractor Orders', 'boolean', false, NULL, 'Do you offer contractor pricing for bulk orders?',
     NULL, NULL, 23, true);


    -- ============================================
    -- HEALTH & WELLNESS — Parent Level Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_health, NULL, 'hmo_accreditations', 'HMO Accreditations', 'multi_select', false, NULL, 'Select HMOs you are accredited with',
     '["PhilHealth","Maxicare","Medicard","Intellicare","Pacific Cross","AXA","Cocolife","Prulife","Eastwest Healthcare","Caritas Health Shield","Asianlife","Generali","None"]'::jsonb,
     NULL, 1, true),
    
    (gen_random_uuid(), cat_health, NULL, 'consultation_fee_range', 'Consultation Fee Range', 'select', false, NULL, 'Typical consultation fee',
     '["Free Consultation","₱100-₱300","₱300-₱500","₱500-₱1,000","₱1,000-₱2,000","₱2,000+","Varies"]'::jsonb,
     NULL, 2, true),
    
    (gen_random_uuid(), cat_health, NULL, 'accepts_walk_in', 'Accepts Walk-ins', 'boolean', false, NULL, 'Do you accept walk-in patients?',
     NULL, NULL, 3, true),
    
    (gen_random_uuid(), cat_health, NULL, 'appointment_required', 'Appointment Required', 'boolean', false, NULL, 'Is an appointment required?',
     NULL, NULL, 4, true),
    
    (gen_random_uuid(), cat_health, NULL, 'appointment_link', 'Online Appointment Link', 'url', false, 'https://...', 'Link to your online appointment booking',
     NULL, NULL, 5, true),
    
    (gen_random_uuid(), cat_health, NULL, 'emergency_services', 'Emergency Services', 'boolean', false, NULL, 'Do you offer 24/7 emergency services?',
     NULL, NULL, 6, true),


    -- Hospitals — Subcategory Fields
    (gen_random_uuid(), cat_health, sub_hospitals, 'hospital_type', 'Hospital Type', 'select', false, NULL, 'Type of hospital',
     '["Government/Public","Private","Military","Specialty"]'::jsonb,
     NULL, 20, true),
    
    (gen_random_uuid(), cat_health, sub_hospitals, 'bed_capacity', 'Bed Capacity', 'number', false, 'e.g., 100', 'Total number of hospital beds',
     NULL, '{"min": 1}'::jsonb, 21, true),
    
    (gen_random_uuid(), cat_health, sub_hospitals, 'departments', 'Departments/Services', 'multi_select', false, NULL, 'Available departments',
     '["Emergency Room","ICU","Surgery","OB-GYN/Delivery","Pediatrics","Cardiology","Orthopedics","ENT","Ophthalmology","Dermatology","Neurology","Oncology","Radiology/X-Ray","Laboratory","Pharmacy","Rehabilitation","Dialysis","Dental","Mental Health","Ambulance Service"]'::jsonb,
     NULL, 22, true),
    
    (gen_random_uuid(), cat_health, sub_hospitals, 'doctors_list', 'Doctors/Specialists', 'menu_items', false, NULL, 'List your doctors with their specializations. Use Name as doctor name, Description as specialization, Price as consultation fee.',
     NULL, NULL, 23, true),


    -- Clinics — Subcategory Fields
    (gen_random_uuid(), cat_health, sub_clinics, 'specializations', 'Specializations', 'multi_select', false, NULL, 'What medical specializations do you offer?',
     '["General Practice/Family Medicine","Internal Medicine","Pediatrics","OB-GYN","Surgery","Cardiology","Dermatology","ENT","Ophthalmology","Orthopedics","Neurology","Urology","Psychiatry","Pulmonology","Gastroenterology","Endocrinology","Other"]'::jsonb,
     NULL, 20, true),
    
    (gen_random_uuid(), cat_health, sub_clinics, 'services_offered', 'Services Offered', 'multi_select', false, NULL, 'What services do you provide?',
     '["Consultation","Laboratory/Blood Tests","X-Ray","Ultrasound","ECG","Drug Testing","Pre-Employment Medical","Annual Physical Exam","Vaccination","Minor Surgery","Wound Care","IV Therapy","Medical Certificate","Fit to Work Certificate","Other"]'::jsonb,
     NULL, 21, true),
    
    (gen_random_uuid(), cat_health, sub_clinics, 'doctors_list', 'Doctors', 'menu_items', false, NULL, 'List doctors. Name = Doctor name, Description = Specialization, Price = Consultation fee.',
     NULL, NULL, 22, true),


    -- Dental — Subcategory Fields
    (gen_random_uuid(), cat_health, sub_dental, 'dental_services', 'Dental Services', 'multi_select', false, NULL, 'What dental services do you offer?',
     '["Cleaning/Prophylaxis","Tooth Extraction","Fillings","Root Canal","Dentures","Braces/Orthodontics","Teeth Whitening","Dental Implants","Veneers","Crown & Bridge","Wisdom Tooth Removal","Kids Dentistry","Gum Treatment","Retainers","Invisalign","TMJ Treatment","Emergency Dental","Other"]'::jsonb,
     NULL, 20, true),
    
    (gen_random_uuid(), cat_health, sub_dental, 'dental_price_list', 'Service Price List', 'menu_items', false, NULL, 'Add services with prices. Name = Service, Price = Fee.',
     NULL, NULL, 21, true),


    -- Gym & Fitness — Subcategory Fields
    (gen_random_uuid(), cat_health, sub_gym, 'gym_type', 'Facility Type', 'select', false, NULL, 'What type of fitness facility?',
     '["Full Gym","CrossFit Box","Yoga Studio","Boxing Gym","MMA/Martial Arts","Dance Studio","Pilates Studio","Calisthenics","Swimming Pool","Multi-Sport","Home Gym Rental","Other"]'::jsonb,
     NULL, 20, true),
    
    (gen_random_uuid(), cat_health, sub_gym, 'membership_rates', 'Membership Rates', 'menu_items', false, NULL, 'Add membership options. Name = Plan, Price = Rate.',
     NULL, NULL, 21, true),
    
    (gen_random_uuid(), cat_health, sub_gym, 'equipment', 'Equipment/Facilities', 'multi_select', false, NULL, 'What equipment and facilities do you have?',
     '["Free Weights","Weight Machines","Treadmills","Ellipticals","Stationary Bikes","Rowing Machines","Cable Machines","Smith Machine","Boxing Ring/Bags","Swimming Pool","Sauna/Steam Room","Shower/Locker","Group Class Room","Personal Training","Smoothie Bar","Parking"]'::jsonb,
     NULL, 22, true),
    
    (gen_random_uuid(), cat_health, sub_gym, 'class_schedule', 'Group Classes', 'textarea', false, 'e.g., Zumba MWF 6PM, Yoga TTH 7AM...', 'List your group class schedule',
     NULL, NULL, 23, true),
    
    (gen_random_uuid(), cat_health, sub_gym, 'personal_training', 'Personal Training Available', 'boolean', false, NULL, 'Do you offer personal training?',
     NULL, NULL, 24, true),


    -- Salon & Barbershop — Subcategory Fields
    (gen_random_uuid(), cat_health, sub_salon, 'salon_services', 'Services & Prices', 'menu_items', false, NULL, 'Add your services with prices.',
     NULL, NULL, 20, true),
    
    (gen_random_uuid(), cat_health, sub_salon, 'salon_type', 'Salon Type', 'select', false, NULL, 'What type?',
     '["Full-Service Salon","Barbershop","Hair Salon","Nail Salon","Beauty Salon","Mens Grooming","Unisex","Home Service"]'::jsonb,
     NULL, 21, true),
    
    (gen_random_uuid(), cat_health, sub_salon, 'accepts_appointment', 'Accepts Appointments', 'boolean', false, NULL, 'Can customers book appointments?',
     NULL, NULL, 22, true),
    
    (gen_random_uuid(), cat_health, sub_salon, 'home_service', 'Home Service Available', 'boolean', false, NULL, 'Do you offer home service?',
     NULL, NULL, 23, true),


    -- Spa & Massage — Subcategory Fields
    (gen_random_uuid(), cat_health, sub_spa, 'spa_services', 'Services & Prices', 'menu_items', false, NULL, 'Add spa/massage services with prices and duration.',
     NULL, NULL, 20, true),
    
    (gen_random_uuid(), cat_health, sub_spa, 'massage_types', 'Massage Types', 'multi_select', false, NULL, 'What types of massage do you offer?',
     '["Swedish","Shiatsu","Thai","Hot Stone","Aromatherapy","Deep Tissue","Sports Massage","Prenatal","Reflexology","Hilot (Traditional Filipino)","Ventosa/Cupping","Foot Spa","Body Scrub","Facial","Other"]'::jsonb,
     NULL, 21, true),
    
    (gen_random_uuid(), cat_health, sub_spa, 'home_service', 'Home Service Available', 'boolean', false, NULL, 'Do you offer home service?',
     NULL, NULL, 22, true),


    -- Veterinary — Subcategory Fields
    (gen_random_uuid(), cat_health, sub_veterinary, 'vet_services', 'Services & Prices', 'menu_items', false, NULL, 'Add veterinary services with prices.',
     NULL, NULL, 20, true),
    
    (gen_random_uuid(), cat_health, sub_veterinary, 'animals_treated', 'Animals Treated', 'multi_select', false, NULL, 'What animals do you treat?',
     '["Dogs","Cats","Birds","Fish","Rabbits","Hamsters/Guinea Pigs","Reptiles","Farm Animals","Exotic Pets","All Animals"]'::jsonb,
     NULL, 21, true),
    
    (gen_random_uuid(), cat_health, sub_veterinary, 'vet_facilities', 'Facilities', 'multi_select', false, NULL, 'What facilities do you have?',
     '["Surgery Room","X-Ray","Laboratory","Grooming","Pet Boarding/Hotel","Pet Shop","Vaccination","Deworming","Dental Care","Emergency/24hr","Microchipping","Cremation"]'::jsonb,
     NULL, 22, true);


    -- ============================================
    -- SERVICES — Parent Level Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_services, NULL, 'service_list', 'Services & Prices', 'menu_items', false, NULL, 'List your services with prices. Name = Service, Price = Fee.',
     NULL, NULL, 1, true),
    
    (gen_random_uuid(), cat_services, NULL, 'service_area', 'Service Area', 'text', false, 'e.g., Olongapo City and surrounding areas', 'Where do you provide services?',
     NULL, NULL, 2, true),
    
    (gen_random_uuid(), cat_services, NULL, 'home_service', 'Home Service Available', 'boolean', false, NULL, 'Do you offer home/on-site service?',
     NULL, NULL, 3, true),
    
    (gen_random_uuid(), cat_services, NULL, 'license_number', 'License/Accreditation Number', 'text', false, 'e.g., PRC License #12345', 'Professional license or accreditation number (if applicable)',
     NULL, NULL, 4, true),
    
    (gen_random_uuid(), cat_services, NULL, 'turnaround_time', 'Typical Turnaround Time', 'select', false, NULL, 'How long does your service usually take?',
     '["Same Day","1-2 Days","3-5 Days","1 Week","2 Weeks","1 Month","Varies by Project"]'::jsonb,
     NULL, 5, true),
    
    (gen_random_uuid(), cat_services, NULL, 'free_consultation', 'Free Consultation', 'boolean', false, NULL, 'Do you offer free initial consultation?',
     NULL, NULL, 6, true),
    
    (gen_random_uuid(), cat_services, NULL, 'free_estimate', 'Free Estimate/Quote', 'boolean', false, NULL, 'Do you provide free estimates?',
     NULL, NULL, 7, true);


    -- ============================================
    -- AUTOMOTIVE — Parent Level Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_automotive, NULL, 'brands_serviced', 'Brands Serviced/Sold', 'multi_select', false, NULL, 'What vehicle brands do you service or sell?',
     '["Toyota","Honda","Mitsubishi","Nissan","Suzuki","Ford","Hyundai","Kia","Chevrolet","Isuzu","Mazda","Subaru","BMW","Mercedes-Benz","Volkswagen","All Brands","Other"]'::jsonb,
     NULL, 1, true),
    
    (gen_random_uuid(), cat_automotive, NULL, 'vehicle_types', 'Vehicle Types', 'multi_select', false, NULL, 'What types of vehicles?',
     '["Cars/Sedan","SUV/Crossover","Van/MPV","Truck","Motorcycle","Scooter","E-Bike/E-Scooter","Tricycle","Heavy Equipment","All Types"]'::jsonb,
     NULL, 2, true),
    
    (gen_random_uuid(), cat_automotive, NULL, 'price_range', 'Price Range', 'select', false, NULL, 'General pricing',
     '["Budget-Friendly","Mid-Range","Premium","Luxury"]'::jsonb,
     NULL, 3, true),


    -- Auto Repair — Subcategory Fields
    (gen_random_uuid(), cat_automotive, sub_auto_repair, 'repair_services', 'Services Offered', 'multi_select', false, NULL, 'What repair services do you offer?',
     '["Oil Change","Brake Repair","Engine Repair","Transmission","Air Conditioning","Electrical","Body & Paint","Tire Service","Wheel Alignment","Battery","Exhaust","Suspension","Overhaul","PMS (Preventive Maintenance)","Computer Diagnostics","Towing","Smog/Emission Test","Car Wash (included)","Other"]'::jsonb,
     NULL, 20, true),
    
    (gen_random_uuid(), cat_automotive, sub_auto_repair, 'service_price_list', 'Service Price List', 'menu_items', false, NULL, 'Add services with prices.',
     NULL, NULL, 21, true),
    
    (gen_random_uuid(), cat_automotive, sub_auto_repair, 'warranty_on_service', 'Warranty on Service', 'select', false, NULL, 'Do you offer warranty on repairs?',
     '["No Warranty","7 Days","30 Days","3 Months","6 Months","1 Year","Parts Only","Labor Only","Parts & Labor"]'::jsonb,
     NULL, 22, true),


    -- Car Wash — Subcategory Fields
    (gen_random_uuid(), cat_automotive, sub_carwash, 'wash_packages', 'Wash Packages & Prices', 'menu_items', false, NULL, 'Add your car wash packages. Name = Package, Price = Fee.',
     NULL, NULL, 20, true),
    
    (gen_random_uuid(), cat_automotive, sub_carwash, 'wash_types', 'Wash Types', 'multi_select', false, NULL, 'What types of car wash do you offer?',
     '["Exterior Wash","Interior Cleaning","Full Detail","Engine Wash","Waxing/Polish","Ceramic Coating","Undercoating","Upholstery Cleaning","Tint Installation","Self-Service","Automatic","Hand Wash"]'::jsonb,
     NULL, 21, true),


    -- Driving Schools — Subcategory Fields
    (gen_random_uuid(), cat_automotive, sub_driving_schools, 'course_packages', 'Courses & Prices', 'menu_items', false, NULL, 'Add driving courses with prices.',
     NULL, NULL, 20, true),
    
    (gen_random_uuid(), cat_automotive, sub_driving_schools, 'license_types', 'License Types Covered', 'multi_select', false, NULL, 'What license types do your courses cover?',
     '["Student Permit","Non-Professional","Professional","Motorcycle","Restriction Code 1 (Manual)","Restriction Code 2 (Automatic)","Restriction Code 1,2,3 (Manual+Auto+Truck)"]'::jsonb,
     NULL, 21, true),
    
    (gen_random_uuid(), cat_automotive, sub_driving_schools, 'lto_accredited', 'LTO Accredited', 'boolean', false, NULL, 'Are you accredited by the LTO?',
     NULL, NULL, 22, true);


    -- ============================================
    -- EDUCATION — Parent Level Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_education, NULL, 'school_type', 'Institution Type', 'select', false, NULL, 'Public or private?',
     '["Public/Government","Private","International","Religious/Sectarian","Non-Sectarian","Technical-Vocational","Online/Distance Learning"]'::jsonb,
     NULL, 1, true),
    
    (gen_random_uuid(), cat_education, NULL, 'accreditation', 'Accreditation', 'text', false, 'e.g., DepEd, CHED, TESDA accredited', 'Accrediting body',
     NULL, NULL, 2, true),
    
    (gen_random_uuid(), cat_education, NULL, 'tuition_range', 'Tuition Fee Range', 'select', false, NULL, 'Per semester/term',
     '["Free/Government Subsidized","₱5,000-₱15,000","₱15,000-₱30,000","₱30,000-₱60,000","₱60,000-₱100,000","₱100,000+","Varies by Program"]'::jsonb,
     NULL, 3, true),
    
    (gen_random_uuid(), cat_education, NULL, 'enrollment_schedule', 'Enrollment Period', 'text', false, 'e.g., June-July, November-December', 'When is your enrollment period?',
     NULL, NULL, 4, true),
    
    (gen_random_uuid(), cat_education, NULL, 'programs_offered', 'Programs/Courses Offered', 'textarea', false, 'List all programs, courses, or grade levels offered', 'What do you teach?',
     NULL, NULL, 5, true),
    
    (gen_random_uuid(), cat_education, NULL, 'scholarship', 'Scholarships Available', 'boolean', false, NULL, 'Do you offer scholarships or financial aid?',
     NULL, NULL, 6, true),
    
    (gen_random_uuid(), cat_education, NULL, 'facilities', 'Facilities', 'multi_select', false, NULL, 'What facilities are available?',
     '["Library","Computer Lab","Science Lab","Sports Facilities","Swimming Pool","Auditorium","Cafeteria","Parking","Chapel","Dormitory","Playground","Air-Conditioned Rooms","Online Learning Platform"]'::jsonb,
     NULL, 7, true);


    -- ============================================
    -- ACCOMMODATION — Parent Level Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_accommodation, NULL, 'room_types', 'Room Types & Rates', 'menu_items', false, NULL, 'Add room types with nightly rates. Name = Room Type, Price = Rate per night.',
     NULL, NULL, 1, true),
    
    (gen_random_uuid(), cat_accommodation, NULL, 'check_in_time', 'Check-in Time', 'text', false, 'e.g., 2:00 PM', 'Standard check-in time',
     NULL, NULL, 2, true),
    
    (gen_random_uuid(), cat_accommodation, NULL, 'check_out_time', 'Check-out Time', 'text', false, 'e.g., 12:00 NN', 'Standard check-out time',
     NULL, NULL, 3, true),
    
    (gen_random_uuid(), cat_accommodation, NULL, 'amenities', 'Amenities', 'multi_select', false, NULL, 'What amenities do you offer?',
     '["Free Wi-Fi","Swimming Pool","Restaurant","Bar","Room Service","Parking","Airport/Port Transfer","Gym/Fitness Center","Spa","Laundry Service","Business Center","Meeting/Conference Room","Concierge","24-Hour Front Desk","Air Conditioning","Hot Water","Cable TV","Mini Bar","Balcony/Terrace","Garden","Beach Access","Pet-Friendly","Wheelchair Accessible","Generator/Backup Power","CCTV Security","EV Charging"]'::jsonb,
     NULL, 4, true),
    
    (gen_random_uuid(), cat_accommodation, NULL, 'booking_platforms', 'Booking Platforms', 'multi_select', false, NULL, 'Where can guests book?',
     '["Direct Booking","Booking.com","Agoda","Airbnb","Expedia","Traveloka","Own Website","Facebook","Other"]'::jsonb,
     NULL, 5, true),
    
    (gen_random_uuid(), cat_accommodation, NULL, 'booking_link', 'Online Booking Link', 'url', false, 'https://...', 'Direct link to book a room',
     NULL, NULL, 6, true),
    
    (gen_random_uuid(), cat_accommodation, NULL, 'cancellation_policy', 'Cancellation Policy', 'select', false, NULL, 'What is your cancellation policy?',
     '["Free Cancellation","24-Hour Cancellation","48-Hour Cancellation","Non-Refundable","Flexible","Moderate","Strict"]'::jsonb,
     NULL, 7, true),
    
    (gen_random_uuid(), cat_accommodation, NULL, 'star_rating', 'Star Rating', 'select', false, NULL, 'Self-declared star rating',
     '["1 Star","2 Star","3 Star","4 Star","5 Star","Budget/No Rating"]'::jsonb,
     NULL, 8, true),
    
    (gen_random_uuid(), cat_accommodation, NULL, 'event_hosting', 'Event Hosting Available', 'boolean', false, NULL, 'Do you host events (weddings, conferences)?',
     NULL, NULL, 9, true),
    
    (gen_random_uuid(), cat_accommodation, NULL, 'event_capacity', 'Event Capacity', 'number', false, 'e.g., 200', 'Maximum guests for events',
     NULL, '{"min": 1}'::jsonb, 10, true);


    -- ============================================
    -- REAL ESTATE — Parent Level Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_realestate, NULL, 'property_types', 'Property Types', 'multi_select', false, NULL, 'What types of properties?',
     '["House & Lot","Condominium","Townhouse","Apartment","Commercial Space","Office Space","Warehouse","Land/Lot","Farm/Agricultural","Industrial","Other"]'::jsonb,
     NULL, 1, true),
    
    (gen_random_uuid(), cat_realestate, NULL, 'transaction_types', 'Transaction Types', 'multi_select', false, NULL, 'What do you offer?',
     '["For Sale","For Rent","For Lease","Pre-Selling","Foreclosed","Rent-to-Own"]'::jsonb,
     NULL, 2, true),
    
    (gen_random_uuid(), cat_realestate, NULL, 'price_range_min', 'Minimum Price', 'currency', false, 'e.g., 500000', 'Lowest price point',
     NULL, '{"min": 0}'::jsonb, 3, true),
    
    (gen_random_uuid(), cat_realestate, NULL, 'price_range_max', 'Maximum Price', 'currency', false, 'e.g., 5000000', 'Highest price point',
     NULL, '{"min": 0}'::jsonb, 4, true),
    
    (gen_random_uuid(), cat_realestate, NULL, 'license_number', 'PRC/DHSUD License Number', 'text', false, 'e.g., PRC #12345', 'Real estate broker/agent license',
     NULL, NULL, 5, true),
    
    (gen_random_uuid(), cat_realestate, NULL, 'financing_available', 'Financing Available', 'multi_select', false, NULL, 'What financing options?',
     '["Cash","Bank Financing","Pag-IBIG","In-House Financing","Rent-to-Own","Installment","None"]'::jsonb,
     NULL, 6, true),
    
    (gen_random_uuid(), cat_realestate, NULL, 'featured_listings_link', 'Featured Properties Link', 'url', false, 'https://...', 'Link to your property listings website',
     NULL, NULL, 7, true);


    -- ============================================
    -- ENTERTAINMENT — Parent Level Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_entertainment, NULL, 'entrance_fee', 'Entrance/Admission Fee', 'text', false, 'e.g., ₱100/person or Free', 'Cost of entry',
     NULL, NULL, 1, true),
    
    (gen_random_uuid(), cat_entertainment, NULL, 'age_restriction', 'Age Restriction', 'select', false, NULL, 'Minimum age requirement',
     '["All Ages","3+","12+","18+","21+","None"]'::jsonb,
     NULL, 2, true),
    
    (gen_random_uuid(), cat_entertainment, NULL, 'capacity', 'Venue Capacity', 'number', false, 'e.g., 100', 'Maximum number of guests',
     NULL, '{"min": 1}'::jsonb, 3, true),
    
    (gen_random_uuid(), cat_entertainment, NULL, 'amenities', 'Amenities', 'multi_select', false, NULL, 'Available amenities',
     '["Parking","Air Conditioning","Wi-Fi","Food & Drinks","Sound System","Stage/Performance Area","Private Rooms","Smoking Area","Wheelchair Accessible","CCTV Security"]'::jsonb,
     NULL, 4, true),


    -- KTV — Subcategory Fields
    (gen_random_uuid(), cat_entertainment, sub_ktv, 'room_rates', 'Room Rates', 'menu_items', false, NULL, 'Add room types with rates. Name = Room size, Price = Rate per hour.',
     NULL, NULL, 20, true),
    
    (gen_random_uuid(), cat_entertainment, sub_ktv, 'ktv_features', 'Features', 'multi_select', false, NULL, 'What features?',
     '["Updated Song Library","HD Screens","Professional Sound System","Tambourine/Props","Food & Drinks Menu","Videoke Machine for Rent","Home Service","Party Packages","Corporate Packages"]'::jsonb,
     NULL, 21, true),


    -- Event Venues — Subcategory Fields
    (gen_random_uuid(), cat_entertainment, sub_event_venues, 'venue_packages', 'Venue Packages', 'menu_items', false, NULL, 'Add venue packages with prices.',
     NULL, NULL, 20, true),
    
    (gen_random_uuid(), cat_entertainment, sub_event_venues, 'event_types', 'Event Types Hosted', 'multi_select', false, NULL, 'What events can your venue host?',
     '["Weddings","Debut","Birthday","Corporate Events","Conferences","Seminars","Christmas Party","Reunion","Concert","Trade Show","Sports Event","Other"]'::jsonb,
     NULL, 21, true),
    
    (gen_random_uuid(), cat_entertainment, sub_event_venues, 'venue_features', 'Venue Features', 'multi_select', false, NULL, 'What does your venue include?',
     '["Catering Available","In-house Sound System","Projector/Screen","Stage","Dance Floor","Bridal Room","Garden/Outdoor Area","Indoor Hall","Pool Area","Generator Backup","Ample Parking","Tables & Chairs Included"]'::jsonb,
     NULL, 22, true);


    -- ============================================
    -- GOVERNMENT & PUBLIC SERVICES — Parent Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_government, NULL, 'services_offered', 'Services Offered', 'textarea', false, 'List all services available', 'What services does this office provide?',
     NULL, NULL, 1, true),
    
    (gen_random_uuid(), cat_government, NULL, 'requirements', 'Common Requirements', 'textarea', false, 'List common requirements for transactions', 'Documents/requirements visitors should bring',
     NULL, NULL, 2, true),
    
    (gen_random_uuid(), cat_government, NULL, 'processing_time', 'Processing Time', 'text', false, 'e.g., 30 minutes to 1 hour', 'How long do transactions usually take?',
     NULL, NULL, 3, true),
    
    (gen_random_uuid(), cat_government, NULL, 'fees', 'Common Fees', 'textarea', false, 'e.g., Barangay Clearance - ₱50, Business Permit - ₱500', 'List common fees for services',
     NULL, NULL, 4, true),
    
    (gen_random_uuid(), cat_government, NULL, 'appointment_system', 'Online Appointment Link', 'url', false, 'https://...', 'Link to online appointment system (if available)',
     NULL, NULL, 5, true),
    
    (gen_random_uuid(), cat_government, NULL, 'hotline', 'Hotline/Emergency Number', 'phone', false, 'e.g., 911 or (047) 222-XXXX', 'Emergency or hotline number',
     NULL, NULL, 6, true);


    -- ============================================
    -- TRANSPORTATION — Parent Level Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_transportation, NULL, 'routes', 'Routes/Destinations', 'textarea', false, 'e.g., Olongapo to Manila, Olongapo to Iba...', 'List routes or destinations served',
     NULL, NULL, 1, true),
    
    (gen_random_uuid(), cat_transportation, NULL, 'fare_rates', 'Fare Rates', 'menu_items', false, NULL, 'Add routes with fares. Name = Route, Price = Fare.',
     NULL, NULL, 2, true),
    
    (gen_random_uuid(), cat_transportation, NULL, 'schedule', 'Schedule/Frequency', 'textarea', false, 'e.g., Every 30 minutes, First trip 5AM, Last trip 9PM', 'Trip schedule or frequency',
     NULL, NULL, 3, true),
    
    (gen_random_uuid(), cat_transportation, NULL, 'vehicle_type', 'Vehicle Type', 'multi_select', false, NULL, 'What types of vehicles?',
     '["Jeepney","Tricycle","Bus","Mini Bus","Van/UV Express","Sedan/Car","SUV","Motorcycle","Boat/Ferry","Truck","Other"]'::jsonb,
     NULL, 4, true),
    
    (gen_random_uuid(), cat_transportation, NULL, 'booking_method', 'Booking Method', 'multi_select', false, NULL, 'How can customers book?',
     '["Walk-in/On-site","Phone Call","SMS/Text","Facebook Messenger","WhatsApp/Viber","Own App","GrabCar/Grab","Other App","No Booking Needed"]'::jsonb,
     NULL, 5, true);


    -- ============================================
    -- HOME & LIVING — Parent Level Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_home, NULL, 'service_list', 'Services & Prices', 'menu_items', false, NULL, 'List your services with prices.',
     NULL, NULL, 1, true),
    
    (gen_random_uuid(), cat_home, NULL, 'service_area', 'Service Area', 'text', false, 'e.g., Olongapo City, SBFZ, Subic', 'Areas you serve',
     NULL, NULL, 2, true),
    
    (gen_random_uuid(), cat_home, NULL, 'emergency_service', '24/7 Emergency Service', 'boolean', false, NULL, 'Available for emergency calls?',
     NULL, NULL, 3, true),
    
    (gen_random_uuid(), cat_home, NULL, 'free_estimate', 'Free Estimate', 'boolean', false, NULL, 'Do you provide free estimates?',
     NULL, NULL, 4, true),
    
    (gen_random_uuid(), cat_home, NULL, 'warranty_offered', 'Warranty on Work', 'select', false, NULL, 'Do you offer warranty?',
     '["No Warranty","7 Days","30 Days","3 Months","6 Months","1 Year","Varies"]'::jsonb,
     NULL, 5, true),
    
    (gen_random_uuid(), cat_home, NULL, 'licensed', 'Licensed/Certified', 'boolean', false, NULL, 'Are you a licensed professional?',
     NULL, NULL, 6, true),
    
    (gen_random_uuid(), cat_home, NULL, 'license_info', 'License/Certification Details', 'text', false, 'e.g., Master Plumber License #12345', 'License or certification details',
     NULL, NULL, 7, true),


    -- Aircon Services — Subcategory Fields
    (gen_random_uuid(), cat_home, sub_aircon, 'aircon_services', 'Aircon Services', 'multi_select', false, NULL, 'What aircon services?',
     '["Cleaning","Repair","Installation","Check-up/Diagnostic","Freon Recharge","Duct Cleaning","Preventive Maintenance","Relocation","Unit Sale","Disposal","Split Type","Window Type","Central/Chiller","Cassette Type","All Types"]'::jsonb,
     NULL, 20, true),
    
    (gen_random_uuid(), cat_home, sub_aircon, 'brands_serviced', 'Brands Serviced', 'multi_select', false, NULL, 'What brands?',
     '["Carrier","Samsung","LG","Panasonic","Daikin","Midea","Condura","Kelvinator","Sharp","Fujidenzo","TCL","Haier","All Brands"]'::jsonb,
     NULL, 21, true);


    -- ============================================
    -- INDUSTRIAL & BUSINESS — Parent Level Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_industrial, NULL, 'industry_type', 'Industry', 'select', false, NULL, 'What industry?',
     '["Manufacturing","IT/BPO","Logistics","Import/Export","Construction","Agriculture","Food Processing","Textile/Garments","Electronics","Automotive","Shipbuilding","Other"]'::jsonb,
     NULL, 1, true),
    
    (gen_random_uuid(), cat_industrial, NULL, 'company_size', 'Company Size', 'select', false, NULL, 'Number of employees',
     '["1-10 (Micro)","11-50 (Small)","51-200 (Medium)","201-500 (Large)","500+ (Enterprise)"]'::jsonb,
     NULL, 2, true),
    
    (gen_random_uuid(), cat_industrial, NULL, 'year_established', 'Year Established', 'number', false, 'e.g., 2010', 'When was the company founded?',
     NULL, '{"min": 1900, "max": 2026}'::jsonb, 3, true),
    
    (gen_random_uuid(), cat_industrial, NULL, 'certifications', 'Certifications', 'multi_select', false, NULL, 'Quality certifications held',
     '["ISO 9001","ISO 14001","ISO 45001","PEZA Registered","BOI Registered","FDA Registered","HACCP","GMP","Other","None"]'::jsonb,
     NULL, 4, true),
    
    (gen_random_uuid(), cat_industrial, NULL, 'now_hiring', 'Currently Hiring', 'boolean', false, NULL, 'Are you currently hiring?',
     NULL, NULL, 5, true),
    
    (gen_random_uuid(), cat_industrial, NULL, 'careers_link', 'Careers/Jobs Page', 'url', false, 'https://...', 'Link to your careers or job posting page',
     NULL, NULL, 6, true);


    -- ============================================
    -- RELIGIOUS & COMMUNITY — Parent Level Fields
    -- ============================================
    
    INSERT INTO category_fields (id, category_id, subcategory_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, validation_rules, sort_order, is_active) VALUES
    
    (gen_random_uuid(), cat_religious, NULL, 'denomination', 'Denomination/Affiliation', 'text', false, 'e.g., Roman Catholic, Baptist, INC...', 'Religious denomination or organizational affiliation',
     NULL, NULL, 1, true),
    
    (gen_random_uuid(), cat_religious, NULL, 'worship_schedule', 'Worship/Mass Schedule', 'textarea', false, 'e.g., Sunday Mass: 6AM, 8AM, 10AM, 5PM\nWednesday Service: 7PM', 'Regular worship or service schedule',
     NULL, NULL, 2, true),
    
    (gen_random_uuid(), cat_religious, NULL, 'services_available', 'Services Available', 'multi_select', false, NULL, 'What services does your organization offer?',
     '["Regular Worship/Mass","Baptism","Wedding","Funeral","Counseling","Bible Study","Youth Group","Community Outreach","Feeding Program","Medical Mission","Disaster Relief","Education/Scholarship","Livelihood Program","Other"]'::jsonb,
     NULL, 3, true),
    
    (gen_random_uuid(), cat_religious, NULL, 'leader_name', 'Pastor/Priest/Leader Name', 'text', false, 'e.g., Fr. Juan dela Cruz', 'Name of the current leader',
     NULL, NULL, 4, true),
    
    (gen_random_uuid(), cat_religious, NULL, 'year_established', 'Year Established', 'number', false, 'e.g., 1950', 'When was this organized?',
     NULL, '{"min": 1500, "max": 2026}'::jsonb, 5, true);


    -- ============================================
    RAISE NOTICE '✅ Category fields seeded successfully!';
    
END $$;