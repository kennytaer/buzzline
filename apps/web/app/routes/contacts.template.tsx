import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { requireAuthWithOrg } from "~/utils/auth.server";

export async function loader(args: LoaderFunctionArgs) {
  await requireAuthWithOrg(args);
  
  const csvTemplate = `firstName,lastName,email,phone,company,industry,city,state
John,Doe,john.doe@example.com,+1-555-123-4567,Acme Corp,Technology,San Francisco,CA
Jane,Smith,jane.smith@example.com,+1-555-987-6543,Beta Inc,Marketing,New York,NY
Mike,Johnson,mike.johnson@example.com,+1-555-456-7890,Gamma LLC,Healthcare,Chicago,IL`;
  
  return new Response(csvTemplate, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="buzzline-contact-template.csv"',
      'Cache-Control': 'no-cache'
    }
  });
}