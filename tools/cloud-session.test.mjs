import { describe, expect, test } from "bun:test";
import { createGuestSessionManager } from "../src/lib/cloud-session";

describe("background cloud guest identity", () => {
  test("concurrent sync requests share one signup and keep reusing its identity", async () => {
    let stored = null;
    let signups = 0;
    const manager = createGuestSessionManager({
      getSession: async () => ({ data: { session: stored }, error: null }),
      signInAnonymously: async () => {
        signups += 1;
        // Yield once so overlapping callers enter before the guest is saved.
        await Promise.resolve();
        stored = { user: { id: "guest-a" } };
        return { data: { session: stored }, error: null };
      },
    });
    expect(
      await Promise.all([
        manager.ensureOwner(),
        manager.ensureOwner(),
        manager.ensureOwner(),
      ]),
    ).toEqual(["guest-a", "guest-a", "guest-a"]);
    expect(await manager.ensureOwner()).toBe("guest-a");
    expect(signups).toBe(1);
    expect(manager.peekOwner()).toBe("guest-a");
  });

  test("refresh failure never creates a replacement owner", async () => {
    const failure = new Error("offline refresh");
    let signups = 0;
    const manager = createGuestSessionManager({
      getSession: async () => ({ data: { session: null }, error: failure }),
      signInAnonymously: async () => {
        signups += 1;
        return {
          data: { session: { user: { id: "wrong-owner" } } },
          error: null,
        };
      },
    });
    await expect(manager.ensureOwner()).rejects.toBe(failure);
    await expect(manager.ensureOwner()).rejects.toBe(failure);
    expect(signups).toBe(0);
  });

  test("exclusive get-or-create sequence rechecks stored session across tabs", async () => {
    let stored = null;
    let signups = 0;
    let tail = Promise.resolve("");
    const exclusive = (work) => {
      tail = tail.then(work);
      return tail;
    };
    const auth = {
      getSession: async () => ({ data: { session: stored }, error: null }),
      signInAnonymously: async () => {
        signups += 1;
        stored = { user: { id: "shared-guest" } };
        return { data: { session: stored }, error: null };
      },
    };
    const first = createGuestSessionManager(auth, exclusive);
    const second = createGuestSessionManager(auth, exclusive);
    expect(
      await Promise.all([first.ensureOwner(), second.ensureOwner()]),
    ).toEqual(["shared-guest", "shared-guest"]);
    expect(signups).toBe(1);
  });

  test("a late session result cannot overwrite a newer Auth identity", async () => {
    let release;
    const held = new Promise((resolve) => {
      release = resolve;
    });
    const manager = createGuestSessionManager({
      getSession: async () => {
        await held;
        return {
          data: { session: { user: { id: "old-guest" } } },
          error: null,
        };
      },
      signInAnonymously: async () => {
        throw new Error("Unexpected signup");
      },
    });
    manager.updateOwner("old-guest");
    const pending = manager.ensureOwner();
    manager.updateOwner("new-guest");
    release();
    await expect(pending).rejects.toThrow("Cloud guest identity changed");
    expect(manager.peekOwner()).toBe("new-guest");
  });
});
