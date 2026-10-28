const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

async function syncRevocations() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URL);
    const db = mongoose.connection.db;
    const now = new Date();

    console.log('\n--- 1. Synchronizing Revoked Licenses ---');
    const revokedLicenses = await db.collection('licenses').find({ status: 'Revoked' }).toArray();
    console.log(`Found ${revokedLicenses.length} revoked license(s).`);

    for (const lic of revokedLicenses) {
        console.log(`Processing Revoked License ${lic.licenseKey} (Order: ${lic.orderId}, Product: ${lic.productId})`);
        
        // 1. Sync AccessGrant to revoked
        const grantRes = await db.collection('accessgrants').updateMany(
            { orderId: lic.orderId, productId: lic.productId },
            { 
                $set: { 
                    status: 'revoked', 
                    revokedAt: lic.revokedAt || now,
                    lastRevocationError: ''
                } 
            }
        );
        console.log(`  -> AccessGrants updated: ${grantRes.modifiedCount}`);

        // 2. Wipe driveUrl from Order item
        const orderRes = await db.collection('orders').updateOne(
            { _id: lic.orderId, 'items.productId': lic.productId },
            { $set: { 'items.$.driveUrl': '' } }
        );
        console.log(`  -> Order item driveUrl wiped: ${orderRes.modifiedCount}`);
    }

    console.log('\n--- 2. Synchronizing Revoked AccessGrants ---');
    const revokedGrants = await db.collection('accessgrants').find({ status: 'revoked' }).toArray();
    console.log(`Found ${revokedGrants.length} revoked grant(s).`);

    for (const grant of revokedGrants) {
        // Sync License to Revoked
        await db.collection('licenses').updateMany(
            { orderId: grant.orderId, productId: grant.productId, status: { $ne: 'Revoked' } },
            { 
                $set: { 
                    status: 'Revoked', 
                    revokedAt: grant.revokedAt || now,
                    revokedReason: 'Synchronized with Revoked Cloud Access Grant'
                } 
            }
        );
        // Wipe Order driveUrl
        await db.collection('orders').updateOne(
            { _id: grant.orderId, 'items.productId': grant.productId },
            { $set: { 'items.$.driveUrl': '' } }
        );
    }

    console.log('\n--- 3. Synchronizing Expired Grants ---');
    const expiredGrants = await db.collection('accessgrants').find({
        $or: [
            { status: 'expired' },
            { status: 'active', expiresAt: { $lte: now } }
        ]
    }).toArray();
    console.log(`Found ${expiredGrants.length} expired grant(s).`);

    for (const grant of expiredGrants) {
        await db.collection('accessgrants').updateOne(
            { _id: grant._id },
            { $set: { status: 'expired', revokedAt: grant.revokedAt || now } }
        );

        // Sync License to Expired (if not already Revoked)
        await db.collection('licenses').updateMany(
            { orderId: grant.orderId, productId: grant.productId, status: { $nin: ['Revoked', 'Expired'] } },
            { 
                $set: { 
                    status: 'Expired', 
                    revokedAt: now,
                    revokedReason: '48-Hour Access Window Expired'
                } 
            }
        );

        // Wipe Order driveUrl
        await db.collection('orders').updateOne(
            { _id: grant.orderId, 'items.productId': grant.productId },
            { $set: { 'items.$.driveUrl': '' } }
        );
    }

    console.log('\nDatabase synchronization complete!');
    await mongoose.disconnect();
}

syncRevocations().catch(err => {
    console.error('Sync error:', err);
    process.exit(1);
});
