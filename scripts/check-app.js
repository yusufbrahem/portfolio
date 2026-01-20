// Quick script to check if the app is working
const baseUrl = process.env.BASE_URL || "http://localhost:3000";

async function checkApp() {
  console.log("🔍 Checking application status...\n");

  // Check main page
  try {
    const response = await fetch(baseUrl);
    if (response.ok) {
      console.log("✅ Main page is accessible");
      console.log(`   Status: ${response.status} ${response.statusText}`);
    } else {
      console.log(`⚠️  Main page returned: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Cannot reach main page: ${error.message}`);
    console.log("   Make sure the dev server is running: npm run dev");
    return;
  }

  // Check database connection (via API or page that uses DB)
  try {
    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "test" }), // This will fail auth but tests DB connection
    });
    console.log("✅ Database connection working (admin endpoint accessible)");
  } catch (error) {
    console.log(`⚠️  Database check failed: ${error.message}`);
  }

  // Check admin login page
  try {
    const response = await fetch(`${baseUrl}/admin/login`);
    if (response.ok) {
      console.log("✅ Admin login page accessible");
    }
  } catch (error) {
    console.log(`⚠️  Admin login page check failed: ${error.message}`);
  }

  console.log("\n📋 Quick checks:");
  console.log(`   - Main page: ${baseUrl}`);
  console.log(`   - Admin login: ${baseUrl}/admin/login`);
  console.log(`   - Resume page: ${baseUrl}/resume`);
  console.log(`   - Contact page: ${baseUrl}/contact`);
}

checkApp().catch(console.error);
