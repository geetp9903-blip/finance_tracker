
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { UserModel } from '../lib/models';

// Load env vars
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI!);
        console.log('Connected.');

        const jsonPath = path.join(process.cwd(), 'data', 'users.json');
        
        if (!fs.existsSync(jsonPath)) {
            console.log('No users.json found in data directory. Migration skipped.');
            return;
        }

        const fileContent = fs.readFileSync(jsonPath, 'utf-8');
        const users = JSON.parse(fileContent);

        console.log(`Found ${users.length} users in JSON.`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            const existing = await UserModel.findOne({ username: user.username });
            if (existing) {
                console.log(`User ${user.username} already exists in MongoDB. Skipping.`);
                skippedCount++;
            } else {
                console.log(`Migrating user ${user.username}...`);
                await UserModel.create({
                    id: user.id || crypto.randomUUID(), // Ensure ID
                    username: user.username,
                    pin: user.pin, // Assuming pin is already hashed in JSON if it was working before
                    // Add default fields if needed
                });
                migratedCount++;
            }
        }

        console.log(`Migration complete. Migrated: ${migratedCount}, Skipped: ${skippedCount}`);

        // Rename file to backup
        const backupPath = path.join(process.cwd(), 'data', 'users.json.bak');
        fs.renameSync(jsonPath, backupPath);
        console.log(`Renamed users.json to users.json.bak`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
