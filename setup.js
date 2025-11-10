const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Setting up Elegance Hair Salon - Nairobi...\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ .env file created. Please update it with your credentials.\n');
} else {
    console.log('✅ .env file already exists.\n');
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    const npmInstall = spawn('npm', ['install'], { stdio: 'inherit', shell: true });
    
    npmInstall.on('close', (code) => {
        if (code === 0) {
            console.log('✅ Dependencies installed successfully.\n');
            checkMongoDB();
        } else {
            console.log('❌ Failed to install dependencies.\n');
        }
    });
} else {
    console.log('✅ Dependencies already installed.\n');
    checkMongoDB();
}

function checkMongoDB() {
    console.log('🔍 Checking MongoDB status...');
    
    const checkMongo = spawn('sc', ['query', 'MongoDB'], { shell: true });
    let output = '';
    
    checkMongo.stdout.on('data', (data) => {
        output += data.toString();
    });
    
    checkMongo.on('close', (code) => {
        if (code === 0 && output.includes('RUNNING')) {
            console.log('✅ MongoDB is running.\n');
            offerToSeedData();
        } else {
            console.log('⚠️  MongoDB is not running or not installed.');
            console.log('Please install MongoDB Community Edition from:');
            console.log('https://www.mongodb.com/try/download/community\n');
            console.log('Or start MongoDB service with: net start MongoDB\n');
        }
    });
    
    checkMongo.on('error', () => {
        console.log('⚠️  Could not check MongoDB status.');
        console.log('Please ensure MongoDB is installed and running.\n');
    });
}

function offerToSeedData() {
    console.log('🌱 Would you like to seed sample data? (y/n)');
    
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data) => {
        const answer = data.toString().trim().toLowerCase();
        
        if (answer === 'y' || answer === 'yes') {
            console.log('🌱 Seeding sample data...');
            const seedProcess = spawn('node', ['test/seedData.js'], { stdio: 'inherit', shell: true });
            
            seedProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('\n✅ Sample data seeded successfully!');
                } else {
                    console.log('\n❌ Failed to seed sample data.');
                }
                showNextSteps();
            });
        } else {
            showNextSteps();
        }
    });
}

function showNextSteps() {
    console.log('\n🎉 Setup complete! Next steps:');
    console.log('1. Update your .env file with your credentials');
    console.log('2. Start the application: npm run dev');
    console.log('3. Open http://localhost:3000 in your browser');
    console.log('\n📧 Don\'t forget to configure:');
    console.log('- Gmail credentials for email reminders');
    console.log('- Twilio credentials for SMS (Kenya +254 numbers)');
    console.log('\nHappy salon management! 💇‍♀️✨');
    
    process.exit(0);
}