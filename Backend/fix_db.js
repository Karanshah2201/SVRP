const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://karanshah2201_db_user:Railworks@cluster0.zrte0de.mongodb.net/?retryWrites=true&w=majority')
    .then(async () => {
        const ProductSchema = new mongoose.Schema({ price: String, name: String }, { strict: false, collection: 'products' });
        const Product = mongoose.model('Product', ProductSchema);
        const prods = await Product.find({});
        console.log(`Found ${prods.length} products`);
        let c = 0;
        for (let p of prods) {
            if (p.price && typeof p.price === 'string' && p.price.includes('$')) {
                console.log('Updating:', p.name, p.price);
                p.price = p.price.replace('$', '₹').replace('₹40/mo', '₹3000/mo').replace('₹40', '₹3000').replace('₹0.02', '₹2').replace('₹19.99', '₹1500').replace('₹5.00', '₹400');
                await p.save();
                c++;
            }
        }
        console.log(`Updated ${c} products`);
        process.exit(0);
    }).catch(console.error);
