const { Client } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
    console.log('✅ Connection successful!');
    await client.end();
    return true;
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 PostgreSQL Connection Tester\n');
  console.log('Let\'s test the PostgreSQL connection...\n');
  
  // Try the provided password first
  console.log('Trying password: stock22');
  const worked = await testConnection('stock22');
  
  if (worked) {
    console.log('\n✅ Great! The password works.');
    console.log('Run: node scripts/setup-db.cjs');
    process.exit(0);
  }
  
  console.log('\n⚠️  The password "stock22" did not work.\n');
  console.log('Please try one of these options:\n');
  console.log('1. Check your PostgreSQL installation password');
  console.log('2. If you used pgAdmin, check the saved password there');
  console.log('3. Reset the postgres password using these steps:\n');
  console.log('   a. Open pgAdmin');
  console.log('   b. Right-click on "PostgreSQL 18" server');
  console.log('   c. Go to Properties > Definition');
  console.log('   d. Set a new password');
  console.log('\nOr run this command to reset (as Administrator):\n');
  console.log('   ALTER USER postgres WITH PASSWORD \'your_new_password\';');
  
  rl.close();
}

main();

