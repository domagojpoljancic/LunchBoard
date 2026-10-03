import { revalidatePath } from "next/cache";

/** Refresh every page. Dynamic week routes sit under the root layout. */
export function revalidateApp() {
  revalidatePath("/", "layout");
}
