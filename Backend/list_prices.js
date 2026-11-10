const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
if (!uri) {
    console.error('DATABASE_URL is not set in environment');
    process.exit(1);
}

mongoose.connect(uri)
    .then(async () => {
        const ProductSchema = new mongoose.Schema({ price: String, name: String }, { strict: false, collection: 'products' });
        const Product = mongoose.model('Product', ProductSchema);

        const prods = await Product.find({});
        for (let p of prods) {
            console.log(`${p.name} | Price: ${p.price}`);
        }
        process.exit(0);
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });
