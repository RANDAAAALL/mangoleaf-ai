import { supabase } from "@/lib/supabase-client";

type GuestSession = { user: { id: string } };
type GuestAuth = {
  getSession: () => Promise<{
    data: { session: GuestSession | null };
    error: unknown;
  }>;
  signInAnonymously: () => Promise<{
    data: { session: GuestSession | null };
    error: unknown;
  }>;
};

/** One session task at a time; refresh errors never create replacement guests. */
export function createGuestSessionManager(
  auth: GuestAuth,
  exclusive: (work: () => Promise<string>) => Promise<string> = (work) =>
    work(),
) {
  let pending: Promise<string> | null = null;
  let cachedOwner: string | undefined;
  let identityRevision = 0;

  return {
    peekOwner: () => cachedOwner,
    updateOwner: (owner: string | undefined) => {
      cachedOwner = owner;
      identityRevision += 1;
    },
    ensureOwner: () => {
      if (!pending) {
        pending = exclusive(async () => {
          const startingRevision = identityRevision;
          // getSession reuses the saved session and refreshes it when needed.
          const existing = await auth.getSession();
          if (existing.error) throw existing.error;
          let session = existing.data.session;
          if (!session) {
            const created = await auth.signInAnonymously();
            if (created.error) throw created.error;
            session = created.data.session;
          }
          if (!session) throw new Error("Cloud guest session is unavailable.");
          if (
            startingRevision !== identityRevision &&
            cachedOwner !== session.user.id
          ) {
            throw new Error(
              "Cloud guest identity changed during synchronization.",
            );
          }
          cachedOwner = session.user.id;
          return cachedOwner;
        }).finally(() => {
          pending = null;
        });
      }
      return pending;
    },
  };
}

const guestSession = createGuestSessionManager(supabase.auth, async (work) => {
  // SDK session locks protect individual Auth calls. This additional lock
  // covers the get-or-create sequence across tabs that support Web Locks.
  if (typeof navigator !== "undefined" && navigator.locks) {
    return await navigator.locks.request("mangoleaf-cloud-guest", work);
  }
  return work();
});

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((_event, session) => {
    // No async Auth work here: callbacks execute while the SDK holds its lock.
    guestSession.updateOwner(session?.user.id);
  });
}

export const peekCloudOwnerId = guestSession.peekOwner;

export async function getCloudOwnerId(): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      guestSession.ensureOwner(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("Cloud guest session timed out.")),
          15_000,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
