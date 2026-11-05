const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Multer config for image uploads
const uploadDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'public', 'uploads');
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Database helpers
const DB_PATH = path.join(__dirname, 'data', 'products.json');
const ADMIN_PASSWORD = bcrypt.hashSync('admin123', 10);
let memoryProducts = null;

function readDB() {
  if (memoryProducts && memoryProducts.length > 0) return memoryProducts;
  try {
    if (fs.existsSync(DB_PATH)) {
      memoryProducts = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      return memoryProducts;
    }
  } catch (err) {
    console.warn('readDB fallback:', err.message);
  }
  return memoryProducts || [];
}

function writeDB(data) {
  memoryProducts = data;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('Filesystem write failed (read-only environment), falling back to in-memory state.');
  }
}

// Seed data
function seedDatabase() {
  if (readDB().length > 0) return;
  const products = [
    {
      id: uuidv4(), name: "Wireless Bluetooth Headphones Pro", description: "Premium noise-cancelling wireless headphones with 40-hour battery life, Hi-Res audio, and ultra-comfortable memory foam ear cushions. Features advanced ANC technology for immersive sound experience.", price: 79.99, originalPrice: 129.99, category: "Electronics", image: "https://picsum.photos/seed/headphones/400/400", images: ["https://picsum.photos/seed/headphones1/400/400","https://picsum.photos/seed/headphones2/400/400"], rating: 4.5, reviewCount: 2847, inStock: true, features: ["Active Noise Cancellation","40-Hour Battery Life","Hi-Res Audio Certified","Bluetooth 5.3","Foldable Design","Built-in Microphone"], brand: "SoundMax", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "Smart Watch Ultra Fitness Tracker", description: "Advanced smartwatch with GPS, heart rate monitor, blood oxygen sensor, and 100+ workout modes. Water-resistant to 50m with always-on AMOLED display.", price: 199.99, originalPrice: 349.99, category: "Electronics", image: "https://picsum.photos/seed/smartwatch/400/400", images: [], rating: 4.3, reviewCount: 5621, inStock: true, features: ["GPS Tracking","Heart Rate Monitor","Blood Oxygen Sensor","100+ Workout Modes","Water Resistant 50m","7-Day Battery"], brand: "TechFit", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "4K Ultra HD Smart TV 55-inch", description: "Stunning 55-inch 4K UHD display with Dolby Vision, HDR10+, and built-in streaming apps. Features AI-powered upscaling and game mode with 120Hz refresh rate.", price: 449.99, originalPrice: 699.99, category: "Electronics", image: "https://picsum.photos/seed/tv55/400/400", images: [], rating: 4.6, reviewCount: 8934, inStock: true, features: ["4K Ultra HD Resolution","Dolby Vision & HDR10+","Built-in Streaming Apps","AI Upscaling","120Hz Game Mode","Voice Control"], brand: "ViewPro", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "Men's Classic Fit Cotton Polo Shirt", description: "Premium 100% cotton polo shirt with a classic fit. Features ribbed collar and cuffs, two-button placket, and side vents for comfort. Available in multiple colors.", price: 24.99, originalPrice: 45.00, category: "Clothing", image: "https://picsum.photos/seed/polo/400/400", images: [], rating: 4.2, reviewCount: 3156, inStock: true, features: ["100% Premium Cotton","Classic Fit","Ribbed Collar & Cuffs","Machine Washable","Side Vents","Multiple Colors"], brand: "UrbanStyle", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "Women's Running Shoes - CloudFoam", description: "Lightweight running shoes with responsive CloudFoam cushioning, breathable mesh upper, and durable rubber outsole. Perfect for daily runs and gym workouts.", price: 64.99, originalPrice: 89.99, category: "Clothing", image: "https://picsum.photos/seed/shoes/400/400", images: [], rating: 4.4, reviewCount: 7823, inStock: true, features: ["CloudFoam Cushioning","Breathable Mesh Upper","Rubber Outsole","Lightweight Design","Arch Support","Available in 8 Colors"], brand: "RunElite", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "Professional Chef Knife Set - 15 Piece", description: "Complete professional-grade knife set with high-carbon stainless steel blades, ergonomic handles, and wooden storage block. Includes chef's knife, bread knife, utility knife, and more.", price: 89.99, originalPrice: 149.99, category: "Home & Kitchen", image: "https://picsum.photos/seed/knives/400/400", images: [], rating: 4.7, reviewCount: 4521, inStock: true, features: ["High-Carbon Stainless Steel","15-Piece Complete Set","Ergonomic Handles","Wooden Storage Block","Dishwasher Safe","Lifetime Warranty"], brand: "ChefPro", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "Robot Vacuum Cleaner with Mop", description: "Smart robot vacuum and mop combo with LiDAR navigation, 3000Pa suction, and auto-empty station. Works with Alexa and Google Home for voice control.", price: 299.99, originalPrice: 499.99, category: "Home & Kitchen", image: "https://picsum.photos/seed/vacuum/400/400", images: [], rating: 4.4, reviewCount: 6234, inStock: true, features: ["LiDAR Navigation","3000Pa Suction Power","Auto-Empty Station","Vacuum & Mop Combo","Voice Control Compatible","Smart App Control"], brand: "CleanBot", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "The Art of Programming - Complete Edition", description: "Comprehensive guide to modern software development covering algorithms, data structures, design patterns, and best practices. Updated for 2026 with new chapters on AI and cloud computing.", price: 34.99, originalPrice: 59.99, category: "Books", image: "https://picsum.photos/seed/progbook/400/400", images: [], rating: 4.8, reviewCount: 12543, inStock: true, features: ["800+ Pages","Updated 2026 Edition","AI & Cloud Chapters","Practice Exercises","Online Resources","Hardcover"], brand: "TechPress", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "Yoga Mat Premium Non-Slip", description: "Extra thick 6mm premium yoga mat with non-slip texture on both sides. Made from eco-friendly TPE material. Includes carrying strap and alignment marks.", price: 29.99, originalPrice: 49.99, category: "Sports", image: "https://picsum.photos/seed/yogamat/400/400", images: [], rating: 4.5, reviewCount: 9876, inStock: true, features: ["6mm Extra Thick","Non-Slip Both Sides","Eco-Friendly TPE","Carrying Strap Included","Alignment Marks","72 x 24 inches"], brand: "ZenFlex", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "Adjustable Dumbbell Set 5-52.5 lbs", description: "Space-saving adjustable dumbbells that replace 15 sets of weights. Quick-change mechanism lets you switch weights in seconds. Durable steel construction with comfortable grip.", price: 249.99, originalPrice: 399.99, category: "Sports", image: "https://picsum.photos/seed/dumbbell/400/400", images: [], rating: 4.6, reviewCount: 3456, inStock: true, features: ["5-52.5 lbs Range","Replaces 15 Dumbbell Sets","Quick-Change Mechanism","Steel Construction","Comfortable Grip","Compact Storage Tray"], brand: "IronForge", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "Vitamin C Serum with Hyaluronic Acid", description: "Professional-grade facial serum with 20% Vitamin C, Hyaluronic Acid, and Vitamin E. Brightens skin, reduces wrinkles, and provides deep hydration. Suitable for all skin types.", price: 19.99, originalPrice: 35.99, category: "Beauty", image: "https://picsum.photos/seed/serum/400/400", images: [], rating: 4.3, reviewCount: 15678, inStock: true, features: ["20% Vitamin C","Hyaluronic Acid","Vitamin E Complex","All Skin Types","Paraben-Free","Cruelty-Free"], brand: "GlowLab", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "Portable Bluetooth Speaker Waterproof", description: "Rugged waterproof Bluetooth speaker with 360° sound, 24-hour battery life, and built-in power bank. IP67 rated for outdoor adventures. Pairs with up to 100 speakers.", price: 49.99, originalPrice: 79.99, category: "Electronics", image: "https://picsum.photos/seed/speaker/400/400", images: [], rating: 4.5, reviewCount: 11234, inStock: true, features: ["360° Sound","24-Hour Battery","IP67 Waterproof","Built-in Power Bank","Party Mode (100 Speakers)","USB-C Charging"], brand: "BoomBox", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "Stainless Steel Water Bottle 32oz", description: "Triple-wall vacuum insulated water bottle keeps drinks cold 24 hours or hot 12 hours. BPA-free, leak-proof lid with straw. Available in 15 stunning colors.", price: 27.99, originalPrice: 39.99, category: "Sports", image: "https://picsum.photos/seed/bottle/400/400", images: [], rating: 4.7, reviewCount: 23456, inStock: true, features: ["Triple-Wall Insulation","Cold 24hrs / Hot 12hrs","BPA-Free","Leak-Proof Lid","32oz Capacity","15 Color Options"], brand: "HydroElite", createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(), name: "Espresso Machine with Milk Frother", description: "Professional barista-quality espresso machine with 15-bar pressure pump and integrated milk frother. Features programmable settings, auto-cleaning, and removable water tank.", price: 159.99, originalPrice: 249.99, category: "Home & Kitchen", image: "https://picsum.photos/seed/espresso/400/400", images: [], rating: 4.4, reviewCount: 5678, inStock: true, features: ["15-Bar Pressure Pump","Integrated Milk Frother","Programmable Settings","Auto-Cleaning","Removable Water Tank","Compact Design"], brand: "BrewMaster", createdAt: new Date().toISOString()
    }
  ];
  writeDB(products);
  console.log(`✅ Database seeded with ${products.length} products`);
}

