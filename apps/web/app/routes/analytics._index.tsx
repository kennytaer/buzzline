import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { requireAuthWithOrg } from "~/utils/auth.server";
import { Navigation } from "~/components/Navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const meta: MetaFunction = () => {
  return [
    { title: "Analytics - BuzzLine" },
    { name: "description", content: "Track your campaign performance and engagement metrics" },
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  await requireAuthWithOrg(args);
  
  // Hardcoded analytics data for now
  const analyticsData = {
    overview: {
      totalContacts: 12547,
      totalCampaigns: 38,
      totalSent: 45623,
      avgOpenRate: 24.3,
      avgClickRate: 4.7,
      avgBounceRate: 2.1
    },
    timeSeriesData: {
      "7": {
        sent: [820, 1240, 980, 1450, 1120, 890, 1670],
        opens: [198, 301, 245, 352, 271, 216, 405],
        clicks: [47, 71, 58, 83, 64, 51, 96],
        bounces: [16, 25, 19, 29, 22, 18, 33],
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      },
      "30": {
        sent: Array.from({length: 30}, (_, i) => 800 + Math.floor(Math.random() * 600) + Math.sin(i * 0.2) * 200),
        opens: Array.from({length: 30}, (_, i) => 180 + Math.floor(Math.random() * 150) + Math.sin(i * 0.2) * 50),
        clicks: Array.from({length: 30}, (_, i) => 35 + Math.floor(Math.random() * 40) + Math.sin(i * 0.2) * 15),
        bounces: Array.from({length: 30}, (_, i) => 8 + Math.floor(Math.random() * 15) + Math.sin(i * 0.2) * 5),
        labels: Array.from({length: 30}, (_, i) => `${i + 1}`)
      },
      "60": {
        sent: Array.from({length: 60}, (_, i) => 750 + Math.floor(Math.random() * 700) + Math.sin(i * 0.15) * 250),
        opens: Array.from({length: 60}, (_, i) => 170 + Math.floor(Math.random() * 180) + Math.sin(i * 0.15) * 60),
        clicks: Array.from({length: 60}, (_, i) => 30 + Math.floor(Math.random() * 50) + Math.sin(i * 0.15) * 20),
        bounces: Array.from({length: 60}, (_, i) => 5 + Math.floor(Math.random() * 20) + Math.sin(i * 0.15) * 8),
        labels: Array.from({length: 60}, (_, i) => `${i + 1}`)
      },
      "90": {
        sent: Array.from({length: 90}, (_, i) => 700 + Math.floor(Math.random() * 800) + Math.sin(i * 0.1) * 300),
        opens: Array.from({length: 90}, (_, i) => 150 + Math.floor(Math.random() * 200) + Math.sin(i * 0.1) * 70),
        clicks: Array.from({length: 90}, (_, i) => 25 + Math.floor(Math.random() * 60) + Math.sin(i * 0.1) * 25),
        bounces: Array.from({length: 90}, (_, i) => 3 + Math.floor(Math.random() * 25) + Math.sin(i * 0.1) * 10),
        labels: Array.from({length: 90}, (_, i) => `${i + 1}`)
      }
    },
    campaignStats: [
      { name: "Spring Product Launch", sent: 2847, opens: 692, clicks: 164, bounces: 57, openRate: 24.3, clickRate: 5.8, status: "completed" },
      { name: "Weekly Newsletter #42", sent: 1923, opens: 461, clicks: 89, bounces: 38, openRate: 24.0, clickRate: 4.6, status: "completed" },
      { name: "Customer Survey 2024", sent: 3456, opens: 864, clicks: 197, bounces: 69, openRate: 25.0, clickRate: 5.7, status: "completed" },
      { name: "Black Friday Preview", sent: 4821, opens: 1205, clicks: 289, bounces: 96, openRate: 25.0, clickRate: 6.0, status: "completed" },
      { name: "Holiday Special Offer", sent: 3892, opens: 934, clicks: 178, bounces: 78, openRate: 24.0, clickRate: 4.6, status: "sending" }
    ],
    channelBreakdown: {
      email: { sent: 32840, success: 31456, bounces: 689, unsubscribes: 234 },
      sms: { sent: 12783, success: 12621, bounces: 89, unsubscribes: 73 }
    }
  };

  return json({ analyticsData });
}

