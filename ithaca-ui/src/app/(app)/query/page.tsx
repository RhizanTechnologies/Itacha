import { redirect } from "next/navigation";

/** Query builder is unified into Explore entry for a simpler path to value. */
export default function QueryPage() {
  redirect("/explore");
}
