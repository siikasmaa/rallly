import type { VoteType } from "@/db/schema";
import clsx from "clsx";
import * as React from "react";

import CheckCircle from "@/components/icons/check-circle.svg?react";
import IfNeedBe from "@/components/icons/if-need-be.svg?react";
import QuestionMark from "@/components/icons/question-mark.svg?react";
import X from "@/components/icons/x-circle.svg?react";

const VoteIcon: React.VoidFunctionComponent<{
  type?: VoteType;
  size?: "sm" | "md";
  className?: string;
}> = ({ type, className, size = "md" }) => {
  switch (type) {
    case "yes":
      return (
        <CheckCircle
          className={clsx("text-green-400", className, {
            "h-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    case "ifNeedBe":
      return (
        <IfNeedBe
          className={clsx("text-amber-300", className, {
            "h-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    case "no":
      return (
        <X
          className={clsx("text-slate-300", className, {
            "h-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    default:
      return (
        <QuestionMark
          className={clsx("text-slate-300", className, {
            "h-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );
  }
};

export default VoteIcon;
