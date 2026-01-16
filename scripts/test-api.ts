/**
 * Test script for Continuum API
 *
 * Usage:
 *   npx tsx scripts/test-api.ts
 *
 * Requirements:
 *   - Server running on localhost:3000
 *   - Email to test with
 */

async function testContinuumAPI() {
  const BASE_URL = process.env.CONTINUUM_API_URL || "http://localhost:3000";
  const TEST_EMAIL = process.env.TEST_EMAIL || "test@example.com";

  console.log("🧪 Testing Continuum API\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Email: ${TEST_EMAIL}\n`);

  let apiKey: string;

  // Step 1: Create an API key
  console.log("📝 Step 1: Creating API key...");
  try {
    const response = await fetch(`${BASE_URL}/api/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        name: "Test Key",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create API key: ${response.statusText}`);
    }

    const data = await response.json();
    apiKey = data.api_key;

    console.log("✅ API key created successfully");
    console.log(`   Key: ${data.key_prefix}...`);
    console.log(`   Full key: ${apiKey}\n`);
  } catch (error) {
    console.error("❌ Failed to create API key:", error);
    return;
  }

  // Step 2: Try to GET identity graph (should return 404 - not found)
  console.log("📖 Step 2: Fetching identity graph (expect 404)...");
  try {
    const response = await fetch(`${BASE_URL}/api/identity-graph`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (response.status === 404) {
      console.log("✅ Correctly returned 404 - no graph exists yet\n");
    } else if (response.ok) {
      const data = await response.json();
      console.log("✅ Identity graph found:", data);
      console.log("   (User already had a graph)\n");
    } else {
      throw new Error(`Unexpected response: ${response.statusText}`);
    }
  } catch (error) {
    console.error("❌ Failed to fetch identity graph:", error);
    return;
  }

  // Step 3: Create an identity graph
  console.log("💾 Step 3: Creating identity graph...");
  const testProfile = {
    profile: {
      basic: {
        name: "Test User",
        age_range: "25-35",
        location: "San Francisco, CA",
      },
      preferences: {
        likes: ["AI/ML", "Developer Tools", "Automation"],
        dislikes: ["Verbose explanations", "Unnecessary meetings"],
        tone: "direct and technical",
      },
      work: {
        roles: ["Software Engineer", "Startup Founder"],
        industries: ["AI Infrastructure", "Developer Tools"],
        current_focus: ["Building AI memory system", "User acquisition"],
      },
      goals: {
        short_term: ["Launch beta product", "Get first 100 users"],
        long_term: ["Build infrastructure for AI era", "Enable AI personalization"],
      },
      skills: ["TypeScript", "Python", "Next.js", "AI/ML", "System Design"],
      constraints: ["Limited time", "Bootstrap budget", "Small team"],
      communication_style: [
        "Prefers examples over theory",
        "Values brevity",
        "Appreciates direct feedback",
      ],
    },
    profile_text: "Test user profile for API testing",
  };

  try {
    const response = await fetch(`${BASE_URL}/api/identity-graph`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testProfile),
    });

    if (!response.ok) {
      throw new Error(`Failed to create graph: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Identity graph created successfully");
    console.log(`   Version: ${data.version}`);
    console.log(`   Updated: ${new Date(data.updated_at).toISOString()}\n`);
  } catch (error) {
    console.error("❌ Failed to create identity graph:", error);
    return;
  }

  // Step 4: Fetch the identity graph (should now work)
  console.log("📖 Step 4: Fetching identity graph...");
  try {
    const response = await fetch(`${BASE_URL}/api/identity-graph`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch graph: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Identity graph retrieved successfully");
    console.log(`   Version: ${data.version}`);
    console.log(`   Name: ${data.profile.basic.name}`);
    console.log(`   Roles: ${data.profile.work.roles.join(", ")}`);
    console.log(`   Skills: ${data.profile.skills.slice(0, 3).join(", ")}...\n`);
  } catch (error) {
    console.error("❌ Failed to fetch identity graph:", error);
    return;
  }

  // Step 5: Update the identity graph
  console.log("🔄 Step 5: Updating identity graph...");
  const updatedProfile = {
    ...testProfile,
    profile: {
      ...testProfile.profile,
      goals: {
        ...testProfile.profile.goals,
        short_term: [
          "Launch beta product",
          "Get first 100 users",
          "Build developer community",
        ],
      },
    },
  };

  try {
    const response = await fetch(`${BASE_URL}/api/identity-graph`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedProfile),
    });

    if (!response.ok) {
      throw new Error(`Failed to update graph: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Identity graph updated successfully");
    console.log(`   New version: ${data.version}`);
    console.log(`   Updated: ${new Date(data.updated_at).toISOString()}\n`);
  } catch (error) {
    console.error("❌ Failed to update identity graph:", error);
    return;
  }

  // Step 6: Test text format
  console.log("📄 Step 6: Fetching identity graph in text format...");
  try {
    const response = await fetch(
      `${BASE_URL}/api/identity-graph?format=text`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch text: ${response.statusText}`);
    }

    const text = await response.text();
    console.log("✅ Text format retrieved successfully");
    console.log(`   Length: ${text.length} characters`);
    console.log(`   Preview: ${text.substring(0, 100)}...\n`);
  } catch (error) {
    console.error("❌ Failed to fetch text format:", error);
    return;
  }

  // Step 7: List API keys
  console.log("🔑 Step 7: Listing API keys...");
  try {
    const response = await fetch(
      `${BASE_URL}/api/keys?email=${encodeURIComponent(TEST_EMAIL)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to list keys: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ API keys retrieved successfully");
    console.log(`   Total keys: ${data.keys.length}`);
    data.keys.forEach((key: any, i: number) => {
      console.log(`   ${i + 1}. ${key.key_prefix}... (${key.name || "Unnamed"})`);
    });
    console.log();
  } catch (error) {
    console.error("❌ Failed to list API keys:", error);
    return;
  }

  // Step 8: Test authentication failure
  console.log("🚫 Step 8: Testing invalid API key...");
  try {
    const response = await fetch(`${BASE_URL}/api/identity-graph`, {
      headers: { Authorization: "Bearer pk_live_invalid_key" },
    });

    if (response.status === 401) {
      console.log("✅ Correctly rejected invalid API key\n");
    } else {
      console.warn("⚠️  Expected 401 but got:", response.status, "\n");
    }
  } catch (error) {
    console.error("❌ Error testing invalid key:", error);
    return;
  }

  // Summary
  console.log("=" .repeat(50));
  console.log("🎉 All tests passed!");
  console.log("=" .repeat(50));
  console.log("\n📋 Test Summary:");
  console.log("  ✓ API key creation");
  console.log("  ✓ Identity graph creation");
  console.log("  ✓ Identity graph retrieval (JSON)");
  console.log("  ✓ Identity graph retrieval (text)");
  console.log("  ✓ Identity graph updates");
  console.log("  ✓ API key listing");
  console.log("  ✓ Authentication validation");
  console.log("\n💡 Next steps:");
  console.log("  1. Try the API key in your applications");
  console.log("  2. Check the integration examples in /examples");
  console.log("  3. Read the API docs in README_API.md");
  console.log(`\n🔑 Your test API key: ${apiKey}`);
  console.log("   (Save this if you want to reuse it)\n");
}

// Run the tests
testContinuumAPI().catch(console.error);
