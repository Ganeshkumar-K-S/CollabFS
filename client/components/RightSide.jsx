import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const RightSide = () => {
  const collabData = [
    { stage: 'Signed Up', count: 500 },
    { stage: 'Uploaded File', count: 400 },
    { stage: 'Started Chat', count: 300 },
    { stage: 'Shared File', count: 150 },
    { stage: 'Collaborated', count: 75 },
  ];

  return (
    <div className="lg:col-span-1 order-3 lg:order-3">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Track how users engage in your workspace.
          </h3>
          <h2 className="text-lg font-semibold text-gray-900">
            Collaboration Funnel
          </h2>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={collabData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis
                dataKey="stage"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <Bar
                dataKey="count"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Signed up → Uploaded File → Started Chat → Shared File → Collaborated
        </div>
      </div>
    </div>
  );
};

export default RightSide;
