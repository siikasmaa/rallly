import {
  createGuestUser,
  getSessionFromCookie,
  getSessionCookieName,
  type SessionUser,
} from "../utils/auth";

export interface AppContext {
  session: {
    user: SessionUser;
    save: () => Promise<void>;
    destroy: () => void;
  };
}

export async function createContext(opts: {
  req: Request;
}): Promise<AppContext> {
  const { req } = opts;
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    }),
  );

  const cookieName = getSessionCookieName();
  const sessionData = await getSessionFromCookie(cookies[cookieName]);
  let user: SessionUser = sessionData?.user ?? (await createGuestUser());

  return {
    session: {
      get user() {
        return user;
      },
      set user(newUser: SessionUser) {
        user = newUser;
      },
      async save() {
        // Session saving is handled by the response cookie in the API handler
      },
      destroy() {
        // Session destruction is handled by clearing the cookie
      },
    },
  };
}