export default function AnalyticsIndex() {
  const { analyticsData } = useLoaderData<typeof loader>();
  const [timeFrame, setTimeFrame] = useState("7");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#313131]">Analytics</h1>
              <p className="text-gray-600 mt-1">Track your campaign performance and engagement metrics</p>
            </div>
            <div>
              <select 
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
            {/* Total Contacts */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold text-[#313131] mt-1">{analyticsData.overview.totalContacts.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-[#ED58A0]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#ED58A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Campaigns */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Campaigns</p>
                  <p className="text-2xl font-bold text-[#313131] mt-1">{analyticsData.overview.totalCampaigns}</p>
                </div>
                <div className="w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#5EC0DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Sent */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                  <p className="text-2xl font-bold text-[#313131] mt-1">{analyticsData.overview.totalSent.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#5EC0DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Average Open Rate */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Open Rate</p>
                  <p className="text-2xl font-bold text-[#313131] mt-1">{analyticsData.overview.avgOpenRate}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Average Click Rate */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Click Rate</p>
                  <p className="text-2xl font-bold text-[#313131] mt-1">{analyticsData.overview.avgClickRate}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Average Bounce Rate */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Bounce Rate</p>
                  <p className="text-2xl font-bold text-[#313131] mt-1">{analyticsData.overview.avgBounceRate}%</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Performance Over Time Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-[#313131]">Performance Over Time</h2>
                <p className="text-sm text-gray-600 mt-1">Messages sent, opens, and clicks</p>
              </div>
              <div className="p-6">
                <PerformanceChart data={analyticsData.timeSeriesData[timeFrame as keyof typeof analyticsData.timeSeriesData]} />
              </div>
            </div>

            {/* Channel Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-[#313131]">Channel Performance</h2>
                <p className="text-sm text-gray-600 mt-1">Email vs SMS delivery</p>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Email */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#313131]">Email</span>
                      <span className="text-sm text-gray-600">{analyticsData.channelBreakdown.email.sent.toLocaleString()} sent</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#5EC0DA] h-2 rounded-full" 
                        style={{ width: `${(analyticsData.channelBreakdown.email.success / analyticsData.channelBreakdown.email.sent) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Success: {analyticsData.channelBreakdown.email.success.toLocaleString()}</span>
                      <span>Bounces: {analyticsData.channelBreakdown.email.bounces}</span>
                      <span>Unsubs: {analyticsData.channelBreakdown.email.unsubscribes}</span>
                    </div>
                  </div>

                  {/* SMS */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#313131]">SMS</span>
                      <span className="text-sm text-gray-600">{analyticsData.channelBreakdown.sms.sent.toLocaleString()} sent</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#ED58A0] h-2 rounded-full" 
                        style={{ width: `${(analyticsData.channelBreakdown.sms.success / analyticsData.channelBreakdown.sms.sent) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Success: {analyticsData.channelBreakdown.sms.success.toLocaleString()}</span>
                      <span>Bounces: {analyticsData.channelBreakdown.sms.bounces}</span>
                      <span>Unsubs: {analyticsData.channelBreakdown.sms.unsubscribes}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Performance Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#313131]">Recent Campaign Performance</h2>
              <p className="text-sm text-gray-600 mt-1">Detailed metrics for your latest campaigns</p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Campaign</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Sent</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Opens</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Clicks</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Open Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Click Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {analyticsData.campaignStats.map((campaign, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#ED58A0]/10 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-[#ED58A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-[#313131] text-sm">{campaign.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{campaign.sent.toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{campaign.opens.toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{campaign.clicks.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            {campaign.openRate}%
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {campaign.clickRate}%
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'sending' ? 'bg-[#5EC0DA]/10 text-[#5EC0DA]' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chart.js Performance Chart Component
function PerformanceChart({ data }: { data: any }) {
  const chartData = {
    labels: data.labels.length <= 7 ? data.labels : data.labels.map((label: string, i: number) => {
      if (data.labels.length <= 30) {
        return i % 5 === 0 ? `Day ${label}` : '';
      }
      return i % Math.ceil(data.labels.length / 8) === 0 ? `Day ${label}` : '';
    }),
    datasets: [
      {
        label: 'Messages Sent',
        data: data.sent,
        borderColor: '#5EC0DA',
        backgroundColor: 'rgba(94, 192, 218, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#5EC0DA',
        pointBorderColor: '#5EC0DA',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Opens',
        data: data.opens,
        borderColor: '#ED58A0',
        backgroundColor: 'rgba(237, 88, 160, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#ED58A0',
        pointBorderColor: '#ED58A0',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Clicks',
        data: data.clicks,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#10B981',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Bounces',
        data: data.bounces,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#EF4444',
        pointBorderColor: '#EF4444',
        pointRadius: 3,
        pointHoverRadius: 5,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
          color: '#6B7280',
        }
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          maxTicksLimit: 8,
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    }
  };

  return (
    <div style={{ height: '350px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}