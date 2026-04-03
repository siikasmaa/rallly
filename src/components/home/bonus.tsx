import * as m from "@/paraglide/messages";
import * as React from "react";

import Code from "@/components/icons/code.svg?react";
import CursorClick from "@/components/icons/cursor-click.svg?react";
import Server from "@/components/icons/server.svg?react";

import Ban from "./ban-ads.svg?react";

const Bonus: React.VoidFunctionComponent = () => {
  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      <h2 className="heading">{m.homepage_principles()}</h2>
      <p className="subheading">{m.homepage_principlesSubheading()}</p>
      <div className="grid grid-cols-4 gap-16">
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <CursorClick className="w-16" />
          </div>
          <h3 className="heading-sm">{m.homepage_noLoginRequired()}</h3>
          <div className="text text-base leading-relaxed">
            {m.homepage_noLoginRequiredDescription()}
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <Code className="w-16" />
          </div>
          <h3 className="heading-sm">{m.homepage_openSource()}</h3>
          <div className="text text-base leading-relaxed">
            <span
              dangerouslySetInnerHTML={{
                __html: m.homepage_openSourceDescription().replace(
                  "<a>",
                  '<a href="https://github.com/lukevella/rallly">',
                ).replace("</a>", "</a>"),
              }}
            />
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <Server className="w-16" />
          </div>
          <h3 className="heading-sm">{m.homepage_selfHostable()}</h3>
          <div className="text text-base leading-relaxed">
            {m.homepage_selfHostableDescription()}
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <Ban className="w-16" />
          </div>
          <h3 className="heading-sm">{m.homepage_adFree()}</h3>
          <div className="text text-base leading-relaxed">
            {m.homepage_adFreeDescription()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bonus;
