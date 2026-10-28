const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;

async function run() {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const updateResult = await mongoose.connection.collection('products').updateMany(
        {
            $or: [
                { mediaUrl: { $regex: 'svrp-1\\.onrender\\.com' } },
                { image: { $regex: 'svrp-1\\.onrender\\.com' } }
            ]
        },
        {
            $set: {
                mediaUrl: '/1792314432612-603607.FBX',
                image: '/1792314306858-650384.png'
            }
        }
    );

    console.log('Modified products count:', updateResult.modifiedCount);

    const all = await mongoose.connection.collection('products').find({}).toArray();
    all.forEach(p => {
        console.log({ id: p._id, name: p.name, mediaType: p.mediaType, mediaUrl: p.mediaUrl, image: p.image });
    });

    await mongoose.disconnect();
}

run().catch(console.error);
