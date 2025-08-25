import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { getKVService } from "~/lib/kv.server";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth({ request, context });
  
  if (!userId || !orgId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const uploadId = params.uploadId;
  if (!uploadId) {
    return json({ error: "Upload ID required" }, { status: 400 });
  }

  const kvService = getKVService(context);
  const key = `org:${orgId}:upload_status:${uploadId}`;
  
  try {
    const statusData = await kvService.getCache(key);
    
    if (!statusData) {
      return json({ error: "Upload not found" }, { status: 404 });
    }

    return json(statusData);
  } catch (error) {
    console.error("Error fetching upload status:", error);
    return json({ error: "Failed to fetch upload status" }, { status: 500 });
  }
}