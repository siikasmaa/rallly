import clsx from "clsx";
import * as m from "@/paraglide/messages";
import React from "react";

import { useDayjs } from "../utils/dayjs";
import { LanguageSelect } from "./poll/language-selector";

const usePlausible = () => (eventName: string, props?: unknown) => {};

const Preferences: React.VoidFunctionComponent = () => {
  const { weekStartsOn, setWeekStartsOn, timeFormat, setTimeFormat } =
    useDayjs();

  const plausible = usePlausible();
  return (
    <div>
      <div className="mb-4 space-y-2">
        <div className="grow text-sm text-slate-500">
          {m.common_language()}
        </div>
        <LanguageSelect className="w-full" onChange={() => window.location.reload()} />
      </div>
      <div className="grow space-y-2">
        <div>
          <div className="mb-2 grow text-sm text-slate-500">
            {m.app_weekStartsOn()}
          </div>
          <div>
            <div className="segment-button inline-flex">
              <button
                className={clsx({
                  "segment-button-active": weekStartsOn === "monday",
                })}
                onClick={() => {
                  setWeekStartsOn("monday");
                  plausible("Change week start", {
                    props: {
                      timeFormat: "monday",
                    },
                  });
                }}
                type="button"
              >
                {m.app_monday()}
              </button>
              <button
                className={clsx({
                  "segment-button-active": weekStartsOn === "sunday",
                })}
                onClick={() => {
                  setWeekStartsOn("sunday");
                  plausible("Change week start", {
                    props: {
                      timeFormat: "sunday",
                    },
                  });
                }}
                type="button"
              >
                {m.app_sunday()}
              </button>
            </div>
          </div>
        </div>
        <div className="">
          <div className="mb-2 grow text-sm text-slate-500">
            {m.app_timeFormat()}
          </div>
          <div className="segment-button inline-flex">
            <button
              className={clsx({
                "segment-button-active": timeFormat === "12h",
              })}
              onClick={() => {
                setTimeFormat("12h");
                plausible("Change time format", {
                  props: {
                    timeFormat: "12h",
                  },
                });
              }}
              type="button"
            >
              {m.app_$12h()}
            </button>
            <button
              className={clsx({
                "segment-button-active": timeFormat === "24h",
              })}
              onClick={() => {
                setTimeFormat("24h");
                plausible("Change time format", {
                  props: {
                    timeFormat: "24h",
                  },
                });
              }}
              type="button"
            >
              {m.app_$24h()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
