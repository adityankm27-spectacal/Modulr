import { PageSkeleton } from "@/components/page-skeleton";

/**
 * Shown the instant a link is clicked, for every page without its own loading
 * screen, so a click never looks frozen while the server answers.
 */
export default function Loading() {
  return <PageSkeleton />;
}
