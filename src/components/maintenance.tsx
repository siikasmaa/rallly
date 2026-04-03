import React from "react";

import Clock from "@/components/icons/clock.svg?react";
import Logo from "~/public/logo.svg?react";

const Maintenance: React.VoidFunctionComponent = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-100">
      <div className="w-96 rounded-lg border bg-white p-8 text-center shadow-sm">
        <div className="mb-4">
          <Clock className="text-primary-500 inline-block h-20" />
        </div>
        <div className="">
          The site is currently down for some maintenance and will be back
          shortly…
        </div>
      </div>
      <Logo className="mt-8 inline-block h-8 text-slate-300" />
    </div>
  );
};

export default Maintenance;
