import * as m from "@/paraglide/messages";

const usePlausible = () => (eventName: string, props?: unknown) => {};
import * as React from "react";

import { Button } from "@/components/button";
import Bell from "@/components/icons/bell.svg?react";
import BellCrossed from "@/components/icons/bell-crossed.svg?react";

import { usePoll } from "../poll-context";
import Tooltip from "../tooltip";
import { useUpdatePollMutation } from "./mutations";

const NotificationsToggle: React.VoidFunctionComponent = () => {
  const { poll, urlId } = usePoll();
  const [isUpdatingNotifications, setIsUpdatingNotifications] =
    React.useState(false);

  const { mutate: updatePollMutation } = useUpdatePollMutation();

  const plausible = usePlausible();
  return (
    <Tooltip
      content={
        poll.verified ? (
          poll.notifications ? (
            <div>
              <div className="font-medium text-primary-300">
                {m.app_notificationsOn()}
              </div>
              <div className="max-w-sm">
                <span
                  dangerouslySetInnerHTML={{
                    __html: m.app_notificationsOnDescription({
                      email: poll.user.email,
                    }),
                  }}
                />
              </div>
            </div>
          ) : (
            m.app_notificationsOff()
          )
        ) : (
          m.app_notificationsVerifyEmail()
        )
      }
    >
      <Button
        loading={isUpdatingNotifications}
        icon={poll.verified && poll.notifications ? <Bell /> : <BellCrossed />}
        disabled={!poll.verified}
        onClick={() => {
          setIsUpdatingNotifications(true);
          updatePollMutation(
            {
              urlId,
              notifications: !poll.notifications,
            },
            {
              onSuccess: ({ notifications }) => {
                plausible(
                  notifications
                    ? "Turned notifications on"
                    : "Turned notifications off",
                );
                setIsUpdatingNotifications(false);
              },
            },
          );
        }}
      />
    </Tooltip>
  );
};

export default NotificationsToggle;