// ─── API ROUTES ───

// Get all products (with filtering, searching, sorting)
app.get('/api/products', (req, res) => {
  let products = readDB();
  const { category, search, sort, minPrice, maxPrice, minRating, brand } = req.query;

  if (category) products = products.filter(p => p.category === category);
  if (brand) products = products.filter(p => p.brand === brand);
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }
  if (minPrice) products = products.filter(p => p.price >= parseFloat(minPrice));
  if (maxPrice) products = products.filter(p => p.price <= parseFloat(maxPrice));
  if (minRating) products = products.filter(p => p.rating >= parseFloat(minRating));

  if (sort) {
    switch (sort) {
      case 'price-asc': products.sort((a, b) => a.price - b.price); break;
      case 'price-desc': products.sort((a, b) => b.price - a.price); break;
      case 'rating': products.sort((a, b) => b.rating - a.rating); break;
      case 'name': products.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'newest': products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'reviews': products.sort((a, b) => b.reviewCount - a.reviewCount); break;
    }
  }

  res.json(products);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const products = readDB();
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Create product
app.post('/api/products', upload.single('image'), (req, res) => {
  const products = readDB();
  const product = {
    id: uuidv4(),
    name: req.body.name,
    description: req.body.description || '',
    price: parseFloat(req.body.price),
    originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : null,
    category: req.body.category || 'General',
    image: req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || 'https://picsum.photos/seed/default/400/400'),
    images: [],
    rating: parseFloat(req.body.rating) || 4.0,
    reviewCount: parseInt(req.body.reviewCount) || 0,
    inStock: req.body.inStock !== 'false',
    features: req.body.features ? req.body.features.split(',').map(f => f.trim()).filter(Boolean) : [],
    brand: req.body.brand || 'Generic',
    createdAt: new Date().toISOString()
  };
  products.push(product);
  writeDB(products);
  res.status(201).json(product);
});

