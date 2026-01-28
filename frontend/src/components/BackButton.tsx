"use client";

import { useRouter } from "next/navigation";

export function BackButton({
  fallbackHref,
  children,
  className,
}: {
  fallbackHref: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  );
}
