import React from "react";

const NoSsr: React.VoidFunctionComponent<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default NoSsr;
