import { Trans, useTranslation } from "react-i18next";
import * as React from "react";

import { api } from "../../utils/api";
import { Button } from "../button";
import { usePoll } from "../poll-context";

export const UnverifiedPollNotice = () => {
  const { t } = useTranslation("app");
  const { poll } = usePoll();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const requestVerificationEmail = React.useCallback(async () => {
    setIsLoading(true);
    try {
      await api.api.polls.verification.request.post({
        pollId: poll.id,
        adminUrlId: poll.adminUrlId,
      });
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  }, [poll.id, poll.adminUrlId]);

  return (
    <div>
      <div className="md:flex md:justify-between md:space-x-4">
        <div className="mb-4 md:mb-0 md:w-2/3">
          <Trans
            t={t}
            i18nKey="unverifiedMessage"
            values={{ email: poll.user.email }}
            components={{
              b: (
                <span className="whitespace-nowrap font-medium text-slate-700" />
              ),
            }}
          />
        </div>
        <Button
          onClick={() => {
            requestVerificationEmail();
          }}
          disabled={isSuccess}
          loading={isLoading}
        >
          {isSuccess
            ? "Vertification email sent"
            : "Resend verification email"}
        </Button>
      </div>
    </div>
  );
};
