import clsx from "clsx";
import * as m from "@/paraglide/messages";
import * as React from "react";
import toast from "react-hot-toast";
import { useCopyToClipboard } from "react-use";

import { Button } from "./button";
import { usePoll } from "./poll-context";

export interface SharingProps {
  onHide: () => void;
  className?: string;
}

const Sharing: React.VoidFunctionComponent<SharingProps> = ({
  onHide,
  className,
}) => {
  const { poll } = usePoll();
  const [state, copyToClipboard] = useCopyToClipboard();

  React.useEffect(() => {
    if (state.error) {
      toast.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  const participantUrl = `${window.location.origin}/p/${poll.participantUrlId}`;
  const [didCopy, setDidCopy] = React.useState(false);
  return (
    <div className={clsx("card p-4", className)}>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-700">
          {m.app_shareLink()}
        </div>
        <button
          onClick={onHide}
          className="h-8 items-center justify-center rounded-md px-3 text-slate-400 transition-colors hover:bg-slate-500/10 hover:text-slate-500 active:bg-slate-500/20"
        >
          {m.app_hide()}
        </button>
      </div>
      <div className="mb-4 text-slate-600">
        <span
          dangerouslySetInnerHTML={{
            __html: m.app_shareDescription(),
          }}
        />
      </div>
      <div className="relative">
        <input
          readOnly={true}
          className={clsx(
            "mb-4 w-full rounded-md bg-gray-100 p-2 text-slate-600 transition-all md:mb-0 md:p-3 md:text-lg",
            {
              "bg-slate-50 opacity-75": didCopy,
            },
          )}
          value={participantUrl}
        />
        <Button
          disabled={didCopy}
          type="primary"
          onClick={() => {
            copyToClipboard(participantUrl);
            setDidCopy(true);
            setTimeout(() => {
              setDidCopy(false);
            }, 1000);
          }}
          className="md:absolute md:top-1/2 md:right-3 md:-translate-y-1/2"
        >
          {didCopy ? m.app_copied() : m.app_copyLink()}
        </Button>
      </div>
    </div>
  );
};

export default Sharing;
