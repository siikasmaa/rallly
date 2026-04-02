import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { usePlausible } from "next-plausible";
import React from "react";
import toast from "react-hot-toast";
import { useTimeoutFn } from "react-use";

import FullPageLoader from "@/components/full-page-loader";
import {
  decryptToken,
  mergeGuestsIntoUser,
  withSessionSsr,
} from "@/utils/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { nanoid } from "@/utils/nanoid";
import { eq } from "drizzle-orm";

const Page: NextPage<{ success: boolean; redirectTo: string }> = ({
  success,
  redirectTo,
}) => {
  const router = useRouter();
  const pluasible = usePlausible();
  if (!success) {
    toast.error("Login failed! Link is expired or invalid");
  }

  useTimeoutFn(() => {
    if (success) {
      pluasible("Login completed");
    }
    router.replace(redirectTo);
  }, 100);

  return (
    <>
      <Head>
        <title>Logging in…</title>
      </Head>
      <FullPageLoader>Logging in…</FullPageLoader>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  async ({ req, query }) => {
    const { code } = query;
    if (typeof code !== "string") {
      return {
        props: {},
        redirect: {
          destination: "/new",
        },
      };
    }

    const {
      email,
      path = "/new",
      guestId,
    } = await decryptToken<{
      email?: string;
      path?: string;
      guestId?: string;
    }>(code);

    if (!email) {
      return {
        props: {
          success: false,
          redirectTo: path,
        },
      };
    }

    const db = getDb();
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      const userId = await nanoid();
      await db.insert(users).values({
        id: userId,
        name: email.substring(0, email.indexOf("@")),
        email,
      });
      user = { id: userId, name: email.substring(0, email.indexOf("@")), email, createdAt: new Date(), updatedAt: null };
    }

    const guestIds: string[] = [];

    // guest id from existing sessions
    if (req.session.user?.isGuest) {
      guestIds.push(req.session.user.id);
    }
    // guest id from token
    if (guestId && guestId !== req.session.user?.id) {
      guestIds.push(guestId);
    }

    if (guestIds.length > 0) {
      await mergeGuestsIntoUser(user.id, guestIds);
    }

    req.session.user = {
      isGuest: false,
      id: user.id,
    };

    await req.session.save();

    return {
      props: {
        success: true,
        redirectTo: path,
      },
    };
  },
);

export default Page;
