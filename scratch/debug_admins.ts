import { supabaseAdmin } from './src/lib/supabase/admin';

async function testFetch() {
  console.log("Checking profiles table...");
  const { data: profiles, error: pError } = await supabaseAdmin.from('profiles').select('id, name').limit(1);
  if (pError) console.error("Profile Error:", pError);
  else console.log("Profiles found:", profiles);

  console.log("Checking project_admins table...");
  const { data: pa, error: paError } = await supabaseAdmin.from('project_admins').select('*').limit(1);
  if (paError) console.error("PA Error:", paError);
  else console.log("PA rows found:", pa);

  console.log("Testing full Join...");
  const { data: admins, error: adminsError } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        name,
        email,
        phone,
        status,
        created_at,
        project_admins (
          project_id
        )
      `)
      .eq("role", "PROJECT_ADMIN")
      .order("created_at", { ascending: false });

  if (adminsError) {
    console.error("Full Query Error:", adminsError);
  } else {
    console.log("Full Query Success, count:", admins.length);
  }
}

testFetch();
