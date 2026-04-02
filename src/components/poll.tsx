import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import React from "react";
import toast from "react-hot-toast";
import { useMount } from "react-use";

const usePlausible = () => (eventName: string, props?: unknown) => {};

import { Button } from "@/components/button";
import LockClosed from "@/components/icons/lock-closed.svg";
import Share from "@/components/icons/share.svg";
import { preventWidows } from "@/utils/prevent-widows";

import { api } from "../utils/api";
import { useParticipants } from "./participants-provider";
import ManagePoll from "./poll/manage-poll";
import { useUpdatePollMutation } from "./poll/mutations";
import NotificationsToggle from "./poll/notifications-toggle";
import PollSubheader from "./poll/poll-subheader";
import TruncatedLinkify from "./poll/truncated-linkify";
import { UnverifiedPollNotice } from "./poll/unverified-poll-notice";
import { useTouchBeacon } from "./poll/use-touch-beacon";
import { UserAvatarProvider } from "./poll/user-avatar";
import VoteIcon from "./poll/vote-icon";
import { usePoll } from "./poll-context";
import { useSession } from "./session";
import Sharing from "./sharing";

const Discussion = React.lazy(() => import("@/components/discussion"));

const DesktopPoll = React.lazy(() => import("@/components/poll/desktop-poll"));
const MobilePoll = React.lazy(() => import("@/components/poll/mobile-poll"));

const PollPage: React.VoidFunctionComponent = () => {
  const { poll, urlId, admin } = usePoll();
  const { participants } = useParticipants();
  const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

  useTouchBeacon(poll.id);

  const { t } = useTranslation("app");

  const session = useSession();

  const plausible = usePlausible();

  const { mutate: updatePollMutation } = useUpdatePollMutation();

  const [isVerifying, setIsVerifying] = React.useState(false);

  const verifyEmail = React.useCallback(
    async (input: { code: string; pollId: string }) => {
      setIsVerifying(true);
      try {
        const { error } = await api.api.polls.verification.verify.post(input);
        if (error) {
          toast.error(t("linkHasExpired"));
        } else {
          toast.success(t("pollHasBeenVerified"));
          session.refresh();
          plausible("Verified email");
        }
      } catch {
        toast.error(t("linkHasExpired"));
      } finally {
        setIsVerifying(false);
        const urlIdParam = queryParams.get("urlId") ?? urlId;
        window.location.replace(`/admin/${urlIdParam}`);
      }
    },
    [session, plausible, t, queryParams, urlId],
  );

  useMount(() => {
    const code = queryParams.get("code");
    if (typeof code === "string" && !poll.verified) {
      verifyEmail({ code, pollId: poll.id });
    }
  });

  React.useEffect(() => {
    if (queryParams.get("unsubscribe")) {
      updatePollMutation(
        { urlId: urlId, notifications: false },
        {
          onSuccess: () => {
            toast.success(t("notificationsDisabled"));
            plausible("Unsubscribed from notifications");
          },
        },
      );
      const urlIdParam = queryParams.get("urlId") ?? urlId;
      window.location.replace(`/admin/${urlIdParam}`);
    }
  }, [plausible, urlId, queryParams, updatePollMutation, t]);

  const checkIfWideScreen = () => window.innerWidth > 640;

  const [isWideScreen, setIsWideScreen] = React.useState(checkIfWideScreen);

  React.useEffect(() => {
    const listener = () => setIsWideScreen(checkIfWideScreen());

    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  const PollComponent = isWideScreen ? DesktopPoll : MobilePoll;

  const names = React.useMemo(
    () => participants?.map(({ name }) => name) ?? [],
    [participants],
  );

  const [isSharingVisible, setSharingVisible] = React.useState(
    !!queryParams.get("sharing"),
  );
  return (
    <UserAvatarProvider seed={poll.id} names={names}>
      <div className="relative max-w-full py-4 md:px-4">
        <div
          className="mx-auto max-w-full lg:mx-0"
          style={{
            width: Math.max(768, poll.options.length * 95 + 200 + 160),
          }}
        >
          {admin ? (
            <>
              <div className="mb-4 flex space-x-2 px-4 md:justify-end md:px-0">
                <NotificationsToggle />
                <ManagePoll
                  placement={isWideScreen ? "bottom-end" : "bottom-start"}
                />
                <Button
                  type="primary"
                  icon={<Share />}
                  onClick={() => {
                    setSharingVisible((value) => !value);
                  }}
                >
                  {t("share")}
                </Button>
              </div>
              <AnimatePresence initial={false}>
                {isSharingVisible ? (
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      height: "auto",
                      marginBottom: 16,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      height: 0,
                      marginBottom: 0,
                    }}
                    className="overflow-hidden"
                  >
                    <Sharing
                      onHide={() => {
                        setSharingVisible(false);
                      }}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
              {poll.verified === false ? (
                <div className="m-4 overflow-hidden rounded-lg border p-4 md:mx-0 md:mt-0">
                  <UnverifiedPollNotice />
                </div>
              ) : null}
            </>
          ) : null}
          {!poll.admin && poll.adminUrlId ? (
            <div className="mb-4 items-center justify-between rounded-lg px-4 md:flex md:space-x-4 md:border md:p-2 md:pl-4">
              <div className="mb-4 font-medium md:mb-0">
                {t("pollOwnerNotice", { name: poll.user.name })}
              </div>
              <a href={`/admin/${poll.adminUrlId}`} className="btn-default">
                {t("goToAdmin")} &rarr;
              </a>
            </div>
          ) : null}
          {poll.closed ? (
            <div className="flex bg-sky-100 py-3 px-4 text-sky-700 md:mb-4 md:rounded-lg md:shadow-sm">
              <div className="mr-2 rounded-md">
                <LockClosed className="w-6" />
              </div>
              <div>
                <div className="font-medium">{t("pollHasBeenLocked")}</div>
              </div>
            </div>
          ) : null}
          <div className="md:card mb-4 border-t bg-white md:overflow-hidden md:p-0">
            <div className="p-4 md:border-b md:p-6">
              <div className="space-y-4">
                <div>
                  <div
                    className="mb-1 text-2xl font-semibold text-slate-700 md:text-left md:text-3xl"
                    data-testid="poll-title"
                  >
                    {preventWidows(poll.title)}
                  </div>
                  <PollSubheader />
                </div>
                {poll.description ? (
                  <div className="border-primary whitespace-pre-line lg:text-lg">
                    <TruncatedLinkify>
                      {preventWidows(poll.description)}
                    </TruncatedLinkify>
                  </div>
                ) : null}
                {poll.location ? (
                  <div className="lg:text-lg">
                    <div className="text-sm text-slate-500">
                      {t("location")}
                    </div>
                    <TruncatedLinkify>{poll.location}</TruncatedLinkify>
                  </div>
                ) : null}
                <div>
                  <div className="mb-2 text-sm text-slate-500">
                    {t("possibleAnswers")}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="yes" />
                      <span className="text-xs text-slate-500">{t("yes")}</span>
                    </span>
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="ifNeedBe" />
                      <span className="text-xs text-slate-500">
                        {t("ifNeedBe")}
                      </span>
                    </span>
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="no" />
                      <span className="text-xs text-slate-500">{t("no")}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <React.Suspense fallback={null}>
              {participants ? <PollComponent /> : null}
            </React.Suspense>
          </div>

          <React.Suspense fallback={<div className="p-4">{t("loading")}</div>}>
            <Discussion />
          </React.Suspense>
        </div>
      </div>
    </UserAvatarProvider>
  );
};

export default PollPage;
