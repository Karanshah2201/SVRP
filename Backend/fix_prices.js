const mongoose = require('mongoose');

// Use identical connection logic to server.js
mongoose.connect('mongodb+srv://karanshah2201_db_user:Railworks@cluster0.zrte0de.mongodb.net/?retryWrites=true&w=majority')
    .then(async () => {
        // We don't define a strict schema, just the fields we want to check
        const ProductSchema = new mongoose.Schema({ price: String, name: String }, { strict: false, collection: 'products' });
        const Product = mongoose.model('Product', ProductSchema);

        const prods = await Product.find({});
        console.log(`Found ${prods.length} products`);
        let updated = 0;

        for (let p of prods) {
            console.log(`Checking: ${p.name} | Price: ${p.price} | Includes $: ${p.price && p.price.includes('$')}`);
            if (p.price && typeof p.price === 'string' && p.price.includes('$')) {
                console.log(`Replacing price for ${p.name}`);

                let newPrice = p.price.replace('$', '₹');
                if (newPrice.includes('40/mo')) newPrice = '₹3000/mo';
                if (newPrice.includes('0.02/GB')) newPrice = '₹2/GB';
                if (newPrice.includes('19.99')) newPrice = '₹1500';
                if (newPrice.includes('5.00')) newPrice = '₹400';

                p.price = newPrice;
                await Product.updateOne({ _id: p._id }, { $set: { price: newPrice } });
                console.log(`Updated ${p.name} to ${newPrice}`);
                updated++;
            }
        }

        console.log(`Total Updated: ${updated} products`);
        process.exit(0);
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });
