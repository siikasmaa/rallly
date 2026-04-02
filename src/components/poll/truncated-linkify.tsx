import Linkify from "linkify-react";
import * as React from "react";

import Tooltip from "../tooltip";

const renderLink = ({
  attributes,
  content,
}: {
  attributes: Record<string, any>;
  content: string;
}) => {
  const { href, ...rest } = attributes;
  const textWithoutProtocol = content.replace(/^https?:\/\//i, "");
  const beginningOfPath = textWithoutProtocol.indexOf("/");
  let finalText = textWithoutProtocol;
  if (beginningOfPath !== -1) {
    finalText = textWithoutProtocol.substring(0, beginningOfPath + 15);
  }

  if (finalText.length === textWithoutProtocol.length) {
    return (
      <a href={href} rel="nofollow noreferrer" {...rest}>
        {finalText}
      </a>
    );
  } else {
    finalText += "\u2026";
    return (
      <Tooltip
        content={
          <div className="max-w-md break-all font-mono text-xs">{href}</div>
        }
      >
        <a href={href} rel="nofollow noreferrer" {...rest}>
          {finalText}
        </a>
      </Tooltip>
    );
  }
};

const TruncatedLinkify: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  return <Linkify options={{ render: renderLink }}>{children}</Linkify>;
};

export default TruncatedLinkify;
