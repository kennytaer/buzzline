import { useState, useEffect } from "react";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/node";
import { getKVService } from "~/lib/kv.server";
import { generateId } from "~/lib/utils";

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
}

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  try {
    const kvService = getKVService(args.context);
    
    // Get all contacts to extract available metadata fields
    const allContacts = await kvService.listContacts(orgId);
    
    // Extract unique metadata fields across all contacts
    const metadataFields = new Set<string>();
    allContacts.forEach(contact => {
      if (contact.metadata) {
        Object.keys(contact.metadata).forEach(key => {
          if (!key.endsWith('_display_name')) {
            metadataFields.add(key);
          }
        });
      }
    });

    // Standard fields
    const standardFields = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'optedOut', label: 'Opted Out Status' }
    ];

    // Convert metadata fields to field options
    const customFields = Array.from(metadataFields).map(key => {
      // Try to get display name from any contact that has it
      const displayName = allContacts.find(c => 
        c.metadata && c.metadata[`${key}_display_name`]
      )?.metadata[`${key}_display_name`] || key.replace(/_/g, ' ');
      
      return { key, label: displayName };
    });

    const availableFields = [...standardFields, ...customFields];

    return json({ orgId, availableFields, totalContacts: allContacts.length });
  } catch (error) {
    console.error("Error loading segment builder:", error);
    return json({ orgId, availableFields: [], totalContacts: 0 });
  }
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  const formData = await request.formData();
  const segmentName = formData.get("segmentName") as string;
  const segmentDescription = formData.get("segmentDescription") as string;
  const filtersJson = formData.get("filters") as string;

  if (!segmentName || !filtersJson) {
    return json({ error: "Segment name and filters are required" }, { status: 400 });
  }

  try {
    const filters: FilterRule[] = JSON.parse(filtersJson);
    const kvService = getKVService(args.context);
    
    // Get all contacts
    const allContacts = await kvService.listContacts(orgId);
    
    // Apply filters to find matching contacts
    const matchingContacts = allContacts.filter(contact => {
      return evaluateFilters(contact, filters);
    });

    // Create segment
    const segmentId = generateId();
    await kvService.createContactList(orgId, segmentId, {
      name: segmentName,
      description: segmentDescription,
      filters,
      type: 'dynamic', // Mark as dynamic segment vs static upload
      contactCount: matchingContacts.length
    });

    // Update all matching contacts to include this segment
    for (const contact of matchingContacts) {
      const existingLists = contact.contactListIds || [];
      if (!existingLists.includes(segmentId)) {
        contact.contactListIds = [...existingLists, segmentId];
        await kvService.createContact(orgId, contact.id, contact);
      }
    }

    return json({ 
      success: true, 
      segmentId,
      matchedContacts: matchingContacts.length 
    });
  } catch (error) {
    console.error("Error creating segment:", error);
    return json({ error: "Failed to create segment" }, { status: 500 });
  }
}

// Filter evaluation logic
function evaluateFilters(contact: any, filters: FilterRule[]): boolean {
  if (filters.length === 0) return true;
  
  let result = evaluateRule(contact, filters[0]);
  
  for (let i = 1; i < filters.length; i++) {
    const rule = filters[i];
    const ruleResult = evaluateRule(contact, rule);
    
    if (rule.logic === 'OR') {
      result = result || ruleResult;
    } else { // AND (default)
      result = result && ruleResult;
    }
  }
  
  return result;
}

