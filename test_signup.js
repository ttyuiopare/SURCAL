const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jcxgxsnenwysbpgnecna.supabase.co';
const supabaseKey = 'sb_publishable_Qvdiu9UVbtck9B6PQvh9Yg_XcwIzhfl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  const email = 'testuser_' + Date.now() + '@example.com';
  console.log('Testing signup with', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: {
      data: {
        name: 'Test User',
        role: 'buyer'
      }
    }
  });

  if (error) {
    console.error('SIGNUP ERROR:', error);
  } else {
    console.log('SIGNUP SUCCESS:', data.user?.id);
  }
}

testSignup();
