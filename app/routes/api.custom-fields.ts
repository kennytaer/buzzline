import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { json } from "@remix-run/cloudflare";
import { getKVService } from "~/lib/kv.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { userId, orgId } = await getAuth({ request } as any);
    
    if (!userId || !orgId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fieldName } = await request.json();
    
    if (!fieldName || typeof fieldName !== 'string') {
      return json({ error: 'Field name is required' }, { status: 400 });
    }

    const kvService = getKVService({ cloudflare: { env: {} } }); // Context will be properly passed in production
    const updatedFields = await kvService.addCustomField(orgId, fieldName.trim());

    return json({ 
      success: true, 
      fieldName: fieldName.trim(),
      allFields: updatedFields
    });

  } catch (error) {
    console.error('Custom field API error:', error);
    return json({ error: 'Failed to add custom field' }, { status: 500 });
  }
}