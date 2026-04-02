import React from "react";
import toast from "react-hot-toast";

import { api } from "@/utils/api";

import FullPageLoader from "./full-page-loader";
import { useRequiredContext } from "./use-required-context";

export type UserSessionData = {
  id: string;
  isGuest: boolean;
};

export type SessionProps = {
  user: UserSessionData;
};

type ParticipantOrComment = {
  userId: string | null;
};

export type UserSessionDataExtended =
  | {
      isGuest: true;
      id: string;
      shortName: string;
    }
  | {
      isGuest: false;
      id: string;
      name: string;
      shortName: string;
      email: string;
    };

type SessionContextValue = {
  logout: () => void;
  user: UserSessionDataExtended;
  refresh: () => void;
  ownsObject: (obj: ParticipantOrComment) => boolean;
  isLoading: boolean;
};

export const SessionContext =
  React.createContext<SessionContextValue | null>(null);

SessionContext.displayName = "SessionContext";

export const SessionProvider: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = React.useState<
    | { isGuest: true; id: string }
    | { isGuest: false; id: string; name: string; email: string }
    | null
  >(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchSession = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.api.session.get.get();
      setUser(data as typeof user);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const logout = React.useCallback(async () => {
    const promise = api.api.session.destroy.post().then(() => {
      fetchSession();
    });
    toast.promise(promise, {
      loading: "Logging out\u2026",
      success: "Logged out",
      error: "Failed to log out",
    });
  }, [fetchSession]);

  if (!user) {
    return <FullPageLoader>Loading user\u2026</FullPageLoader>;
  }

  const sessionData: SessionContextValue = {
    user: {
      ...user,
      shortName: user.isGuest
        ? user.id.substring(0, 10)
        : user.name.length > 12 && user.name.indexOf(" ") !== -1
          ? user.name.substring(0, user.name.indexOf(" "))
          : user.name,
    },
    refresh: () => {
      fetchSession();
    },
    isLoading,
    logout,
    ownsObject: (obj) => {
      return obj.userId === user.id;
    },
  };

  return (
    <SessionContext.Provider value={sessionData}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  return useRequiredContext(SessionContext);
};

export const withSession = <P extends SessionProps>(
  component: React.ComponentType<P>,
) => {
  const ComposedComponent: React.VoidFunctionComponent<P> = (props: P) => {
    const Component = component;
    return (
      <SessionProvider>
        <Component {...props} />
      </SessionProvider>
    );
  };
  ComposedComponent.displayName = component.displayName;
  return ComposedComponent;
};

export const isUnclaimed = (obj: ParticipantOrComment) => !obj.userId;
