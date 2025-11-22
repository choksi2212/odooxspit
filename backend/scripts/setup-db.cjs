const { Client } = require('pg');

async function setupDatabase() {
  // Connect as postgres user to create database and user
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'stock22',
    database: 'postgres'
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if user exists
    console.log('\n📝 Checking if stockmaster user exists...');
    const userCheck = await adminClient.query(
      "SELECT 1 FROM pg_roles WHERE rolname='stockmaster'"
    );

    if (userCheck.rows.length === 0) {
      console.log('Creating stockmaster user...');
      await adminClient.query(
        "CREATE USER stockmaster WITH PASSWORD 'password'"
      );
      console.log('✅ User stockmaster created');
    } else {
      console.log('ℹ️  User stockmaster already exists');
    }

    // Check if database exists
    console.log('\n📝 Checking if stockmaster database exists...');
    const dbCheck = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname='stockmaster'"
    );

    if (dbCheck.rows.length === 0) {
      console.log('Creating stockmaster database...');
      await adminClient.query(
        "CREATE DATABASE stockmaster OWNER stockmaster"
      );
      console.log('✅ Database stockmaster created');
    } else {
      console.log('ℹ️  Database stockmaster already exists');
    }

    // Grant privileges
    console.log('\n📝 Granting privileges...');
    await adminClient.query(
      "GRANT ALL PRIVILEGES ON DATABASE stockmaster TO stockmaster"
    );
    console.log('✅ Privileges granted');

    await adminClient.end();

    // Now connect to the stockmaster database to set up schema permissions
    console.log('\n📝 Setting up schema permissions...');
    const stockClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'stock22',
      database: 'stockmaster'
    });

    await stockClient.connect();
    
    // Grant schema permissions
    await stockClient.query('GRANT ALL ON SCHEMA public TO stockmaster');
    await stockClient.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stockmaster');
    await stockClient.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stockmaster');
    
    console.log('✅ Schema permissions granted');
    
    await stockClient.end();

    console.log('\n✨ Database setup complete!');
    console.log('\n📊 Database Details:');
    console.log('   Host: localhost');
    console.log('   Port: 5432');
    console.log('   Database: stockmaster');
    console.log('   User: stockmaster');
    console.log('   Password: password');
    console.log('\n🔗 Connection String:');
    console.log('   postgresql://stockmaster:password@localhost:5432/stockmaster');
    console.log('\n✅ You can now run: npm run prisma:migrate');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    
    if (error.message.includes('connect')) {
      console.error('\n⚠️  Connection failed. Please check:');
      console.error('   1. PostgreSQL service is running');
      console.error('   2. PostgreSQL is listening on localhost:5432');
      console.error('   3. Password for postgres user is correct (stock22)');
      console.error('\n   To start PostgreSQL service:');
      console.error('   - Check Services (services.msc)');
      console.error('   - Or run: net start postgresql-x64-18');
    }
    
    process.exit(1);
  }
}

setupDatabase();

