const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const archiver = require('archiver');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sendOrderApprovedEmail } = require('./emailService');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const app = express();

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow uploaded files to load cross-origin
    contentSecurityPolicy: false // Disable CSP in dev (configure properly for production)
}));

// CORS - restrict to allowed origins
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://127.0.0.1:5173'
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc) in dev
        if (!origin && !isProduction) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    credentials: true
};

app.use(cors(corsOptions));

// Stripe functionality removed

app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(cookieParser());

// Rate limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: { message: 'Too many attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 requests per 15 min
    message: { message: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply general rate limit to all routes
app.use('/api/', generalLimiter);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E6) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|mp4|mp3|wav|fbx|glb|gltf|obj|blend|svg|zip|rar|7z/i;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        if (ext) cb(null, true);
        else cb(new Error('File type not allowed'));
    }
});

// Session Configuration
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DATABASE_URL,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 20, // 20 minutes
        secure: isProduction, // HTTPS only in production
        httpOnly: true,
        sameSite: isProduction ? 'strict' : 'lax'
    }
}));

if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not defined in .env');
}

mongoose.connect(process.env.DATABASE_URL)
    .then(() => {
        console.log('MongoDB connection established');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
    });

// Models
const UserSchema = new mongoose.Schema({
    fullname: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);

const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    fullname: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    }
});

const Profile = mongoose.model('Profile', ProfileSchema);

// JWT Secret - MUST be set in .env, no fallback
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not defined in .env');
    process.exit(1);
}

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    if (token === 'undefined' || token === 'null') token = undefined;
    if (!token) token = req.cookies.token;

    if (!token) return res.status(401).json({ message: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                res.clearCookie('token');
                return res.status(401).json({ message: 'Session expired. Please login again.' });
            }
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Rail Works API is running' });
});

app.post('/api/register', authLimiter, async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        // Input validation
        if (!fullname || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Password strength validation
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        const savedUser = await user.save();

        const profile = new Profile({
            user: savedUser._id,
            fullname: fullname.trim(),
            phoneNumber: ''
        });

        await profile.save();

        const token = jwt.sign({ id: savedUser._id }, JWT_SECRET, { expiresIn: '20m' });
        res.status(201).json({ message: 'User created successfully', token: token, userId: savedUser._id });
    } catch (error) {
        console.error('Registration Error:', error.message);
        res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
});

app.post('/api/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '20m' });

        // Fetch profile (JOIN) or fall back to User doc for legacy users
        let profile = await Profile.findOne({ user: user._id });

        let userFullname, userPhone;
        if (profile) {
            userFullname = profile.fullname;
            userPhone = profile.phoneNumber;
        } else {
            userFullname = user.fullname || '';
            userPhone = user.phoneNumber || '';
        }

        const userData = {
            id: user._id,
            email: user.email,
            fullname: userFullname,
            phoneNumber: userPhone
        };

        // Store user in session
        req.session.user = userData;

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 1000 * 60 * 20 // 20 minutes
        });

        res.json({
            message: 'Logged in successfully',
            token: token,
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Login failed. Please try again.' });
    }
});

const handleForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (user) {
            // Mock sending email
            return res.json({ message: 'Password reset link sent to your email' });
        }

        res.status(404).json({ message: 'Email not found' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

app.post('/api/forgot-password', handleForgotPassword);
app.post('/api/auth/forgot-password', handleForgotPassword);

app.get('/api/me', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.clearCookie('token');
        res.clearCookie('connect.sid'); // default session cookie name
        res.json({ message: 'Logged out successfully' });
    });
});

app.post('/api/update-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user) {
            const hashedPassword = await bcrypt.hash(password, 12);
            user.password = hashedPassword;
            await user.save();
            return res.json({ message: 'Password updated successfully' });
        }

        res.status(404).json({ message: 'User not found' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/update-profile', async (req, res) => {
    try {
        const { userId, fullname, email, phoneNumber, currentPassword, newPassword } = req.body;



        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find or create Profile
        let profile = await Profile.findOne({ user: user._id });
        if (!profile) {
            profile = new Profile({
                user: user._id,
                fullname: user.fullname || fullname || 'User',
                phoneNumber: user.phoneNumber || ''
            });
            await profile.save();
        }

        // Verify Current Password if changing password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required to change password' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Incorrect current password' });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            user.password = hashedPassword;
        }

        // Update User table fields (email)
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }

        // Update BOTH tables to keep them in sync
        // User table
        if (fullname) user.fullname = fullname;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        await user.save();

        // Profile table (JOIN update)
        if (fullname) profile.fullname = fullname;
        if (phoneNumber !== undefined) profile.phoneNumber = phoneNumber;
        await profile.save();

        // Build response with joined data
        const updatedUserData = {
            id: user._id,
            fullname: profile.fullname,
            email: user.email,
            phoneNumber: profile.phoneNumber
        };


        res.json({
            message: 'Profile updated successfully',
            user: updatedUserData
        });
    } catch (error) {
        console.error('Update Profile Error:', error.message);
        res.status(500).json({ message: 'Profile update failed. Please try again.' });
    }
});

const ProductSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true }, // Keeping manual ID for existing frontend compatibility
    name: String,
    category: String,
    subcategory: { type: String, default: '' },
    price: String,
    rating: Number,
    image: String,
    description: String,
    features: [String],
    mediaType: { type: String, enum: ['image', 'video', '3d', 'audio', 'zip'], default: 'image' },
    mediaUrl: String,
    driveUrl: { type: String, default: '' } // Google Drive / OneDrive link for 3D model files
});
const Product = mongoose.model('Product', ProductSchema);

const ContactSchema = new mongoose.Schema({
    name: String,
    email: String,
    subject: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', ContactSchema);

// Category Schema
const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    subcategories: [{
        name: { type: String, required: true },
        description: { type: String, default: '' }
    }],
    createdAt: { type: Date, default: Date.now }
});
const Category = mongoose.model('Category', CategorySchema);

// Review Schema
const ReviewSchema = new mongoose.Schema({
    productId: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});
// One review per user per product
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
const Review = mongoose.model('Review', ReviewSchema);

// Cart Schema
const CartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: Number, required: true },
        quantity: { type: Number, default: 1, min: 1 },
        addedAt: { type: Date, default: Date.now }
    }],
    updatedAt: { type: Date, default: Date.now }
});
const Cart = mongoose.model('Cart', CartSchema);

// Order Schema (Digital Products - Manual Payment)
const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    mobile: { type: String, default: '' },
    items: [{
        productId: { type: Number, required: true },
        name: String,
        price: String,
        quantity: Number,
        image: String,
        downloadUrl: String,
        driveUrl: { type: String, default: '' }
    }],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'manual' },
    transactionId: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
    emailStatus: { type: String, default: 'Not Sent' },
    adminNote: String,
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

// Admin Middleware - checks if user is admin
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Seeding Data
const initialProducts = [
    // Existing Data (Refined with types)
    { id: 1, name: "High-Performance VM", category: "Compute", price: "₹3000/mo", rating: 4.8, image: "https://images.unsplash.com/photo-1558494949-ef526b01201b?auto=format&fit=crop&q=80&w=1000", description: "Dedicated vCPU instances for intensive workloads.", features: ["8 vCPU Cores", "32 GB RAM"], mediaType: "3d", mediaUrl: "/1769954393_ICFMeasurement.fbx" },
    { id: 2, name: "S3 Object Storage", category: "Storage", price: "₹2/GB", rating: 4.9, image: "https://images.unsplash.com/photo-1628258813555-5dc4d5c0e470?auto=format&fit=crop&q=80&w=1000", description: "Scalable storage for data lakes.", features: ["Unlimited Scalability"], mediaType: "image", mediaUrl: "" },

    // New Media Types
    { id: 7, name: "Intro to Cloud Computing", category: "Education", price: "₹1500", rating: 4.7, image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000", description: "Learn the basics of cloud infrastructure.", features: ["2 Hours Video", "Certificate"], mediaType: "video", mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { id: 8, name: "Server Room Ambience", category: "Audio", price: "₹400", rating: 4.5, image: "https://images.unsplash.com/photo-1558494949-ef526b01201b?auto=format&fit=crop&q=80&w=1000", description: "High quality audio recording of a server room.", features: ["Lossless WAV", "Use commercially"], mediaType: "audio", mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
];

const seedProducts = async () => {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            await Product.insertMany(initialProducts);
            console.log('Database seeded with initial products');
        }
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

// Seed on startup is handled below after admin seed


app.get('/api/products', async (req, res) => {
    try {
        const { category, subcategory, limit, sort } = req.query;
        let query = {};
        if (category) {
            query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }
        if (subcategory) {
            query.subcategory = { $regex: new RegExp(`^${subcategory}$`, 'i') };
        }
        // Exclude private driveUrl from public catalog for security
        let productQuery = Product.find(query).select('-driveUrl');
        if (sort === 'rating') {
            productQuery = productQuery.sort({ rating: -1 });
        } else {
            productQuery = productQuery.sort({ id: 1 });
        }
        if (limit) {
            const parsedLimit = parseInt(limit);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                productQuery = productQuery.limit(parsedLimit);
            }
        }
        const products = await productQuery;
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        // Exclude private driveUrl from public details for security
        const product = await Product.findOne({ id: parseInt(req.params.id) }).select('-driveUrl');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product' });
    }
});

