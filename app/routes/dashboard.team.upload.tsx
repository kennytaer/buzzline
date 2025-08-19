import { useState } from "react";
import { useActionData, Form, Link, useNavigate } from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/node";
import { getSalesTeamService } from "~/lib/sales-team.server";
import { Icons } from "~/components/Icons";

export async function action(args: ActionFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/sign-in");
  }

  const formData = await args.request.formData();
  const csvData = formData.get("csvData") as string;

  if (!csvData) {
    return json(
      { error: "Please provide CSV data" },
      { status: 400 }
    );
  }

  try {
    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const members = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 3) continue; // Skip incomplete rows
      
      const member = {
        firstName: values[headers.indexOf('firstname') || headers.indexOf('first_name') || 0] || '',
        lastName: values[headers.indexOf('lastname') || headers.indexOf('last_name') || 1] || '',
        email: values[headers.indexOf('email') || 2] || '',
        phone: values[headers.indexOf('phone') || headers.indexOf('phone_number')] || undefined,
        title: values[headers.indexOf('title') || headers.indexOf('job_title')] || undefined,
        department: values[headers.indexOf('department')] || undefined,
        bio: values[headers.indexOf('bio') || headers.indexOf('description')] || undefined,
        isActive: true,
      };

      if (member.firstName && member.lastName && member.email) {
        members.push(member);
      }
    }

    if (members.length === 0) {
      return json(
        { error: "No valid team members found in CSV data" },
        { status: 400 }
      );
    }

    const salesTeamService = getSalesTeamService();
    await salesTeamService.importMembers(orgId, members);

    return redirect(`/dashboard/team?imported=${members.length}`);
  } catch (error) {
    return json(
      { error: "Failed to import team members" },
      { status: 500 }
    );
  }
}

export default function UploadTeam() {
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      alert("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const sampleCSV = `firstname,lastname,email,phone,title,department
John,Smith,john.smith@company.com,+1-555-0101,Sales Representative,Sales
Jane,Doe,jane.doe@company.com,+1-555-0102,Account Manager,Sales
Mike,Johnson,mike.j@company.com,+1-555-0103,Sales Director,Sales`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-accent-600 hover:text-accent-900 hover:bg-accent-100 rounded-lg transition-colors"
        >
          <Icons.ChevronLeft />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-accent-900">Upload Sales Team</h1>
          <p className="text-accent-600 mt-1">
            Import multiple team members from a CSV file
          </p>
        </div>
      </div>

      {/* Error Message */}
      {actionData?.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Icons.Warning className="text-red-500" />
            <p className="text-red-700">{actionData.error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-white rounded-lg border border-accent-200 p-6">
          <h2 className="text-lg font-medium text-accent-900 mb-4">Upload CSV File</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary-400 bg-primary-50"
                : "border-accent-300 hover:border-accent-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Icons.Upload className="mx-auto text-accent-400 mb-4" size="xl" />
            <p className="text-accent-600 mb-4">
              Drag and drop your CSV file here, or click to select
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="csvFile"
            />
            <label
              htmlFor="csvFile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors cursor-pointer"
            >
              <Icons.Upload size="sm" />
              Choose File
            </label>
          </div>

          {/* CSV Preview */}
          {csvData && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-accent-700 mb-2">Preview</h3>
              <div className="bg-accent-50 rounded-lg p-3 max-h-48 overflow-auto">
                <pre className="text-xs text-accent-600 whitespace-pre-wrap">
                  {csvData.substring(0, 500)}
                  {csvData.length > 500 && "..."}
                </pre>
              </div>
            </div>
          )}

          {/* Submit */}
          {csvData && (
            <Form method="post" className="mt-6">
              <input type="hidden" name="csvData" value={csvData} />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCsvData("")}
                  className="px-4 py-2 text-accent-600 hover:text-accent-900 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Icons.Check size="sm" />
                  Import Team Members
                </button>
              </div>
            </Form>
          )}
        </div>

        {/* Instructions Section */}
        <div className="space-y-6">
          {/* CSV Format */}
          <div className="bg-white rounded-lg border border-accent-200 p-6">
            <h2 className="text-lg font-medium text-accent-900 mb-4">CSV Format</h2>
            <p className="text-accent-600 mb-4">
              Your CSV file should include these columns (header row required):
            </p>
            <ul className="space-y-2 text-sm text-accent-600">
              <li className="flex items-center gap-2">
                <Icons.Check size="sm" className="text-green-500" />
                <strong>firstname</strong> (required)
              </li>
              <li className="flex items-center gap-2">
                <Icons.Check size="sm" className="text-green-500" />
                <strong>lastname</strong> (required)
              </li>
              <li className="flex items-center gap-2">
                <Icons.Check size="sm" className="text-green-500" />
                <strong>email</strong> (required)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-accent-300"></span>
                <strong>phone</strong> (optional)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-accent-300"></span>
                <strong>title</strong> (optional)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-accent-300"></span>
                <strong>department</strong> (optional)
              </li>
            </ul>
          </div>

          {/* Sample CSV */}
          <div className="bg-white rounded-lg border border-accent-200 p-6">
            <h2 className="text-lg font-medium text-accent-900 mb-4">Sample CSV</h2>
            <div className="bg-accent-50 rounded-lg p-3 mb-4">
              <pre className="text-xs text-accent-600 overflow-x-auto">
{sampleCSV}
              </pre>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sampleCSV);
                alert("Sample CSV copied to clipboard!");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors text-sm"
            >
              <Icons.Download size="sm" />
              Copy Sample
            </button>
          </div>

          {/* Notes */}
          <div className="bg-primary-50 rounded-lg border border-primary-200 p-4">
            <div className="flex items-start gap-3">
              <Icons.Info className="text-primary-600 mt-0.5" size="sm" />
              <div className="text-sm">
                <p className="text-primary-700 font-medium mb-1">Important Notes:</p>
                <ul className="text-primary-600 space-y-1">
                  <li>• All imported team members will be set as "Active" by default</li>
                  <li>• Duplicate email addresses will be skipped</li>
                  <li>• Maximum 100 team members per upload</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}