const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    items: [{
        productId: { type: Number, required: true },
        name: String,
        price: String,
        quantity: Number,
        image: String,
        downloadUrl: String
    }],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'upi' },
    transactionId: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    adminNote: String,
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: { type: String },
    fullname: String,
    phoneNumber: String
});
const User = mongoose.model('User', UserSchema);

async function seed() {
    try {
        if (!process.env.DATABASE_URL) {
            console.error('DATABASE_URL is missing in .env');
            process.exit(1);
        }

        console.log('Connecting to DB...');
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Connected to DB');

        // Create or find a user
        let user = await User.findOne({});
        if (!user) {
            console.log('No users found. Creating a dummy user...');
            user = await User.create({
                email: 'admin@example.com',
                password: 'password123',
                fullname: 'Admin User',
                phoneNumber: '1234567890'
            });
        }
        console.log('Using user ID:', user._id);

        const count = await Order.countDocuments();
        console.log(`Found ${count} existing orders.`);

        if (count >= 50) {
            console.log('Enough orders exist (50+). Exiting.');
            process.exit(0);
        }

        const ordersToCreate = 50 - count;
        console.log(`Creating ${ordersToCreate} more orders...`);

        const orders = [];
        const statuses = ['Pending', 'Approved', 'Approved', 'Approved', 'Rejected']; // Weighted towards Approved

        // Products data to use
        const productsData = [
            { productId: 1, name: "High-Performance VM", price: "40", quantity: 1, image: "https://images.unsplash.com/photo-1558494949-ef526b01201b?auto=format&fit=crop&q=80&w=1000" },
            { productId: 2, name: "S3 Object Storage", price: "0.02", quantity: 5, image: "https://images.unsplash.com/photo-1628258813555-5dc4d5c0e470?auto=format&fit=crop&q=80&w=1000" },
            { productId: 7, name: "Intro to Cloud Computing", price: "19.99", quantity: 2, image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000" },
        ];

        // Generate orders for past 12 months
        for (let i = 0; i < ordersToCreate; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const date = new Date();
            // Spread over last 365 days, with some very recent ones
            // 20% within last 7 days
            const daysAgo = Math.random() < 0.2 ? Math.floor(Math.random() * 7) : Math.floor(Math.random() * 300);
            date.setDate(date.getDate() - daysAgo);

            const product = productsData[i % productsData.length];
            const itemTotal = parseFloat(product.price) * product.quantity;

            orders.push({
                userId: user._id,
                email: `user${Date.now()}_${i}@example.com`,
                mobile: `98765${Math.floor(10000 + Math.random() * 90000)}`,
                items: [product],
                totalAmount: Math.floor(itemTotal),
                transactionId: `TXN${Date.now()}${i}`,
                status: status,
                createdAt: date
            });
        }

        if (orders.length > 0) {
            await Order.insertMany(orders);
            console.log(`Successfully added ${orders.length} orders!`);
        } else {
            console.log('No orders to add.');
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
}

seed();
