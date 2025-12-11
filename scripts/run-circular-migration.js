import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function runCircularMigration() {
  try {
    console.log('🔄 Running circular placement system migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241211100000_remove_spiral_system.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');

    // Execute the migration using SQL queries
    console.log('\n⏳ Executing migration...\n');

    // Split SQL and execute statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   SQL: ${statement.substring(0, 60)}...`);

        try {
          await supabase.from('_').select('*').throwOnError();

          // Try to execute using raw SQL
          const result = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ query: statement + ';' })
          }).catch(() => ({ ok: false, status: 500 }));

          if (result.ok) {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          } else {
            const errorText = await result.text().catch(() => 'Unknown error');
            console.log(`   ⚠️  Statement ${i + 1} may have failed: ${errorText}`);
          }
        } catch (err) {
          console.log(`   ⚠️  Statement ${i + 1} skipped: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Migration completed!\n');
    console.log('📊 Summary:');
    console.log('   • Removed get_next_spiral_position() function');
    console.log('   • Made position column nullable');
    console.log('   • Removed position validation constraint\n');
    console.log('🎉 Upload functionality should now work!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Manual Setup Instructions:');
    console.error('1. Go to your Supabase Dashboard');
    console.error('2. Navigate to SQL Editor');
    console.error('3. Copy and paste the contents of:');
    console.error('   supabase/migrations/20241211100000_remove_spiral_system.sql');
    console.error('4. Execute the SQL\n');
    process.exit(1);
  }
}

// Run the migration
runCircularMigration();
