const { Client } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testConnection(password) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres'
  });

  try {
    await client.connect();
    await client.end();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function setupDatabase(password) {
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres'
  });

  try {
    console.log('\n🔌 Connecting to PostgreSQL...');
    await adminClient.connect();
    console.log('✅ Connected!');

    // Check and create user
    const userCheck = await adminClient.query(
      "SELECT 1 FROM pg_roles WHERE rolname='stockmaster'"
    );

    if (userCheck.rows.length === 0) {
      console.log('📝 Creating stockmaster user...');
      await adminClient.query(
        "CREATE USER stockmaster WITH PASSWORD 'password'"
      );
      console.log('✅ User created');
    } else {
      console.log('ℹ️  User stockmaster already exists');
    }

    // Check and create database
    const dbCheck = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname='stockmaster'"
    );

    if (dbCheck.rows.length === 0) {
      console.log('📝 Creating stockmaster database...');
      await adminClient.query(
        "CREATE DATABASE stockmaster OWNER stockmaster"
      );
      console.log('✅ Database created');
    } else {
      console.log('ℹ️  Database stockmaster already exists');
    }

    console.log('📝 Granting privileges...');
    await adminClient.query(
      "GRANT ALL PRIVILEGES ON DATABASE stockmaster TO stockmaster"
    );

    await adminClient.end();

    // Connect to stockmaster database for schema permissions
    const stockClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: password,
      database: 'stockmaster'
    });

    await stockClient.connect();
    await stockClient.query('GRANT ALL ON SCHEMA public TO stockmaster');
    await stockClient.end();

    console.log('\n✨ Database setup complete!');
    console.log('\n🎯 Next steps:');
    console.log('   1. npm run prisma:migrate');
    console.log('   2. npm run prisma:seed');
    console.log('   3. npm run dev');
    
    return true;
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   StockMaster Database Setup Wizard          ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // Try default password first
  console.log('Trying default password: stock22');
  let result = await testConnection('stock22');
  
  if (result.success) {
    console.log('✅ Default password works!\n');
    const success = await setupDatabase('stock22');
    rl.close();
    process.exit(success ? 0 : 1);
    return;
  }

  console.log('❌ Default password didn\'t work\n');
  
  // Ask for password
  console.log('Please enter your PostgreSQL postgres user password:');
  console.log('(The one you set during PostgreSQL installation)\n');
  
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    const password = await question(`Password (attempt ${attempts + 1}/${maxAttempts}): `);
    
    console.log('\n🔄 Testing connection...');
    result = await testConnection(password);
    
    if (result.success) {
      console.log('✅ Password correct!\n');
      const success = await setupDatabase(password);
      rl.close();
      process.exit(success ? 0 : 1);
      return;
    }
    
    attempts++;
    console.log(`❌ Incorrect password. ${maxAttempts - attempts} attempts remaining.\n`);
  }
  
  console.log('\n❌ Maximum attempts reached.');
  console.log('\n💡 Suggestions:');
  console.log('   1. Open pgAdmin and check your saved password');
  console.log('   2. Try common defaults: postgres, admin, root');
  console.log('   3. Reset password using pgAdmin:');
  console.log('      - Right-click PostgreSQL 18 server');
  console.log('      - Properties → Definition → Set new password');
  console.log('\n   Then run this script again.');
  
  rl.close();
  process.exit(1);
}

main().catch(console.error);

