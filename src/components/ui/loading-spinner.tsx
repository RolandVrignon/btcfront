import dynamic from "next/dynamic";

export const LoadingSpinner = dynamic(
  () =>
    Promise.resolve(() => (
      <div
        className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      />
    )),
  { ssr: false },
);