// Update product
app.put('/api/products/:id', upload.single('image'), (req, res) => {
  const products = readDB();
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  const existing = products[idx];
  products[idx] = {
    ...existing,
    name: req.body.name || existing.name,
    description: req.body.description !== undefined ? req.body.description : existing.description,
    price: req.body.price ? parseFloat(req.body.price) : existing.price,
    originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : existing.originalPrice,
    category: req.body.category || existing.category,
    image: req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || existing.image),
    rating: req.body.rating ? parseFloat(req.body.rating) : existing.rating,
    reviewCount: req.body.reviewCount ? parseInt(req.body.reviewCount) : existing.reviewCount,
    inStock: req.body.inStock !== undefined ? req.body.inStock !== 'false' : existing.inStock,
    features: req.body.features ? req.body.features.split(',').map(f => f.trim()).filter(Boolean) : existing.features,
    brand: req.body.brand || existing.brand
  };
  writeDB(products);
  res.json(products[idx]);
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  let products = readDB();
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(idx, 1);
  writeDB(products);
  res.json({ message: 'Product deleted' });
});

// Get categories
app.get('/api/categories', (req, res) => {
  const products = readDB();
  const categories = [...new Set(products.map(p => p.category))].sort();
  res.json(categories);
});

// Get brands
app.get('/api/brands', (req, res) => {
  const products = readDB();
  const brands = [...new Set(products.map(p => p.brand))].sort();
  res.json(brands);
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (bcrypt.compareSync(password || '', ADMIN_PASSWORD)) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// Serve SPA pages
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
seedDatabase();

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🛒 Camazon is running at http://localhost:${PORT}`);
    console.log(`📦 Admin panel at http://localhost:${PORT}/admin/`);
    console.log(`🔑 Default admin password: admin123\n`);
  });
}

module.exports = app;

