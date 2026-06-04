import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './HeightChart.css';

function HeightChart({ data = [] }) {
  const currentHeight = data.length > 0 ? data[data.length - 1].height : 0;

  return (
    <div className="height-chart-container">
      <div className="height-chart-title">📏 กราฟส่วนสูง (เซนติเมตร)</div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(dateStr) => {
                const date = new Date(dateStr);
                return date.toLocaleDateString('th-TH', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                  timeZone: 'Asia/Bangkok'
                });
              }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis domain={[0, 'dataMax + 10']} />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                  timeZone: 'Asia/Bangkok'
                });
              }}
            />
            <Line
              type="monotone"
              dataKey="height"
              stroke="#10b981"
              strokeWidth={1.5}  // 🔽 เส้นบางลง
              dot={false}        // ❌ ไม่แสดงจุด
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="current-height-label">
        ส่วนสูงปัจจุบัน<br />
        <span className="current-height-value">{currentHeight.toFixed(1)} ซม.</span>
      </div>
    </div>
  );
}

export default HeightChart;
