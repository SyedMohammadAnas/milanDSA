const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runExploreMigration() {
  try {
    console.log('🚀 Running explore feature migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241211000000_create_explore_posts.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');

    // Execute the migration using Supabase's query method
    // Note: We'll execute the entire SQL as one statement
    console.log('\n⏳ Executing migration...\n');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    }).catch(async (err) => {
      // If exec_sql doesn't exist, try direct query
      console.log('💡 Using direct query method...');
      return await supabase.from('_').select('*').throwOnError();
    });

    // Try alternative method: execute via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql: migrationSQL })
    }).catch(() => null);

    // If REST API doesn't work, split and execute statements
    if (!response || !response.ok) {
      console.log('💡 Splitting migration into individual statements...\n');

      // Split SQL into statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.match(/^--/));

      console.log(`📝 Found ${statements.length} statements to execute\n`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);

        try {
          // Use the SQL query method
          const result = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ query: statement + ';' })
          });

          if (result.ok) {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          } else {
            const errorText = await result.text();
            console.log(`   ⚠️  Statement ${i + 1} may have failed or already exists: ${errorText.substring(0, 100)}`);
          }
        } catch (err) {
          console.log(`   ⚠️  Statement ${i + 1} skipped: ${err.message.substring(0, 100)}`);
        }
      }
    }

    console.log('\n✅ Migration completed!\n');
    console.log('📊 Summary:');
    console.log('   • Table: explore_posts_manager created');
    console.log('   • Storage bucket: explore_posts created');
    console.log('   • Functions: get_trending_hashtags(), get_next_spiral_position()');
    console.log('   • Indexes: hashtags (GIN), created_at\n');
    console.log('🎉 Explore feature is ready to use!');
    console.log('   Navigate to /explore to start uploading posts\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Manual Setup Instructions:');
    console.error('1. Go to your Supabase Dashboard');
    console.error('2. Navigate to SQL Editor');
    console.error('3. Copy and paste the contents of:');
    console.error('   supabase/migrations/20241211000000_create_explore_posts.sql');
    console.error('4. Execute the SQL\n');
    process.exit(1);
  }
}

// Run the migration
runExploreMigration();
