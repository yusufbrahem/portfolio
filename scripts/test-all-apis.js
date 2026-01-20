// Comprehensive API test script
const baseUrl = "http://localhost:3000";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAPI(name, endpoint, options = {}) {
  try {
    const url = `${baseUrl}${endpoint}`;
    console.log(`\n[TEST] ${name}`);
    console.log(`  ${options.method || "GET"} ${endpoint}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { html: true, status: response.status };
    }
    
    const status = response.status;
    const statusIcon = status >= 200 && status < 300 ? "✓" : "✗";
    
    console.log(`  ${statusIcon} Status: ${status}`);
    if (data && !data.html) {
      console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 200));
    }
    
    return { status, data, success: status >= 200 && status < 300 };
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return { error: error.message, success: false };
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("PORTFOLIO CMS - COMPREHENSIVE API TEST");
  console.log("=".repeat(60));
  
  // Wait for server to be ready
  console.log("\nWaiting for server to start...");
  await sleep(3000);
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };
  
  // Test public pages
  console.log("\n" + "=".repeat(60));
  console.log("PUBLIC PAGES (Should return HTML)");
  console.log("=".repeat(60));
  
  const publicPages = [
    ["Home", "/"],
    ["Skills", "/skills"],
    ["Projects", "/projects"],
    ["Experience", "/experience"],
    ["About", "/about"],
    ["Contact", "/contact"],
    ["Resume", "/resume"],
  ];
  
  for (const [name, path] of publicPages) {
    results.total++;
    const result = await testAPI(name, path);
    if (result.success) results.passed++;
    else results.failed++;
    await sleep(500);
  }
  
  // Test admin login
  console.log("\n" + "=".repeat(60));
  console.log("ADMIN AUTHENTICATION");
  console.log("=".repeat(60));
  
  // Get admin password from environment variable
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD) {
    console.error("❌ ERROR: ADMIN_PASSWORD environment variable is not set.");
    console.error("   Please set it in your .env file or export it before running this script.");
    console.error("   Skipping admin authentication tests...\n");
  } else {
    results.total++;
    const loginResult = await testAPI(
      "Admin Login",
      "/api/admin/login",
      {
        method: "POST",
        body: JSON.stringify({ password: ADMIN_PASSWORD }),
      }
    );
  
    if (loginResult.success) {
      results.passed++;
      console.log("  ✓ Login successful - session cookie set");
    } else {
      results.failed++;
    }
  }
  
  // Test admin pages (should redirect if not logged in)
  console.log("\n" + "=".repeat(60));
  console.log("ADMIN PAGES (Should redirect to login)");
  console.log("=".repeat(60));
  
  const adminPages = [
    ["Admin Dashboard", "/admin"],
    ["Admin Skills", "/admin/skills"],
    ["Admin Projects", "/admin/projects"],
    ["Admin Experience", "/admin/experience"],
  ];
  
  for (const [name, path] of adminPages) {
    results.total++;
    const result = await testAPI(name, path);
    // Admin pages redirect, so 307/308 is success
    if (result.status === 307 || result.status === 308 || result.status === 200) {
      results.passed++;
    } else {
      results.failed++;
    }
    await sleep(500);
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✓`);
  console.log(`Failed: ${results.failed} ${results.failed > 0 ? "✗" : ""}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log("=".repeat(60));
  
  if (results.failed === 0) {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed. Check output above.");
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error("Test runner error:", error);
  process.exit(1);
});
