"use client";

import { trackGitHubOutbound } from "@/lib/umami";

export function GitHubLink({
  href,
  repoFullName,
  children,
  className,
}: {
  href: string;
  repoFullName: string;
  children: React.ReactNode;
  className?: string;
}) {
  const handleClick = () => {
    trackGitHubOutbound(repoFullName);
  };

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
