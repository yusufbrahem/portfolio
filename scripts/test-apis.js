// Simple API test script
// Tests all admin and public APIs

const baseUrl = process.env.BASE_URL || "http://localhost:3000";

async function testAPI(endpoint, options = {}) {
  try {
    const url = `${baseUrl}${endpoint}`;
    console.log(`\nTesting: ${options.method || "GET"} ${endpoint}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({ text: await response.text() }));
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error:`, error.message);
    return { error: error.message };
  }
}

async function runTests() {
  console.log("=== Testing Portfolio CMS APIs ===\n");

  // Test public pages (should work without auth)
  console.log("\n--- Public Pages ---");
  await testAPI("/api/skills");
  await testAPI("/api/projects");
  await testAPI("/api/experience");

  // Test admin login
  console.log("\n--- Admin Auth ---");
  const loginResult = await testAPI("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD || "admin123" }),
  });

  if (loginResult.status === 200) {
    console.log("✓ Login successful");
  } else {
    console.log("✗ Login failed");
  }

  console.log("\n=== Tests Complete ===");
}

runTests();
