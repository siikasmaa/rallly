import * as m from "@/paraglide/messages";
import React from "react";

import PlusCircle from "@/components/icons/plus-circle.svg?react";
import CursorClick from "@/components/icons/cursor-click.svg?react";

import { withSession } from "./session";
import StandardLayout from "./standard-layout";

const Home: React.VoidFunctionComponent = () => {
  return (
    <StandardLayout>
      <div className="max-w-full py-8 px-4 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-slate-800">
            {m.homepage_heroSubText()}
          </h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
          <a
            href="/new"
            className="group flex flex-col rounded-xl border bg-white p-6 shadow-sm transition-all hover:border-primary-300 hover:shadow-md hover:no-underline"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-500 transition-colors group-hover:bg-primary-100">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div className="text-lg font-semibold text-slate-800">
              {m.app_newPoll()}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {m.homepage_featuresSubheading()}
            </div>
          </a>
          <a
            href="/demo"
            className="group flex flex-col rounded-xl border bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md hover:no-underline"
            rel="nofollow"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition-colors group-hover:bg-slate-100">
              <CursorClick className="h-6 w-6" />
            </div>
            <div className="text-lg font-semibold text-slate-800">
              {m.homepage_liveDemo()}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {m.app_demoPollNotice()}
            </div>
          </a>
        </div>
      </div>
    </StandardLayout>
  );
};

export default withSession(Home);
