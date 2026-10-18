const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://karanshah2201_db_user:Railworks@cluster0.zrte0de.mongodb.net/?retryWrites=true&w=majority')
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
