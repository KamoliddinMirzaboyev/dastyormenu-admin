import { Category, Menu, Table, UserProfile, Order, Expense, Organization } from './types';

export const initialOrganization: Organization = {
  id: 'org-demo-001',
  name: 'Dastyor Grand Restaurant',
  full_name: 'Dastyor Grand Restaurant & Lounge',
  logo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
  address: "Toshkent sh., Yunusobod t., Amir Temur shoh ko'chasi, 120-uy",
  phone: '+998 71 200 45 45',
  role: 'manager',
  is_active: true,
  created_at: '2026-01-01T08:00:00Z',
  updated_at: '2026-11-19T10:00:00Z',
};

export const initialAdminUser: UserProfile = {
  id: 'user-admin-001',
  organization_id: 'org-demo-001',
  username: 'admin',
  email: 'admin@dastyor.uz',
  first_name: 'Jasur',
  last_name: 'Rahimov',
  full_name: 'Jasur Rahimov',
  role: 'manager',
  pin_code: '1234',
  is_active: true,
  created_at: '2026-01-01T08:00:00Z',
};

export const initialStaff: UserProfile[] = [
  initialAdminUser,
  {
    id: 'user-waiter-001',
    organization_id: 'org-demo-001',
    username: 'alisher',
    email: 'alisher@dastyor.uz',
    first_name: 'Alisher',
    last_name: 'Zokirov',
    full_name: 'Alisher Zokirov',
    role: 'waiter',
    pin_code: '1111',
    is_active: true,
    created_at: '2026-02-10T09:00:00Z',
  },
  {
    id: 'user-waiter-002',
    organization_id: 'org-demo-001',
    username: 'nodira',
    email: 'nodira@dastyor.uz',
    first_name: 'Nodira',
    last_name: 'Karimova',
    full_name: 'Nodira Karimova',
    role: 'waiter',
    pin_code: '2222',
    is_active: true,
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'user-waiter-003',
    organization_id: 'org-demo-001',
    username: 'sardor',
    email: 'sardor@dastyor.uz',
    first_name: 'Sardor',
    last_name: 'Aliyev',
    full_name: 'Sardor Aliyev',
    role: 'waiter',
    pin_code: '3333',
    is_active: true,
    created_at: '2026-03-15T10:00:00Z',
  },
  {
    id: 'user-chef-001',
    organization_id: 'org-demo-001',
    username: 'feruz',
    email: 'feruz@dastyor.uz',
    first_name: 'Feruz',
    last_name: 'Rustamov',
    full_name: 'Feruz Rustamov',
    role: 'chef',
    pin_code: '4444',
    is_active: true,
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 'user-cashier-001',
    organization_id: 'org-demo-001',
    username: 'madina',
    email: 'madina@dastyor.uz',
    first_name: 'Madina',
    last_name: 'Usmonova',
    full_name: 'Madina Usmonova',
    role: 'manager',
    pin_code: '5555',
    is_active: true,
    created_at: '2026-04-01T09:00:00Z',
  },
];

export const initialCategories: Category[] = [
  {
    id: 'cat-1',
    organization_id: 'org-demo-001',
    name: 'Milliy taomlar',
    icon: '🍲',
    sort_order: 1,
    is_active: true,
    items_count: 5,
  },
  {
    id: 'cat-2',
    organization_id: 'org-demo-001',
    name: 'Kaboblar & Go\'sht',
    icon: '🥩',
    sort_order: 2,
    is_active: true,
    items_count: 5,
  },
  {
    id: 'cat-3',
    organization_id: 'org-demo-001',
    name: 'Sho\'rvalar',
    icon: '🥣',
    sort_order: 3,
    is_active: true,
    items_count: 3,
  },
  {
    id: 'cat-4',
    organization_id: 'org-demo-001',
    name: 'Fast Food & Burger',
    icon: '🍔',
    sort_order: 4,
    is_active: true,
    items_count: 3,
  },
  {
    id: 'cat-5',
    organization_id: 'org-demo-001',
    name: 'Salatlar & Gazaklar',
    icon: '🥗',
    sort_order: 5,
    is_active: true,
    items_count: 4,
  },
  {
    id: 'cat-6',
    organization_id: 'org-demo-001',
    name: 'Ichimliklar & Choylar',
    icon: '☕',
    sort_order: 6,
    is_active: true,
    items_count: 4,
  },
  {
    id: 'cat-7',
    organization_id: 'org-demo-001',
    name: 'Desertlar & Shirinliklar',
    icon: '🍰',
    sort_order: 7,
    is_active: true,
    items_count: 2,
  },
  {
    id: 'cat-8',
    organization_id: 'org-demo-001',
    name: 'Non mahsulotlari',
    icon: '🥖',
    sort_order: 8,
    is_active: true,
    items_count: 2,
  },
];

export const initialMenu: Menu[] = [
  // Milliy taomlar
  {
    id: 'menu-01',
    organization_id: 'org-demo-001',
    category_id: 'cat-1',
    name: 'To\'y Oshi (Choyxona Palov)',
    description: 'Devzira guruchi, sara lahm qo\'y go\'shti, qazi, bedana tuxumi, sariq va qizil sabzi bilan',
    image_url: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop&q=80',
    price: 4500000, // 45,000 so'm
    cook_time_minutes: 15,
    ingredients: 'Guruch devzira, qo\'y go\'shti, dumba, sabzi, noxat, mayiz, qazi',
    is_available: true,
    sort_order: 1,
  },
  {
    id: 'menu-02',
    organization_id: 'org-demo-001',
    category_id: 'cat-1',
    name: 'Samarqand Oshi',
    description: 'Qatlamli maxsus usulda damlangan oq guruchli shohona palov',
    image_url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80',
    price: 4200000, // 42,000 so'm
    cook_time_minutes: 15,
    ingredients: 'Guruch lazer, mol go\'shti, sabzi, noxat, zira',
    is_available: true,
    sort_order: 2,
  },
  {
    id: 'menu-03',
    organization_id: 'org-demo-001',
    category_id: 'cat-1',
    name: 'Qozon Kabob',
    description: 'Qizargan mayin qo\'y go\'shti qovurilgan tillarang kartoshkalar bilan',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    price: 6800000, // 68,000 so'm
    cook_time_minutes: 25,
    ingredients: 'Qo\'y qovurg\'asi, kartoshka, piyoz, ziravorlar',
    is_available: true,
    sort_order: 3,
  },
  {
    id: 'menu-04',
    organization_id: 'org-demo-001',
    category_id: 'cat-1',
    name: 'Uy Lag\'moni',
    description: 'Qo\'lda cho\'zilgan xushxo\'r xamir, lahm go\'sht va sabzavotli qayla',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
    price: 3800000, // 38,000 so'm
    cook_time_minutes: 20,
    ingredients: 'Cho\'zma lag\'mon xamiri, mol go\'shti, bolgar qalampiri, pomidor, sarimsoq',
    is_available: true,
    sort_order: 4,
  },
  {
    id: 'menu-05',
    organization_id: 'org-demo-001',
    category_id: 'cat-1',
    name: 'Manti Go\'shtli (5 dona)',
    description: 'Yupqa xamirda to\'g\'ralgan mol go\'shti va sarxil piyoz, saryog\' va qaymoq bilan',
    image_url: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&auto=format&fit=crop&q=80',
    price: 3500000, // 35,000 so'm
    cook_time_minutes: 25,
    ingredients: 'Oliy nav un, mol go\'shti, piyoz, murch, saryog\'',
    is_available: true,
    sort_order: 5,
  },

  // Kaboblar
  {
    id: 'menu-06',
    organization_id: 'org-demo-001',
    category_id: 'cat-2',
    name: 'Qiyma Shashlik (Lyulya)',
    description: 'Mayin qiymalangan qo\'y go\'shti tandirda xushbo\'y dudlangan',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    price: 2200000, // 22,000 so'm
    cook_time_minutes: 20,
    ingredients: 'Qo\'y qiymasi, dumba, piyoz, kashnich urug\'i',
    is_available: true,
    sort_order: 6,
  },
  {
    id: 'menu-07',
    organization_id: 'org-demo-001',
    category_id: 'cat-2',
    name: 'Qo\'y go\'shti Lahm Shashlik',
    description: 'Maxsus marinadlangan sarxil qo\'y go\'shti sixda pishirilgan',
    image_url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop&q=80',
    price: 2600000, // 26,000 so'm
    cook_time_minutes: 20,
    ingredients: 'Qo\'y go\'shti lahm, dumba, zira, piyoz marinadi',
    is_available: true,
    sort_order: 7,
  },
  {
    id: 'menu-08',
    organization_id: 'org-demo-001',
    category_id: 'cat-2',
    name: 'Tovuq Shashlik (File)',
    description: 'Yumshoq tovuq filesi saryog\' va sarimsoqli sousda pishirilgan',
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
    price: 2000000, // 20,000 so'm
    cook_time_minutes: 15,
    ingredients: 'Tovuq filesi, limon sharbati, zaytun moyi, paprikalar',
    is_available: true,
    sort_order: 8,
  },
  {
    id: 'menu-09',
    organization_id: 'org-demo-001',
    category_id: 'cat-2',
    name: 'Jigar Shashlik dumba bilan',
    description: 'Mayin yangi mol jigari va qo\'y dumbasi',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    price: 2200000, // 22,000 so'm
    cook_time_minutes: 15,
    ingredients: 'Mol jigari, dumba, kashnich',
    is_available: true,
    sort_order: 9,
  },
  {
    id: 'menu-10',
    organization_id: 'org-demo-001',
    category_id: 'cat-2',
    name: 'Assorti Shashlik Platter (4 kishilik)',
    description: 'Lahm, qiyma, tovuq, jigar kaboblari va qovurilgan sabzavotlar to\'plami',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    price: 15000000, // 150,000 so'm
    cook_time_minutes: 25,
    ingredients: '8 dona turli shashlik, lavash, marinadlangan piyoz, souslar',
    is_available: true,
    sort_order: 10,
  },

  // Sho'rvalar
  {
    id: 'menu-11',
    organization_id: 'org-demo-001',
    category_id: 'cat-3',
    name: 'Chuchvara Sho\'rva',
    description: 'Mitti qo\'lda tugilgan chuchvaralar tiniq go\'shtli sho\'rvada',
    image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80',
    price: 3200000, // 32,000 so'm
    cook_time_minutes: 15,
    ingredients: 'Mol go\'shti, xamir, shivit, kashnich, suzma',
    is_available: true,
    sort_order: 11,
  },
  {
    id: 'menu-12',
    organization_id: 'org-demo-001',
    category_id: 'cat-3',
    name: 'Mastava Go\'shtli',
    description: 'Xushbo\'y guruchli, sabzavotli to\'yimli milliy sho\'rva',
    image_url: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=600&auto=format&fit=crop&q=80',
    price: 3000000, // 30,000 so'm
    cook_time_minutes: 15,
    ingredients: 'Mol go\'shti, guruch, kartoshka, sabzi, qatiq',
    is_available: true,
    sort_order: 12,
  },
  {
    id: 'menu-13',
    organization_id: 'org-demo-001',
    category_id: 'cat-3',
    name: 'Qaynatma Sho\'rva',
    description: 'Qo\'y suyagi va go\'shtidan pishirilgan xushxo\'r shifobaxsh sho\'rva',
    image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
    price: 3600000, // 36,000 so'm
    cook_time_minutes: 15,
    ingredients: 'Qo\'y go\'shti suyakli, noxat, kartoshka, piyoz, ko\'katlar',
    is_available: true,
    sort_order: 13,
  },

  // Fast food
  {
    id: 'menu-14',
    organization_id: 'org-demo-001',
    category_id: 'cat-4',
    name: 'Cheeseburger Dastyor Special',
    description: '100% tabiiy mol go\'shti kotleti, cheddar pishlog\'i va maxsus sous bilan',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    price: 3600000, // 36,000 so'm
    cook_time_minutes: 15,
    ingredients: 'Mol go\'shti kotleti, brioş bulkasi, cheddar, aysberg, tomat',
    is_available: true,
    sort_order: 14,
  },
  {
    id: 'menu-15',
    organization_id: 'org-demo-001',
    category_id: 'cat-4',
    name: 'Lavash Go\'shtli Sirli',
    description: 'Qarsildoq yupqa lavashda qovurilgan go\'sht, pomidor, pishloq va sous',
    image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    price: 3200000, // 32,000 so'm
    cook_time_minutes: 12,
    ingredients: 'Mol go\'shti, lavash xamiri, pishloq, chips, tomat sousi',
    is_available: true,
    sort_order: 15,
  },
  {
    id: 'menu-16',
    organization_id: 'org-demo-001',
    category_id: 'cat-4',
    name: 'Fri Kartoshkasi',
    description: 'Tillarang qarsildoq kartoshka ketchup va pishloqli sous bilan',
    image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
    price: 1800000, // 18,000 so'm
    cook_time_minutes: 10,
    ingredients: 'Kartoshka, o\'simlik yog\'i, dengiz tuzi, souslar',
    is_available: true,
    sort_order: 16,
  },

  // Salatlar
  {
    id: 'menu-17',
    organization_id: 'org-demo-001',
    category_id: 'cat-5',
    name: 'Achchiq-Chuchuk (Shakarob)',
    description: 'Yusupov pomidori, yupqa archilgan piyoz va achchiq qalampir',
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22513?w=600&auto=format&fit=crop&q=80',
    price: 1600000, // 16,000 so'm
    cook_time_minutes: 8,
    ingredients: 'Qizil pomidor, piyoz, rayhon, qizil qalampir',
    is_available: true,
    sort_order: 17,
  },
  {
    id: 'menu-18',
    organization_id: 'org-demo-001',
    category_id: 'cat-5',
    name: 'Sezar Salati Tovuq bilan',
    description: 'Grilda pishirilgan tovuq filesi, aysberg, parmezan pishlog\'i va krutonlar',
    image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&fit=crop&q=80',
    price: 3800000, // 38,000 so'm
    cook_time_minutes: 12,
    ingredients: 'Tovuq filesi, aysberg salat, parmezan, sezar sousi, cherri pomidor',
    is_available: true,
    sort_order: 18,
  },
  {
    id: 'menu-19',
    organization_id: 'org-demo-001',
    category_id: 'cat-5',
    name: 'Yunoncha (Grecheskiy) Salat',
    description: 'Yangi sabzavotlar, fetaksa pishlog\'i va zaytun mevalari bilan',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    price: 3400000, // 34,000 so'm
    cook_time_minutes: 10,
    ingredients: 'Bodring, pomidor, fetaksa, qora zaytun, zaytun moyi, oregana',
    is_available: true,
    sort_order: 19,
  },

  // Ichimliklar & Tayyor Mahsulotlar (Bar)
  {
    id: 'menu-20',
    organization_id: 'org-demo-001',
    category_id: 'cat-6',
    item_type: 'product',
    unit: 'choynak',
    unit_amount: 1,
    name: 'Ko\'k Choy Limon va Asal bilan',
    description: '№95 oliy navli ko\'k choy sarxil limon bo\'laklari va tog\' asali bilan',
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    price: 1200000, // 12,000 so'm
    cost_price: 300000, // 3,000 so'm
    cook_time_minutes: 0,
    ingredients: 'Ko\'k choy, limon, tabiiy asal, yalpiz',
    is_available: true,
    sort_order: 20,
  },
  {
    id: 'menu-21',
    organization_id: 'org-demo-001',
    category_id: 'cat-6',
    item_type: 'product',
    unit: 'litr',
    unit_amount: 1.5,
    name: 'Coca-Cola (1.5L)',
    description: 'Klassik gazlangan salqin ichimlik, sovuq holda beriladi',
    image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    price: 1800000, // 18,000 so'm
    cost_price: 1200000, // 12,000 so'm
    cook_time_minutes: 0,
    ingredients: null,
    is_available: true,
    sort_order: 21,
  },
  {
    id: 'menu-21-b',
    organization_id: 'org-demo-001',
    category_id: 'cat-6',
    item_type: 'product',
    unit: 'litr',
    unit_amount: 0.5,
    name: 'Coca-Cola (0.5L)',
    description: 'Klassik gazlangan ichimlik 0.5L shisha/bakalashka',
    image_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&auto=format&fit=crop&q=80',
    price: 900000, // 9,000 so'm
    cost_price: 550000, // 5,500 so'm
    cook_time_minutes: 0,
    ingredients: null,
    is_available: true,
    sort_order: 22,
  },
  {
    id: 'menu-21-c',
    organization_id: 'org-demo-001',
    category_id: 'cat-6',
    item_type: 'product',
    unit: 'litr',
    unit_amount: 1.5,
    name: 'Pepsi (1.5L)',
    description: 'Muzdek tetiklashtiruvchi Pepsi',
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    price: 1700000, // 17,000 so'm
    cost_price: 1100000, // 11,000 so'm
    cook_time_minutes: 0,
    ingredients: null,
    is_available: true,
    sort_order: 23,
  },
  {
    id: 'menu-21-d',
    organization_id: 'org-demo-001',
    category_id: 'cat-6',
    item_type: 'product',
    unit: 'litr',
    unit_amount: 0.5,
    name: 'Hydrolife Gazsiz Suv (0.5L)',
    description: 'Toza tabiiy mineral ichimlik suvi',
    image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80',
    price: 500000, // 5,000 so'm
    cost_price: 250000, // 2,500 so'm
    cook_time_minutes: 0,
    ingredients: null,
    is_available: true,
    sort_order: 24,
  },
  {
    id: 'menu-22',
    organization_id: 'org-demo-001',
    category_id: 'cat-6',
    item_type: 'product',
    unit: 'litr',
    unit_amount: 1,
    name: 'Uy Muzdek Limonadi (1L)',
    description: 'Yangi siqilgan limon, apelsin sharbati va yalpizli xushbo\'y limonad',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    price: 2800000, // 28,000 so'm
    cost_price: 1000000,
    cook_time_minutes: 0,
    ingredients: 'Limon, yalpiz, shakar qiyomi, gazlangan suv, muz',
    is_available: true,
    sort_order: 25,
  },

  // Desertlar
  {
    id: 'menu-23',
    organization_id: 'org-demo-001',
    category_id: 'cat-7',
    name: 'Klassik Medovik Torti',
    description: 'Asalli yumshoq qatlamlar va nozik smetana kremi bilan',
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
    price: 2400000, // 24,000 so'm
    cost_price: 1100000,
    cook_time_minutes: 5,
    ingredients: 'Tabiiy asal, saryog\', smetana kremi, yong\'oq',
    is_available: true,
    sort_order: 26,
  },

  // Non
  {
    id: 'menu-24',
    organization_id: 'org-demo-001',
    category_id: 'cat-8',
    item_type: 'product',
    unit: 'dona',
    unit_amount: 1,
    name: 'Samarqand Qatlama Patiri',
    description: 'Issiq tandirda pishirilgan qat-qat saryog\'li shohona patir non',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    price: 1000000, // 10,000 so'm
    cost_price: 450000,
    cook_time_minutes: 0,
    ingredients: 'Oliy nav un, saryog\', sedana, sut',
    is_available: true,
    sort_order: 27,
  },
  {
    id: 'menu-25',
    organization_id: 'org-demo-001',
    category_id: 'cat-8',
    item_type: 'product',
    unit: 'dona',
    unit_amount: 1,
    name: 'Issiq Tandir Non (Obi Non)',
    description: 'Qarsildoq yangi yopilgan issiq tandir noni',
    image_url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=600&auto=format&fit=crop&q=80',
    price: 500000, // 5,000 so'm
    cost_price: 250000,
    cook_time_minutes: 0,
    ingredients: null,
    is_available: true,
    sort_order: 28,
  },
];

export const initialTables: Table[] = [
  { id: 'table-01', organization_id: 'org-demo-001', table_number: 1, assigned_waiter_id: 'user-waiter-001', waiter_name: 'Alisher Zokirov', is_active: true },
  { id: 'table-02', organization_id: 'org-demo-001', table_number: 2, assigned_waiter_id: 'user-waiter-001', waiter_name: 'Alisher Zokirov', is_active: true },
  { id: 'table-03', organization_id: 'org-demo-001', table_number: 3, assigned_waiter_id: 'user-waiter-001', waiter_name: 'Alisher Zokirov', is_active: true },
  { id: 'table-04', organization_id: 'org-demo-001', table_number: 4, assigned_waiter_id: 'user-waiter-002', waiter_name: 'Nodira Karimova', is_active: true },
  { id: 'table-05', organization_id: 'org-demo-001', table_number: 5, assigned_waiter_id: 'user-waiter-002', waiter_name: 'Nodira Karimova', is_active: true },
  { id: 'table-06', organization_id: 'org-demo-001', table_number: 6, assigned_waiter_id: 'user-waiter-002', waiter_name: 'Nodira Karimova', is_active: true },
  { id: 'table-07', organization_id: 'org-demo-001', table_number: 7, assigned_waiter_id: 'user-waiter-003', waiter_name: 'Sardor Aliyev', is_active: true },
  { id: 'table-08', organization_id: 'org-demo-001', table_number: 8, assigned_waiter_id: 'user-waiter-003', waiter_name: 'Sardor Aliyev', is_active: true },
  { id: 'table-09', organization_id: 'org-demo-001', table_number: 9, assigned_waiter_id: 'user-waiter-003', waiter_name: 'Sardor Aliyev', is_active: true },
  { id: 'table-10', organization_id: 'org-demo-001', table_number: 10, assigned_waiter_id: 'user-waiter-001', waiter_name: 'Alisher Zokirov', is_active: true },
  { id: 'table-11', organization_id: 'org-demo-001', table_number: 11, assigned_waiter_id: 'user-waiter-002', waiter_name: 'Nodira Karimova', is_active: true },
  { id: 'table-12', organization_id: 'org-demo-001', table_number: 12, assigned_waiter_id: 'user-waiter-003', waiter_name: 'Sardor Aliyev', is_active: true },
];

