import * as m from "@/paraglide/messages";
import * as React from "react";

import Bell from "@/components/icons/bell.svg?react";
import Chat from "@/components/icons/chat.svg?react";
import Clock from "@/components/icons/clock.svg?react";
import DeviceMobile from "@/components/icons/device-mobile.svg?react";

const Features: React.VoidFunctionComponent = () => {
  return (
    <div className="mx-auto max-w-7xl py-16 px-8">
      <h2 className="heading">{m.homepage_features()}</h2>
      <p className="subheading">{m.homepage_featuresSubheading()}</p>
      <div className="grid grid-cols-2 gap-12">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-green-100/50 p-3 text-green-400">
            <Clock className="h-8 w-8" />
          </div>
          <h3 className="heading-sm flex items-center">
            {m.homepage_timeSlots()}
            <span className="ml-2 rounded-full bg-green-500 px-2 py-1 text-sm font-normal text-white">
              {m.homepage_new()}
            </span>
          </h3>
          <p className="text">{m.homepage_timeSlotsDescription()}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-cyan-100/50 p-3 text-cyan-400">
            <DeviceMobile className="h-8 w-8" />
          </div>
          <h3 className="heading-sm">{m.homepage_mobileFriendly()}</h3>
          <p className="text">{m.homepage_mobileFriendlyDescription()}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-rose-100/50 p-3 text-rose-400">
            <Bell className="h-8 w-8" />
          </div>
          <h3 className="heading-sm">{m.homepage_notifications()}</h3>
          <p className="text">{m.homepage_notificationsDescription()}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-yellow-100/50 p-3 text-yellow-400">
            <Chat className="h-8 w-8" />
          </div>
          <h3 className="heading-sm">{m.homepage_comments()}</h3>
          <p className="text">{m.homepage_commentsDescription()}</p>
        </div>
      </div>
    </div>
  );
};

export default Features;
