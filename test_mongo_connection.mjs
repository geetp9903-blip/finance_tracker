import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

console.log('Testing MongoDB Connection...');
console.log('URI:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@')); // Hide password

async function testConnection() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Successfully connected to MongoDB Atlas!');
        console.log('Connection state:', mongoose.connection.readyState);
        await mongoose.disconnect();
        console.log('Disconnected.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        console.error('Suggestion: Check your IP Whitelist in MongoDB Atlas (Network Access -> Allow Access from Anywhere)');
        process.exit(1);
    }
}

testConnection();