// --- Reviews ---
// Get reviews for a product
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: parseInt(req.params.id) })
            .populate('userId', 'fullname email')
            .sort({ createdAt: -1 });
        const avg = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;
        res.json({ reviews, averageRating: parseFloat(avg), totalReviews: reviews.length });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
});

// Submit a review (authenticated user)
app.post('/api/products/:id/reviews', authenticateToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }
        const productId = parseInt(req.params.id);
        const product = await Product.findOne({ id: productId });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Check if user already reviewed
        const existing = await Review.findOne({ productId, userId: req.user.id });
        if (existing) {
            // Update existing review
            existing.rating = rating;
            existing.comment = comment || '';
            await existing.save();

            // Update product average rating
            const allReviews = await Review.find({ productId });
            const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
            await Product.updateOne({ id: productId }, { rating: parseFloat(avg.toFixed(1)) });

            return res.json({ message: 'Review updated', review: existing });
        }

        const review = new Review({
            productId,
            userId: req.user.id,
            rating,
            comment: comment || ''
        });
        await review.save();

        // Update product average rating
        const allReviews = await Review.find({ productId });
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await Product.updateOne({ id: productId }, { rating: parseFloat(avg.toFixed(1)) });

        res.status(201).json({ message: 'Review submitted', review });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }
        res.status(500).json({ message: 'Error submitting review', error: error.message });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        const contact = new Contact({ name, email, subject, message });
        await contact.save();
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending message' });
    }
});

// ===================== CART ROUTES =====================
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.json({ items: [] });

        // Populate product details manually since we use custom 'id' for products
        const productIds = cart.items.map(item => item.productId);
        const products = await Product.find({ id: { $in: productIds } });

        const validItems = cart.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return product ? { ...item.toObject(), product } : null;
        }).filter(Boolean);

        res.json({ items: validItems, cartId: cart._id });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart' });
    }
});

app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        let cart = await Cart.findOne({ userId: req.user.id });

        if (!cart) {
            cart = new Cart({ userId: req.user.id, items: [] });
        }

        const itemIndex = cart.items.findIndex(p => p.productId === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, quantity });
        }

        cart.updatedAt = Date.now();
        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error adding to cart' });
    }
});

app.put('/api/cart/:productId', authenticateToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const itemIndex = cart.items.findIndex(p => p.productId === parseInt(req.params.productId));
        if (itemIndex > -1) {
            if (quantity > 0) {
                cart.items[itemIndex].quantity = quantity;
            } else {
                cart.items.splice(itemIndex, 1);
            }
            cart.updatedAt = Date.now();
            await cart.save();
            return res.json(cart);
        }
        res.status(404).json({ message: 'Item not found in cart' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating cart' });
    }
});

app.delete('/api/cart/:productId', authenticateToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        cart.items = cart.items.filter(p => p.productId !== parseInt(req.params.productId));
        cart.updatedAt = Date.now();
        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error removing item' });
    }
});

// ===================== ORDER ROUTES (Manual Payment) =====================

// Create Manual Order
app.post('/api/create-order', authenticateToken, async (req, res) => {
    try {
        const { items, email, mobile, transactionId } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }
        if (!transactionId) {
            return res.status(400).json({ message: 'Transaction ID is required' });
        }

        const productIds = items.map(i => i.productId);
        const products = await Product.find({ id: { $in: productIds } });

        const totalAmount = items.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            const priceStr = product?.price?.toString().replace(/[^0-9.]/g, '') || '0';
            return sum + (parseFloat(priceStr) || 0) * item.quantity;
        }, 0);

        const orderItems = items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                productId: item.productId,
                name: item.name || product?.name,
                price: product?.price,
                quantity: item.quantity,
                image: item.image || product?.image,
                downloadUrl: product?.mediaUrl || product?.image || '',
                driveUrl: product?.driveUrl || ''
            };
        });

        const order = new Order({
            userId: req.user.id,
            email,
            mobile: mobile || '',
            items: orderItems,
            totalAmount,
            paymentMethod: 'manual',
            transactionId,
            status: 'Pending'
        });
        await order.save();

        await Cart.findOneAndDelete({ userId: req.user.id });

        res.json({ orderId: order._id, message: 'Order created successfully. Waiting for admin verification.' });
    } catch (error) {
        console.error('Order Creation Error:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
});

