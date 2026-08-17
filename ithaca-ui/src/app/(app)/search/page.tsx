import { redirect } from "next/navigation";

/** Search is unified into Explore empty state / ⌘K. */
export default function SearchPage() {
  redirect("/explore");
}