function evaluateRule(contact: any, rule: FilterRule): boolean {
  let contactValue: any;
  
  // Get the value from contact
  if (['firstName', 'lastName', 'email', 'phone'].includes(rule.field)) {
    contactValue = contact[rule.field] || '';
  } else if (rule.field === 'optedOut') {
    contactValue = contact.optedOut ? 'true' : 'false';
  } else {
    // Custom metadata field
    contactValue = contact.metadata?.[rule.field] || '';
  }
  
  const filterValue = rule.value;
  
  // Convert to strings for comparison
  const contactStr = String(contactValue).toLowerCase();
  const filterStr = String(filterValue).toLowerCase();
  
  switch (rule.operator) {
    case 'equals':
      return contactStr === filterStr;
    case 'not_equals':
      return contactStr !== filterStr;
    case 'contains':
      return contactStr.includes(filterStr);
    case 'not_contains':
      return !contactStr.includes(filterStr);
    case 'starts_with':
      return contactStr.startsWith(filterStr);
    case 'ends_with':
      return contactStr.endsWith(filterStr);
    case 'greater_than':
      return parseFloat(contactValue) > parseFloat(filterValue);
    case 'less_than':
      return parseFloat(contactValue) < parseFloat(filterValue);
    case 'greater_equal':
      return parseFloat(contactValue) >= parseFloat(filterValue);
    case 'less_equal':
      return parseFloat(contactValue) <= parseFloat(filterValue);
    case 'is_empty':
      return !contactValue || contactValue === '';
    case 'is_not_empty':
      return contactValue && contactValue !== '';
    default:
      return false;
  }
}

export default function NewSegment() {
  const { availableFields, totalContacts } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  const [segmentName, setSegmentName] = useState("");
  const [segmentDescription, setSegmentDescription] = useState("");
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'greater_equal', label: 'Greater than or equal' },
    { value: 'less_equal', label: 'Less than or equal' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' }
  ];

  const addFilter = () => {
    const newFilter: FilterRule = {
      id: generateId(),
      field: availableFields[0]?.key || '',
      operator: 'equals',
      value: '',
      logic: filters.length > 0 ? 'AND' : undefined
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<FilterRule>) => {
    setFilters(filters.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    ));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(filter => filter.id !== id));
  };

  if (actionData && 'success' in actionData && actionData.success) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">Segment Created!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Successfully created segment "{segmentName}" with {actionData && 'matchedContacts' in actionData ? actionData.matchedContacts : 0} matching contacts.</p>
                </div>
                <div className="mt-4">
                  <a
                    href={`/dashboard/contacts/segments/${actionData && 'segmentId' in actionData ? actionData.segmentId : ''}`}
                    className="text-green-800 hover:text-green-900 font-medium"
                  >
                    View segment →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Create New Segment</h1>
            <p className="mt-2 text-sm text-gray-500">
              Create a dynamic segment by filtering your {totalContacts} contacts based on their properties.
            </p>
          </div>
        </div>

        {actionData && 'error' in actionData && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{actionData.error}</p>
          </div>
        )}

        <Form method="post" className="space-y-6">
          <input type="hidden" name="filters" value={JSON.stringify(filters)} />
          
          {/* Segment Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Segment Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Segment Name *
                </label>
                <input
                  type="text"
                  name="segmentName"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                  placeholder="e.g., High-Value Customers, Newsletter Subscribers"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="segmentDescription"
                  value={segmentDescription}
                  onChange={(e) => setSegmentDescription(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                  placeholder="Describe this segment..."
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Filters</h3>
              <button
                type="button"
                onClick={addFilter}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Filter
              </button>
            </div>

            {filters.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">No filters added yet. Add a filter to start building your segment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filters.map((filter, index) => (
                  <div key={filter.id} className="border border-gray-200 rounded-lg p-4">
                    {index > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logic</label>
                        <select
                          value={filter.logic || 'AND'}
                          onChange={(e) => updateFilter(filter.id, { logic: e.target.value as 'AND' | 'OR' })}
                          className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Field</label>
                        <select
                          value={filter.field}
                          onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                        >
                          {availableFields.map(field => (
                            <option key={field.key} value={field.key}>{field.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Operator</label>
                        <select
                          value={filter.operator}
                          onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                        >
                          {operators.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                        {filter.field === 'optedOut' ? (
                          <select
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                          >
                            <option value="false">Active</option>
                            <option value="true">Opted Out</option>
                          </select>
                        ) : ['is_empty', 'is_not_empty'].includes(filter.operator) ? (
                          <input
                            type="text"
                            value="(no value needed)"
                            disabled
                            className="block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500"
                          />
                        ) : (
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                            placeholder="Enter value..."
                          />
                        )}
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeFilter(filter.id)}
                          className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <a
              href="/dashboard/contacts"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={!segmentName || filters.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create Segment
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}