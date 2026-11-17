import test from "node:test";
import assert from "node:assert/strict";
import { getSupabaseConfig, verifyUser, getOwnedReceipt } from "./supabase.mjs";
const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const ID = "33333333-3333-4333-8333-333333333333";
const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.fake_signature";
const env = () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_fake_test_key",
});
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
const user = () => ({
  id: USER,
  email: "test@example.com",
  user_metadata: {
    full_name: "Sinovchi 01",
    avatar_url: "https://example.com/avatar.png",
  },
  app_metadata: { provider: "google" },
  refresh_token: "never-expose",
});
const row = () => ({
  id: ID,
  user_id: USER,
  number: "YL-TEST",
  trip_id: "Y02",
  name: "Sinovchi 01",
  cargo: "2 quti kitob",
  created_at: "2026-11-17T10:00:00Z",
});

test("Public configuration normalizes URL and accepts publishable fallback without exposing server keys", () => {
  assert.deepEqual(
    getSupabaseConfig({
      ...env(),
      SUPABASE_URL: "https://example.supabase.co/",
    }),
    {
      url: "https://example.supabase.co",
      anonKey: "sb_publishable_fake_test_key",
      configured: true,
    },
  );
  assert.equal(
    getSupabaseConfig({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_another_key",
    }).configured,
    true,
  );
  assert.deepEqual(
    getSupabaseConfig({
      ...env(),
      SUPABASE_ANON_KEY: "sb_secret_private_server_key",
    }),
    { url: "", anonKey: "", configured: false },
  );
  const service = `header.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.signature`;
  assert.equal(
    getSupabaseConfig({ ...env(), SUPABASE_ANON_KEY: service }).configured,
    false,
  );
  const anon = `header.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.signature`;
  assert.equal(
    getSupabaseConfig({ ...env(), SUPABASE_ANON_KEY: anon }).configured,
    true,
  );
  for (const url of [
    "http://example.com",
    "https://user:password@example.com",
    "https://example.com/path",
    "https://example.com?secret=value",
  ])
    assert.equal(
      getSupabaseConfig({ ...env(), SUPABASE_URL: url }).configured,
      false,
    );
});

test("Malformed JWT is rejected without network; missing configuration is explicit", async () => {
  let calls = 0;
  const fetchImpl = () => {
    calls++;
    throw new Error("Should not run");
  };
  for (const invalid of [
    "",
    null,
    "not-a-jwt",
    "a.b.c\r\ninjected",
    "x".repeat(9000),
  ])
    await assert.rejects(
      () => verifyUser(invalid, { env: env(), fetchImpl }),
      (error) => error.status === 401 && error.code === "AUTH_REQUIRED",
    );
  await assert.rejects(
    () => verifyUser(token, { env: {}, fetchImpl }),
    (error) => error.status === 503 && error.code === "AUTH_NOT_CONFIGURED",
  );
  assert.equal(calls, 0);
});

test("User is verified by Auth endpoint with anon apikey and user Bearer token", async () => {
  const settings = env();
  const result = await verifyUser(token, {
    env: settings,
    fetchImpl: async (url, options) => {
      assert.equal(url, settings.SUPABASE_URL + "/auth/v1/user");
      assert.equal(options.headers.apikey, settings.SUPABASE_ANON_KEY);
      assert.equal(options.headers.Authorization, "Bearer " + token);
      assert.equal(options.method, "GET");
      return json(user());
    },
  });
  assert.deepEqual(result, {
    id: USER,
    email: "test@example.com",
    displayName: "Sinovchi 01",
    avatarUrl: "https://example.com/avatar.png",
  });
  assert.ok(!JSON.stringify(result).includes("refresh_token"));
});

test("Unsafe metadata URLs are removed and malformed Auth response is not trusted", async () => {
  const result = await verifyUser(token, {
    env: env(),
    fetchImpl: async () =>
      json({
        ...user(),
        user_metadata: { name: "Test", avatar_url: "javascript:alert(1)" },
      }),
  });
  assert.equal(result.avatarUrl, "");
  await assert.rejects(
    () =>
      verifyUser(token, {
        env: env(),
        fetchImpl: async () => json({ id: "made-up" }),
      }),
    (error) => error.status === 401,
  );
});