// Helper to generate dates relative to today
function getDateString(daysAgo: number, timeStr: string = '14:30:00'): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${timeStr}Z`;
}

export function generateInitialOrders(): Order[] {
  return [
    // Today's active and completed orders
    {
      id: 'ord-101',
      organization_id: 'org-demo-001',
      table_id: 'table-02',
      waiter_id: 'user-waiter-001',
      status: 'pending',
      total_amount: 14800000, // 148,000 so'm
      tip_amount: 1480000,
      tip_percentage: 10,
      customer_note: "Oshga ko'proq zira sepilsin, choy qaynoq bo'lsin",
      created_at: getDateString(0, '13:45:00'),
      completed_at: null,
      table: { id: 'table-02', table_number: 2, is_active: true },
      waiter: { id: 'user-waiter-001', full_name: 'Alisher Zokirov', role: 'waiter', username: 'alisher', is_active: true },
      order_items: [
        { id: 'item-101-1', order_id: 'ord-101', menu_id: 'menu-01', menu_name: 'To\'y Oshi (Choyxona Palov)', menu_price: 4500000, quantity: 2, modifications: 'Zirali', item_status: 'pending' },
        { id: 'item-101-2', order_id: 'ord-101', menu_id: 'menu-17', menu_name: 'Achchiq-Chuchuk (Shakarob)', menu_price: 1600000, quantity: 2, modifications: null, item_status: 'pending' },
        { id: 'item-101-3', order_id: 'ord-101', menu_id: 'menu-20', menu_name: 'Ko\'k Choy Limon va Asal bilan (Choynak)', menu_price: 1200000, quantity: 1, modifications: 'Qaynoq', item_status: 'pending' },
        { id: 'item-101-4', order_id: 'ord-101', menu_id: 'menu-24', menu_name: 'Samarqand Qatlama Patiri', menu_price: 1000000, quantity: 1, modifications: null, item_status: 'pending' },
      ],
    },
    {
      id: 'ord-102',
      organization_id: 'org-demo-001',
      table_id: 'table-05',
      waiter_id: 'user-waiter-002',
      status: 'cooking',
      total_amount: 21600000, // 216,000 so'm
      tip_amount: 2160000,
      tip_percentage: 10,
      customer_note: 'Shashliklar pishganroq bo\'lsin',
      created_at: getDateString(0, '13:20:00'),
      completed_at: null,
      table: { id: 'table-05', table_number: 5, is_active: true },
      waiter: { id: 'user-waiter-002', full_name: 'Nodira Karimova', role: 'waiter', username: 'nodira', is_active: true },
      order_items: [
        { id: 'item-102-1', order_id: 'ord-102', menu_id: 'menu-06', menu_name: 'Qiyma Shashlik (Lyulya)', menu_price: 2200000, quantity: 4, modifications: 'Yaxshi qizargan', item_status: 'cooking' },
        { id: 'item-102-2', order_id: 'ord-102', menu_id: 'menu-07', menu_name: 'Qo\'y go\'shti Lahm Shashlik', menu_price: 2600000, quantity: 3, modifications: null, item_status: 'cooking' },
        { id: 'item-102-3', order_id: 'ord-102', menu_id: 'menu-21', menu_name: 'Uy Muzdek Limonadi (1L)', menu_price: 2800000, quantity: 1, modifications: 'Muzli', item_status: 'cooking' },
        { id: 'item-102-4', order_id: 'ord-102', menu_id: 'menu-24', menu_name: 'Samarqand Qatlama Patiri', menu_price: 1000000, quantity: 2, modifications: null, item_status: 'cooking' },
      ],
    },
    {
      id: 'ord-103',
      organization_id: 'org-demo-001',
      table_id: 'table-08',
      waiter_id: 'user-waiter-003',
      status: 'ready',
      total_amount: 17400000, // 174,000 so'm
      tip_amount: 1740000,
      tip_percentage: 10,
      customer_note: 'VIP xona, tezda yetkazilsin',
      created_at: getDateString(0, '12:50:00'),
      completed_at: null,
      table: { id: 'table-08', table_number: 8, is_active: true },
      waiter: { id: 'user-waiter-003', full_name: 'Sardor Aliyev', role: 'waiter', username: 'sardor', is_active: true },
      order_items: [
        { id: 'item-103-1', order_id: 'ord-103', menu_id: 'menu-03', menu_name: 'Qozon Kabob', menu_price: 6800000, quantity: 2, modifications: 'Yumshoq go\'sht', item_status: 'ready' },
        { id: 'item-103-2', order_id: 'ord-103', menu_id: 'menu-18', menu_name: 'Sezar Salati Tovuq bilan', menu_price: 3800000, quantity: 1, modifications: null, item_status: 'ready' },
      ],
    },
    {
      id: 'ord-104',
      organization_id: 'org-demo-001',
      table_id: 'table-01',
      waiter_id: 'user-waiter-001',
      status: 'completed',
      total_amount: 12600000, // 126,000 so'm
      tip_amount: 1260000,
      tip_percentage: 10,
      customer_note: null,
      created_at: getDateString(0, '11:30:00'),
      completed_at: getDateString(0, '12:20:00'),
      table: { id: 'table-01', table_number: 1, is_active: true },
      waiter: { id: 'user-waiter-001', full_name: 'Alisher Zokirov', role: 'waiter', username: 'alisher', is_active: true },
      order_items: [
        { id: 'item-104-1', order_id: 'ord-104', menu_id: 'menu-04', menu_name: 'Uy Lag\'moni', menu_price: 3800000, quantity: 2, modifications: null, item_status: 'completed' },
        { id: 'item-104-2', order_id: 'ord-104', menu_id: 'menu-17', menu_name: 'Achchiq-Chuchuk (Shakarob)', menu_price: 1600000, quantity: 2, modifications: null, item_status: 'completed' },
        { id: 'item-104-3', order_id: 'ord-104', menu_id: 'menu-20', menu_name: 'Ko\'k Choy Limon va Asal bilan (Choynak)', menu_price: 1200000, quantity: 1, modifications: null, item_status: 'completed' },
        { id: 'item-104-4', order_id: 'ord-104', menu_id: 'menu-24', menu_name: 'Samarqand Qatlama Patiri', menu_price: 1000000, quantity: 1, modifications: null, item_status: 'completed' },
      ],
    },
    {
      id: 'ord-105',
      organization_id: 'org-demo-001',
      table_id: 'table-03',
      waiter_id: 'user-waiter-001',
      status: 'completed',
      total_amount: 19500000, // 195,000 so'm
      tip_amount: 1950000,
      tip_percentage: 10,
      customer_note: null,
      created_at: getDateString(0, '12:10:00'),
      completed_at: getDateString(0, '13:05:00'),
      table: { id: 'table-03', table_number: 3, is_active: true },
      waiter: { id: 'user-waiter-001', full_name: 'Alisher Zokirov', role: 'waiter', username: 'alisher', is_active: true },
      order_items: [
        { id: 'item-105-1', order_id: 'ord-105', menu_id: 'menu-01', menu_name: 'To\'y Oshi (Choyxona Palov)', menu_price: 4500000, quantity: 3, modifications: null, item_status: 'completed' },
        { id: 'item-105-2', order_id: 'ord-105', menu_id: 'menu-17', menu_name: 'Achchiq-Chuchuk (Shakarob)', menu_price: 1600000, quantity: 2, modifications: null, item_status: 'completed' },
        { id: 'item-105-3', order_id: 'ord-105', menu_id: 'menu-21', menu_name: 'Uy Muzdek Limonadi (1L)', menu_price: 2800000, quantity: 1, modifications: null, item_status: 'completed' },
      ],
    },
    {
      id: 'ord-106',
      organization_id: 'org-demo-001',
      table_id: 'table-07',
      waiter_id: 'user-waiter-003',
      status: 'completed',
      total_amount: 28000000, // 280,000 so'm
      tip_amount: 2800000,
      tip_percentage: 10,
      customer_note: null,
      created_at: getDateString(0, '12:40:00'),
      completed_at: getDateString(0, '13:40:00'),
      table: { id: 'table-07', table_number: 7, is_active: true },
      waiter: { id: 'user-waiter-003', full_name: 'Sardor Aliyev', role: 'waiter', username: 'sardor', is_active: true },
      order_items: [
        { id: 'item-106-1', order_id: 'ord-106', menu_id: 'menu-10', menu_name: 'Assorti Shashlik Platter (4 kishilik)', menu_price: 15000000, quantity: 1, modifications: null, item_status: 'completed' },
        { id: 'item-106-2', order_id: 'ord-106', menu_id: 'menu-19', menu_name: 'Yunoncha (Grecheskiy) Salat', menu_price: 3400000, quantity: 2, modifications: null, item_status: 'completed' },
        { id: 'item-106-3', order_id: 'ord-106', menu_id: 'menu-21', menu_name: 'Uy Muzdek Limonadi (1L)', menu_price: 2800000, quantity: 2, modifications: null, item_status: 'completed' },
      ],
    },

    // Yesterday's orders
    {
      id: 'ord-091',
      organization_id: 'org-demo-001',
      table_id: 'table-04',
      waiter_id: 'user-waiter-002',
      status: 'completed',
      total_amount: 15400000,
      tip_amount: 1540000,
      tip_percentage: 10,
      customer_note: null,
      created_at: getDateString(1, '12:30:00'),
      completed_at: getDateString(1, '13:20:00'),
      table: { id: 'table-04', table_number: 4, is_active: true },
      waiter: { id: 'user-waiter-002', full_name: 'Nodira Karimova', role: 'waiter', username: 'nodira', is_active: true },
      order_items: [
        { id: 'item-091-1', order_id: 'ord-091', menu_id: 'menu-01', menu_name: 'To\'y Oshi (Choyxona Palov)', menu_price: 4500000, quantity: 2, modifications: null, item_status: 'completed' },
        { id: 'item-091-2', order_id: 'ord-091', menu_id: 'menu-17', menu_name: 'Achchiq-Chuchuk (Shakarob)', menu_price: 1600000, quantity: 2, modifications: null, item_status: 'completed' },
        { id: 'item-091-3', order_id: 'ord-091', menu_id: 'menu-18', menu_name: 'Sezar Salati Tovuq bilan', menu_price: 3800000, quantity: 1, modifications: null, item_status: 'completed' },
      ],
    },
    {
      id: 'ord-092',
      organization_id: 'org-demo-001',
      table_id: 'table-02',
      waiter_id: 'user-waiter-001',
      status: 'completed',
      total_amount: 22800000,
      tip_amount: 2280000,
      tip_percentage: 10,
      customer_note: null,
      created_at: getDateString(1, '18:30:00'),
      completed_at: getDateString(1, '19:40:00'),
      table: { id: 'table-02', table_number: 2, is_active: true },
      waiter: { id: 'user-waiter-001', full_name: 'Alisher Zokirov', role: 'waiter', username: 'alisher', is_active: true },
      order_items: [
        { id: 'item-092-1', order_id: 'ord-092', menu_id: 'menu-03', menu_name: 'Qozon Kabob', menu_price: 6800000, quantity: 2, modifications: null, item_status: 'completed' },
        { id: 'item-092-2', order_id: 'ord-092', menu_id: 'menu-06', menu_name: 'Qiyma Shashlik (Lyulya)', menu_price: 2200000, quantity: 3, modifications: null, item_status: 'completed' },
        { id: 'item-092-3', order_id: 'ord-092', menu_id: 'menu-21', menu_name: 'Uy Muzdek Limonadi (1L)', menu_price: 2800000, quantity: 1, modifications: null, item_status: 'completed' },
      ],
    },
    {
      id: 'ord-093',
      organization_id: 'org-demo-001',
      table_id: 'table-09',
      waiter_id: 'user-waiter-003',
      status: 'completed',
      total_amount: 34000000,
      tip_amount: 3400000,
      tip_percentage: 10,
      customer_note: null,
      created_at: getDateString(1, '19:20:00'),
      completed_at: getDateString(1, '20:45:00'),
      table: { id: 'table-09', table_number: 9, is_active: true },
      waiter: { id: 'user-waiter-003', full_name: 'Sardor Aliyev', role: 'waiter', username: 'sardor', is_active: true },
      order_items: [
        { id: 'item-093-1', order_id: 'ord-093', menu_id: 'menu-10', menu_name: 'Assorti Shashlik Platter (4 kishilik)', menu_price: 15000000, quantity: 2, modifications: null, item_status: 'completed' },
        { id: 'item-093-2', order_id: 'ord-093', menu_id: 'menu-19', menu_name: 'Yunoncha (Grecheskiy) Salat', menu_price: 3400000, quantity: 1, modifications: null, item_status: 'completed' },
      ],
    },

    // 2 days ago
    {
      id: 'ord-081',
      organization_id: 'org-demo-001',
      table_id: 'table-01',
      waiter_id: 'user-waiter-001',
      status: 'completed',
      total_amount: 27500000,
      tip_amount: 2750000,
      tip_percentage: 10,
      customer_note: null,
      created_at: getDateString(2, '13:00:00'),
      completed_at: getDateString(2, '14:15:00'),
      table: { id: 'table-01', table_number: 1, is_active: true },
      waiter: { id: 'user-waiter-001', full_name: 'Alisher Zokirov', role: 'waiter', username: 'alisher', is_active: true },
      order_items: [
        { id: 'item-081-1', order_id: 'ord-081', menu_id: 'menu-01', menu_name: 'To\'y Oshi (Choyxona Palov)', menu_price: 4500000, quantity: 4, modifications: null, item_status: 'completed' },
        { id: 'item-081-2', order_id: 'ord-081', menu_id: 'menu-17', menu_name: 'Achchiq-Chuchuk (Shakarob)', menu_price: 1600000, quantity: 3, modifications: null, item_status: 'completed' },
        { id: 'item-081-3', order_id: 'ord-081', menu_id: 'menu-21', menu_name: 'Uy Muzdek Limonadi (1L)', menu_price: 2800000, quantity: 1, modifications: null, item_status: 'completed' },
      ],
    },
    {
      id: 'ord-082',
      organization_id: 'org-demo-001',
      table_id: 'table-06',
      waiter_id: 'user-waiter-002',
      status: 'completed',
      total_amount: 32000000,
      tip_amount: 3200000,
      tip_percentage: 10,
      customer_note: null,
      created_at: getDateString(2, '19:10:00'),
      completed_at: getDateString(2, '20:30:00'),
      table: { id: 'table-06', table_number: 6, is_active: true },
      waiter: { id: 'user-waiter-002', full_name: 'Nodira Karimova', role: 'waiter', username: 'nodira', is_active: true },
      order_items: [
        { id: 'item-082-1', order_id: 'ord-082', menu_id: 'menu-03', menu_name: 'Qozon Kabob', menu_price: 6800000, quantity: 3, modifications: null, item_status: 'completed' },
        { id: 'item-082-2', order_id: 'ord-082', menu_id: 'menu-18', menu_name: 'Sezar Salati Tovuq bilan', menu_price: 3800000, quantity: 2, modifications: null, item_status: 'completed' },
      ],
    },

    // 3 days ago
    {
      id: 'ord-071',
      organization_id: 'org-demo-001',
      table_id: 'table-03',
      waiter_id: 'user-waiter-001',
      status: 'completed',
      total_amount: 38500000,
      tip_amount: 3850000,
      tip_percentage: 10,
      customer_note: null,
      created_at: getDateString(3, '18:45:00'),
      completed_at: getDateString(3, '20:10:00'),
      table: { id: 'table-03', table_number: 3, is_active: true },
      waiter: { id: 'user-waiter-001', full_name: 'Alisher Zokirov', role: 'waiter', username: 'alisher', is_active: true },
      order_items: [
        { id: 'item-071-1', order_id: 'ord-071', menu_id: 'menu-10', menu_name: 'Assorti Shashlik Platter (4 kishilik)', menu_price: 15000000, quantity: 2, modifications: null, item_status: 'completed' },
        { id: 'item-071-2', order_id: 'ord-071', menu_id: 'menu-07', menu_name: 'Qo\'y go\'shti Lahm Shashlik', menu_price: 2600000, quantity: 2, modifications: null, item_status: 'completed' },
      ],
    },

    // 4 days ago
    {
      id: 'ord-061',
      organization_id: 'org-demo-001',
      table_id: 'table-05',
      waiter_id: 'user-waiter-002',
      status: 'completed',
      total_amount: 24200000,
      tip_amount: 2420000,
      tip_percentage: 10,
      customer_note: null,
      created_at: getDateString(4, '13:15:00'),
      completed_at: getDateString(4, '14:20:00'),
      table: { id: 'table-05', table_number: 5, is_active: true },
      waiter: { id: 'user-waiter-002', full_name: 'Nodira Karimova', role: 'waiter', username: 'nodira', is_active: true },
      order_items: [
        { id: 'item-061-1', order_id: 'ord-061', menu_id: 'menu-01', menu_name: 'To\'y Oshi (Choyxona Palov)', menu_price: 4500000, quantity: 3, modifications: null, item_status: 'completed' },
        { id: 'item-061-2', order_id: 'ord-061', menu_id: 'menu-05', menu_name: 'Manti Go\'shtli (5 dona)', menu_price: 3500000, quantity: 2, modifications: null, item_status: 'completed' },
      ],
    },

    // 5 days ago
    {
      id: 'ord-051',
      organization_id: 'org-demo-001',
      table_id: 'table-08',
      waiter_id: 'user-waiter-003',
      status: 'completed',
      total_amount: 41000000,
      tip_amount: 4100000,
      tip_percentage: 10,
      customer_note: null,
      created_at: getDateString(5, '19:30:00'),
      completed_at: getDateString(5, '21:00:00'),
      table: { id: 'table-08', table_number: 8, is_active: true },
      waiter: { id: 'user-waiter-003', full_name: 'Sardor Aliyev', role: 'waiter', username: 'sardor', is_active: true },
      order_items: [
        { id: 'item-051-1', order_id: 'ord-051', menu_id: 'menu-10', menu_name: 'Assorti Shashlik Platter (4 kishilik)', menu_price: 15000000, quantity: 2, modifications: null, item_status: 'completed' },
        { id: 'item-051-2', order_id: 'ord-051', menu_id: 'menu-03', menu_name: 'Qozon Kabob', menu_price: 6800000, quantity: 1, modifications: null, item_status: 'completed' },
      ],
    },

    // 6 days ago
    {
      id: 'ord-041',
      organization_id: 'org-demo-001',
      table_id: 'table-02',
      waiter_id: 'user-waiter-001',
      status: 'completed',
      total_amount: 29800000,
      tip_amount: 2980000,
      tip_percentage: 10,
      customer_note: null,
      created_at: getDateString(6, '18:00:00'),
      completed_at: getDateString(6, '19:30:00'),
      table: { id: 'table-02', table_number: 2, is_active: true },
      waiter: { id: 'user-waiter-001', full_name: 'Alisher Zokirov', role: 'waiter', username: 'alisher', is_active: true },
      order_items: [
        { id: 'item-041-1', order_id: 'ord-041', menu_id: 'menu-01', menu_name: 'To\'y Oshi (Choyxona Palov)', menu_price: 4500000, quantity: 4, modifications: null, item_status: 'completed' },
        { id: 'item-041-2', order_id: 'ord-041', menu_id: 'menu-06', menu_name: 'Qiyma Shashlik (Lyulya)', menu_price: 2200000, quantity: 4, modifications: null, item_status: 'completed' },
      ],
    },
  ];
}

export function generateInitialExpenses(): Expense[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const d1 = new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0];
  const d2 = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];
  const d3 = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0];
  const d4 = new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0];
  const d5 = new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0];
  const d6 = new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0];

  return [
    // Today's expenses
    {
      id: 'exp-001',
      organization_id: 'org-demo-001',
      category: 'ingredients',
      category_label: 'Masalliqlar',
      title: 'Yangi mol va qo\'y go\'shti (30 kg)',
      amount: 270000000, // 2,700,000 so'm
      date: todayStr,
      created_at: `${todayStr}T08:30:00Z`,
      note: 'Chorsu bozoridan yangi go\'sht',
      created_by: 'Jasur Rahimov',
    },
    {
      id: 'exp-002',
      organization_id: 'org-demo-001',
      category: 'ingredients',
      category_label: 'Masalliqlar',
      title: 'Sabzavot va mevalar (kartoshka, sabzi, pomidor)',
      amount: 68000000, // 680,000 so'm
      date: todayStr,
      created_at: `${todayStr}T09:00:00Z`,
      note: 'Osh va salatlar uchun',
      created_by: 'Jasur Rahimov',
    },
    {
      id: 'exp-003',
      organization_id: 'org-demo-001',
      category: 'household',
      category_label: 'Xo\'jalik',
      title: 'Oshxona va zal tozalik vositalari',
      amount: 32000000, // 320,000 so'm
      date: todayStr,
      created_at: `${todayStr}T10:15:00Z`,
      note: 'Salfetkalar, yuvish vositalari',
      created_by: 'Madina Usmonova',
    },
    {
      id: 'exp-004',
      organization_id: 'org-demo-001',
      category: 'salary',
      category_label: 'Ish haqi',
      title: 'Ofitsiantlar kunlik choypuli/avansi',
      amount: 45000000, // 450,000 so'm
      date: todayStr,
      created_at: `${todayStr}T11:00:00Z`,
      note: 'Alisher va Nodiraga',
      created_by: 'Jasur Rahimov',
    },

    // Yesterday
    {
      id: 'exp-010',
      organization_id: 'org-demo-001',
      category: 'ingredients',
      category_label: 'Masalliqlar',
      title: 'Devzira guruch va yog\' zaxirasi (2 qop)',
      amount: 195000000, // 1,950,000 so'm
      date: d1,
      created_at: `${d1}T08:00:00Z`,
      note: 'Qirqqiz devzira guruchi',
      created_by: 'Jasur Rahimov',
    },
    {
      id: 'exp-011',
      organization_id: 'org-demo-001',
      category: 'utilities',
      category_label: 'Kommunal',
      title: 'Elektr energiyasi va tabiiy gaz',
      amount: 140000000, // 1,400,000 so'm
      date: d1,
      created_at: `${d1}T11:00:00Z`,
      note: 'Oylik kommunal to\'lov',
      created_by: 'Madina Usmonova',
    },

    // 2 days ago
    {
      id: 'exp-020',
      organization_id: 'org-demo-001',
      category: 'ingredients',
      category_label: 'Masalliqlar',
      title: 'Go\'sht va shashlik marinad masalliqlari',
      amount: 220000000, // 2,200,000 so'm
      date: d2,
      created_at: `${d2}T08:30:00Z`,
      note: 'Lahm va dumba go\'shti',
      created_by: 'Jasur Rahimov',
    },

    // 3 days ago
    {
      id: 'exp-030',
      organization_id: 'org-demo-001',
      category: 'salary',
      category_label: 'Ish haqi',
      title: 'Bosh oshpaz va yordamchilar haftalik maoshi',
      amount: 350000000, // 3,500,000 so'm
      date: d3,
      created_at: `${d3}T16:00:00Z`,
      note: 'Feruz oshpaz brigadasiga',
      created_by: 'Jasur Rahimov',
    },
    {
      id: 'exp-031',
      organization_id: 'org-demo-001',
      category: 'ingredients',
      category_label: 'Masalliqlar',
      title: 'Salqin ichimliklar va sharbatlar zaxirasi',
      amount: 85000000, // 850,000 so'm
      date: d3,
      created_at: `${d3}T10:00:00Z`,
      note: 'Distributor orqali',
      created_by: 'Madina Usmonova',
    },

    // 4 days ago
    {
      id: 'exp-040',
      organization_id: 'org-demo-001',
      category: 'ingredients',
      category_label: 'Masalliqlar',
      title: 'Go\'sht va qazi mahsulotlari',
      amount: 180000000,
      date: d4,
      created_at: `${d4}T09:00:00Z`,
      created_by: 'Jasur Rahimov',
    },

    // 5 days ago
    {
      id: 'exp-050',
      organization_id: 'org-demo-001',
      category: 'rent',
      category_label: 'Ijara',
      title: 'Restoran binosi ijarasi (avans)',
      amount: 500000000, // 5,000,000 so'm
      date: d5,
      created_at: `${d5}T12:00:00Z`,
      note: 'Bino egasiga oylik to\'lov qismi',
      created_by: 'Jasur Rahimov',
    },

    // 6 days ago
    {
      id: 'exp-060',
      organization_id: 'org-demo-001',
      category: 'household',
      category_label: 'Xo\'jalik',
      title: 'Idish-tovoqlar va yangi qadahlar to\'plami',
      amount: 95000000,
      date: d6,
      created_at: `${d6}T14:00:00Z`,
      created_by: 'Madina Usmonova',
    },
  ];
}
