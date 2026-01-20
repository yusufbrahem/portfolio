// Test admin pages with proper authentication
const baseUrl = "http://localhost:3000";

// Get admin password from environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error("❌ ERROR: ADMIN_PASSWORD environment variable is not set.");
  console.error("   Please set it in your .env file or export it before running this script.");
  process.exit(1);
}

async function testAdminPages() {
  console.log("Testing Admin Pages...\n");

  // Step 1: Login
  console.log("1. Logging in...");
  const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });

  if (!loginResponse.ok) {
    console.error("❌ Login failed:", loginResponse.status, await loginResponse.text());
    return;
  }

  // Get cookies from login response
  const cookies = loginResponse.headers.get("set-cookie");
  console.log("✅ Login successful");
  console.log("Cookies:", cookies);

  // Step 2: Test admin dashboard
  console.log("\n2. Testing /admin...");
  const adminResponse = await fetch(`${baseUrl}/admin`, {
    headers: {
      Cookie: cookies || "",
    },
  });

  console.log("Status:", adminResponse.status);
  if (adminResponse.status === 307 || adminResponse.status === 308) {
    const location = adminResponse.headers.get("location");
    console.log("⚠️ Redirected to:", location);
  } else if (adminResponse.ok) {
    const text = await adminResponse.text();
    console.log("✅ Admin page loaded, length:", text.length);
    if (text.includes("Dashboard")) {
      console.log("✅ Dashboard content found");
    }
  } else {
    const text = await adminResponse.text();
    console.error("❌ Error:", text.substring(0, 200));
  }

  // Step 3: Test admin skills
  console.log("\n3. Testing /admin/skills...");
  const skillsResponse = await fetch(`${baseUrl}/admin/skills`, {
    headers: {
      Cookie: cookies || "",
    },
  });

  console.log("Status:", skillsResponse.status);
  if (skillsResponse.ok) {
    const text = await skillsResponse.text();
    console.log("✅ Skills page loaded, length:", text.length);
  } else {
    const text = await skillsResponse.text();
    console.error("❌ Error:", text.substring(0, 200));
  }

  // Step 4: Test admin projects
  console.log("\n4. Testing /admin/projects...");
  const projectsResponse = await fetch(`${baseUrl}/admin/projects`, {
    headers: {
      Cookie: cookies || "",
    },
  });

  console.log("Status:", projectsResponse.status);
  if (projectsResponse.ok) {
    const text = await projectsResponse.text();
    console.log("✅ Projects page loaded, length:", text.length);
  } else {
    const text = await projectsResponse.text();
    console.error("❌ Error:", text.substring(0, 200));
  }

  // Step 5: Test admin experience
  console.log("\n5. Testing /admin/experience...");
  const experienceResponse = await fetch(`${baseUrl}/admin/experience`, {
    headers: {
      Cookie: cookies || "",
    },
  });

  console.log("Status:", experienceResponse.status);
  if (experienceResponse.ok) {
    const text = await experienceResponse.text();
    console.log("✅ Experience page loaded, length:", text.length);
  } else {
    const text = await experienceResponse.text();
    console.error("❌ Error:", text.substring(0, 200));
  }
}

testAdminPages().catch(console.error);