// Get user's orders with status
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });

        // Ensure approved orders have product driveUrls if missing
        const productIds = [];
        orders.forEach(o => {
            if (o.status === 'Approved') {
                (o.items || []).forEach(i => productIds.push(i.productId));
            }
        });

        if (productIds.length > 0) {
            const products = await Product.find({ id: { $in: productIds } });
            const pMap = new Map(products.map(p => [p.id, p]));
            orders.forEach(o => {
                if (o.status === 'Approved') {
                    o.items.forEach(i => {
                        if (!i.driveUrl && pMap.has(i.productId)) {
                            i.driveUrl = pMap.get(i.productId).driveUrl || '';
                        }
                    });
                }
            });
        }

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// Get single order download links (only if approved)
app.get('/api/orders/:orderId/downloads', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.orderId, userId: req.user.id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'Approved') {
            return res.status(403).json({ message: 'Payment not yet verified. Please wait for admin approval.' });
        }

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=Order_${order._id}.zip`);

        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', function (err) {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error generating ZIP' });
            }
        });

        archive.pipe(res);

        for (const item of order.items) {
            const fileUrl = item.downloadUrl || item.image;
            if (!fileUrl) continue;

            const safeName = item.name.replace(/[^a-z0-9-_]/gi, '_');

            try {
                if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
                    const response = await fetch(fileUrl);
                    if (response.ok && response.body) {
                        const urlObj = new URL(fileUrl);
                        const ext = path.extname(urlObj.pathname) || '.bin';
                        const nodeStream = Readable.fromWeb(response.body);
                        archive.append(nodeStream, { name: `${safeName}${ext}` });
                    }
                } else {
                    const localPath = path.join(__dirname, fileUrl);
                    if (fs.existsSync(localPath)) {
                        const ext = path.extname(localPath);
                        archive.append(fs.createReadStream(localPath), { name: `${safeName}${ext}` });
                    }
                }
            } catch (err) {
                console.error(`Error processing file ${fileUrl} for zip:`, err);
            }
        }

        await archive.finalize();

    } catch (error) {
        console.error('Error generating downloads:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating downloads' });
        }
    }
});


// ---- ADMIN: Approve or reject an order ----
app.put('/api/admin/orders/:orderId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be Approved or Rejected' });
        }

        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = status;
        if (adminNote !== undefined) order.adminNote = adminNote;

        let emailResult = null;
        if (status === 'Approved') {
            // Check if any items need driveUrl populated from product catalog
            const productIds = (order.items || []).map(i => i.productId);
            const products = await Product.find({ id: { $in: productIds } });

            for (let item of order.items) {
                if (!item.driveUrl) {
                    const p = products.find(prod => prod.id === item.productId);
                    if (p && p.driveUrl) {
                        item.driveUrl = p.driveUrl;
                    }
                }
            }

            // Send download links email to customer
            emailResult = await sendOrderApprovedEmail(order, adminNote);
            if (emailResult.success) {
                order.emailSent = true;
                order.emailSentAt = new Date();
                order.emailStatus = emailResult.simulated ? 'Simulated' : 'Sent';
            } else {
                order.emailStatus = `Failed: ${emailResult.error || 'Could not send email'}`;
            }
        }

        await order.save();

        let messageText = `Order ${status.toLowerCase()} successfully`;
        if (status === 'Approved' && emailResult) {
            if (emailResult.simulated) {
                messageText += ' (Download link email simulated to server console)';
            } else if (emailResult.success) {
                messageText += ' & download link sent to customer email!';
            } else {
                messageText += ` (Email sending warning: ${emailResult.error})`;
            }
        }

        res.json({ message: messageText, order, emailResult });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Error updating order' });
    }
});

// Admin: Resend download link email to customer
app.post('/api/admin/orders/:orderId/resend-email', authenticateToken, isAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Ensure drive links are fresh from products if missing
        const productIds = (order.items || []).map(i => i.productId);
        const products = await Product.find({ id: { $in: productIds } });
        for (let item of order.items) {
            if (!item.driveUrl) {
                const p = products.find(prod => prod.id === item.productId);
                if (p && p.driveUrl) {
                    item.driveUrl = p.driveUrl;
                }
            }
        }

        const emailResult = await sendOrderApprovedEmail(order, order.adminNote);
        if (emailResult.success) {
            order.emailSent = true;
            order.emailSentAt = new Date();
            order.emailStatus = emailResult.simulated ? 'Simulated' : 'Sent';
        } else {
            order.emailStatus = `Failed: ${emailResult.error || 'Could not send email'}`;
        }
        await order.save();

        res.json({
            message: emailResult.simulated 
                ? 'Email simulated to console (SMTP credentials not configured in .env)' 
                : emailResult.success 
                    ? `Access links email resent successfully to ${order.email}` 
                    : `Failed to send email: ${emailResult.error}`,
            emailResult,
            order
        });
    } catch (error) {
        console.error('Error resending email:', error);
        res.status(500).json({ message: 'Error resending email', error: error.message });
    }
});

// Admin: Update Drive Link on a specific order item directly
app.put('/api/admin/orders/:orderId/items/:itemIndex/drive-url', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { driveUrl } = req.body;
        const itemIndex = parseInt(req.params.itemIndex, 10);
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (!order.items[itemIndex]) return res.status(404).json({ message: 'Item not found in order' });

        order.items[itemIndex].driveUrl = driveUrl || '';
        await order.save();

        res.json({ message: 'Drive link updated for order item', order });
    } catch (error) {
        res.status(500).json({ message: 'Error updating item drive link', error: error.message });
    }
});

// ===================== ADMIN ROUTES =====================

// File Upload Endpoint
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({
            message: 'File uploaded successfully',
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        const token = jwt.sign({ id: user._id, role: 'admin' }, JWT_SECRET, { expiresIn: '20m' });
        res.json({
            message: 'Admin login successful',
            token,
            user: { id: user._id, email: user.email, fullname: user.fullname, role: 'admin' }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



// Admin Reviews
app.get('/api/admin/reviews', authenticateToken, isAdmin, async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('userId', 'fullname email')
            .sort({ createdAt: -1 });
        // Attach product name to each review
        const enriched = await Promise.all(reviews.map(async (r) => {
            const product = await Product.findOne({ id: r.productId });
            return {
                ...r.toObject(),
                productName: product ? product.name : 'Unknown Product'
            };
        }));
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

app.delete('/api/admin/reviews/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting review' });
    }
});

// --- Category Management ---
app.get('/api/admin/categories', authenticateToken, isAdmin, async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

app.post('/api/admin/categories', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description, image } = req.body;
        const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) return res.status(400).json({ message: 'Category already exists' });
        const category = new Category({ name, description, image });
        await category.save();
        res.status(201).json({ message: 'Category created', category });
    } catch (error) {
        res.status(500).json({ message: 'Error creating category', error: error.message });
    }
});

app.delete('/api/admin/categories/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category' });
    }
});

// --- Subcategory Management ---
app.post('/api/admin/categories/:id/subcategories', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        const exists = category.subcategories.some(s => s.name.toLowerCase() === name.toLowerCase());
        if (exists) return res.status(400).json({ message: 'Subcategory already exists' });
        category.subcategories.push({ name, description: description || '' });
        await category.save();
        res.status(201).json({ message: 'Subcategory added', category });
    } catch (error) {
        res.status(500).json({ message: 'Error adding subcategory', error: error.message });
    }
});

app.delete('/api/admin/categories/:id/subcategories/:subId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        category.subcategories = category.subcategories.filter(s => s._id.toString() !== req.params.subId);
        await category.save();
        res.json({ message: 'Subcategory deleted', category });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting subcategory', error: error.message });
    }
});

// --- Product Management ---
app.get('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const products = await Product.find().sort({ id: 1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});

app.post('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, category, subcategory, price, rating, image, description, features, mediaType, mediaUrl, driveUrl } = req.body;
        // Auto-increment ID
        const lastProduct = await Product.findOne().sort({ id: -1 });
        const newId = lastProduct ? lastProduct.id + 1 : 1;
        const product = new Product({
            id: newId, name, category, subcategory: subcategory || '', price, rating: rating || 0,
            image, description, features: features || [],
            mediaType: mediaType || 'image', mediaUrl: mediaUrl || '',
            driveUrl: driveUrl || ''
        });
        await product.save();
        res.status(201).json({ message: 'Product created', product });
    } catch (error) {
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
});

app.put('/api/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            { $set: req.body },
            { new: true }
        );
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product updated', product });
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
});

app.delete('/api/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await Product.findOneAndDelete({ id: parseInt(req.params.id) });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product' });
    }
});

// --- Contact Submissions ---
app.get('/api/admin/contacts', authenticateToken, isAdmin, async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching contacts' });
    }
});

app.delete('/api/admin/contacts/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.json({ message: 'Contact deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting contact' });
    }
});

// --- Dashboard Stats ---
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [products, categories, contacts, users] = await Promise.all([
            Product.countDocuments(),
            Category.countDocuments(),
            Contact.countDocuments(),
            User.countDocuments({ role: 'user' })
        ]);
        res.json({ products, categories, contacts, users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

// --- Admin Orders ---
app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching admin orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// Public categories route
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

// --- Public Stats for Landing Page Charts ---
// --- Public Stats for Landing Page Charts ---
app.get('/api/public/stats', async (req, res) => {
    try {
        const [orders, allProducts] = await Promise.all([
            Order.find({ status: 'Approved' }),
            Product.find()
        ]);

        // Create Product Map for quick lookup
        const productMap = new Map(allProducts.map(p => [p.id, p]));

        // 1. Monthly Sales Data (Area Chart)
        const monthlySales = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize last 12 months
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            // Store with a sortable date key
            monthlySales[key] = {
                name: months[d.getMonth()],
                sales: 0,
                revenue: 0,
                dateObj: d
            };
        }

        // 2. Aggregators
        const categorySales = {};
        const productStats = {}; // Map Name -> { count, category, revenue }

        orders.forEach(order => {
            // -- Area Chart Data --
            const date = new Date(order.createdAt);
            const key = `${months[date.getMonth()]} ${date.getFullYear()}`;

            // Only count if within the last 12 months window we initialized
            if (monthlySales[key]) {
                monthlySales[key].sales += order.items.reduce((acc, item) => acc + item.quantity, 0);
                monthlySales[key].revenue += order.totalAmount;
            }

            // -- Category & Product Data --
            order.items.forEach(item => {
                const product = productMap.get(item.productId);
                const category = product ? product.category : 'Uncategorized';
                const productName = product ? product.name : item.name;

                // Category Stats
                if (!categorySales[category]) {
                    categorySales[category] = 0;
                }
                categorySales[category] += item.quantity;

                // Product Stats
                if (!productStats[productName]) {
                    productStats[productName] = {
                        name: productName,
                        sold: 0,
                        category: category
                    };
                }
                productStats[productName].sold += item.quantity;
            });
        });

        // Format Area Chart Data
        const salesAreaChartData = Object.values(monthlySales)
            .sort((a, b) => a.dateObj - b.dateObj)
            .map(({ name, sales, revenue }) => ({ name: `${name}`, sales, revenue }));

        // Format Top Categories (for Bar/Pie Chart)
        const topCategories = Object.entries(categorySales)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Format Top Products
        const productBreakdown = Object.values(productStats)
            .sort((a, b) => b.sold - a.sold);

        const topProducts = productBreakdown.slice(0, 5);

        // Calculate Totals
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalProductsSold = productBreakdown.reduce((sum, p) => sum + p.sold, 0);

        // Recent Orders (Live Ticker Data) - Anonymized
        const recentOrders = orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(order => ({
                id: order._id,
                customer: order.email.split('@')[0] + '***', // Mask email for public view
                itemsCount: order.items.length,
                totalAmount: order.totalAmount,
                status: order.status,
                time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));

        res.json({
            salesAreaChartData,
            topCategories,
            topProducts,
            productBreakdown,
            totalProductsSold,
            totalRevenue,
            totalOrders: orders.length,
            recentOrders
        });
    } catch (error) {
        console.error('Error fetching public stats:', error);
        res.status(500).json({ message: 'Error fetching public stats' });
    }
});

// Seed Admin User on startup (creates or updates admin from .env)
const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@svrp.com';
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
            console.error('ADMIN_PASSWORD not set in .env — skipping admin seed');
            return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        const adminExists = await User.findOne({ role: 'admin' });

        if (!adminExists) {
            // Create new admin
            const admin = new User({
                fullname: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('Default admin account created');
        } else {
            // Update existing admin's email & password to match .env
            adminExists.email = adminEmail;
            adminExists.password = hashedPassword;
            await adminExists.save();
            console.log('Admin credentials synced with .env');
        }
    } catch (error) {
        console.error('Error seeding admin:', error.message);
    }
};

mongoose.connection.once('open', async () => {
    await seedProducts();
    await seedAdmin();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