test("Owner receipt lookup uses RLS JWT and matching authenticated user filter, maps DB fields", async () => {
  const settings = env();
  let calls = 0;
  const receipt = await getOwnedReceipt(ID, token, {
    env: settings,
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(options.headers.Authorization, "Bearer " + token);
      assert.equal(options.headers.apikey, settings.SUPABASE_ANON_KEY);
      if (calls === 1) return json(user());
      const parsed = new URL(url);
      assert.equal(parsed.pathname, "/rest/v1/requests");
      assert.equal(parsed.searchParams.get("id"), "eq." + ID);
      assert.equal(parsed.searchParams.get("user_id"), "eq." + USER);
      assert.equal(parsed.searchParams.get("select"), "*");
      return json([row()]);
    },
  });
  assert.deepEqual(receipt, {
    id: ID,
    userId: USER,
    number: "YL-TEST",
    tripId: "Y02",
    name: "Sinovchi 01",
    cargo: "2 quti kitob",
    createdAt: "2026-11-17T10:00:00Z",
  });
  assert.equal(calls, 2);
});

test("RLS empty/403 and mismatched owner never reveal another receipt", async () => {
  for (const mode of ["empty", "forbidden", "wrongowner"]) {
    let calls = 0;
    await assert.rejects(
      () =>
        getOwnedReceipt(ID, token, {
          env: env(),
          fetchImpl: async () => {
            if (++calls === 1) return json(user());
            if (mode === "forbidden")
              return json({ message: "private database detail " + token }, 403);
            return json(mode === "empty" ? [] : [{ ...row(), user_id: OTHER }]);
          },
        }),
      (error) => {
        assert.equal(error.status, mode === "forbidden" ? 403 : 404);
        assert.ok(!String(error).includes(token));
        assert.ok(!String(error).includes("private database"));
        return true;
      },
    );
  }
});

test("Invalid receipt ID is rejected before network and invalid DB cargo is rejected", async () => {
  await assert.rejects(
    () =>
      getOwnedReceipt("id&user_id=eq.other", token, {
        env: env(),
        fetchImpl: () => assert.fail("No fetch"),
      }),
    (error) => error.status === 400,
  );
  let calls = 0;
  await assert.rejects(
    () =>
      getOwnedReceipt(ID, token, {
        env: env(),
        fetchImpl: async () =>
          ++calls === 1 ? json(user()) : json([{ ...row(), cargo: "   " }]),
      }),
    (error) => error.code === "RECEIPT_INVALID",
  );
});

test("Timeout and upstream failure are sanitized, even when mocked fetch ignores abort", async () => {
  const settings = { ...env(), SUPABASE_TIMEOUT_MS: "25" };
  const started = Date.now();
  await assert.rejects(
    () =>
      verifyUser(token, {
        env: settings,
        fetchImpl: () => new Promise(() => {}),
      }),
    (error) => error.status === 503 && error.code === "AUTH_UNAVAILABLE",
  );
  assert.ok(Date.now() - started < 250);
  await assert.rejects(
    () =>
      verifyUser(token, {
        env: settings,
        fetchImpl: () => {
          throw new Error(`private ${token} ${settings.SUPABASE_ANON_KEY}`);
        },
      }),
    (error) => {
      assert.ok(!String(error.stack).includes(token));
      assert.ok(!String(error.stack).includes(settings.SUPABASE_ANON_KEY));
      return true;
    },
  );
  await assert.rejects(
    () =>
      verifyUser(token, {
        env: settings,
        fetchImpl: async () => json({ error: "private" }, 401),
      }),
    (error) => error.status === 401 && error.code === "AUTH_REQUIRED",
  );
});

test("Cancellation does not leak caller reason or start the next request", async () => {
  const controller = new AbortController();
  let calls = 0;
  const pending = verifyUser(token, {
    env: env(),
    signal: controller.signal,
    fetchImpl: () => {
      calls++;
      return new Promise(() => {});
    },
  });
  setTimeout(() => controller.abort("private caller reason"), 5);
  await assert.rejects(
    () => pending,
    (error) =>
      error.code === "AUTH_CANCELLED" &&
      !String(error).includes("private caller"),
  );
  assert.equal(calls, 1);
});
