import * as React from "react";

import Logo from "~/public/logo.svg?react";

export interface PageLayoutProps {
  children?: React.ReactNode;
}

const PageLayout: React.VoidFunctionComponent<PageLayoutProps> = ({
  children,
}) => {
  return (
    <div className="bg-pattern min-h-full overflow-x-hidden">
      <div className="mx-auto flex max-w-7xl items-center py-8 px-8">
        <a href="/">
          <Logo className="w-40 text-primary-500" alt="Rallly" />
        </a>
      </div>
      <div className="md:min-h-[calc(100vh-460px)]">{children}</div>
      <div className="mt-16 py-8 text-center text-sm text-slate-400">
        <Logo className="mx-auto mb-2 h-5 text-slate-400" />
      </div>
    </div>
  );
};

export default PageLayout;
