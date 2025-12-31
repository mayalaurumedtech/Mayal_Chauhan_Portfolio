import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ChartConfig {
    type: 'area' | 'bar' | 'line' | 'pie';
    title?: string;
    description?: string;
    data: any[];
    dataKeys: { key: string; color: string; name?: string }[];
    xAxisKey?: string;
    height?: number;
}

export const BlogChart = ({ config }: { config: ChartConfig }) => {
    const { type, title, description, data, dataKeys, xAxisKey = 'name', height = 400 } = config;

    const renderChart = () => {
        switch (type) {
            case 'area':
                return (
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            {dataKeys.map((dk, i) => (
                                <linearGradient key={dk.key} id={`color${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={dk.color} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <XAxis dataKey={xAxisKey} />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend />
                        {dataKeys.map((dk, i) => (
                            <Area
                                key={dk.key}
                                type="monotone"
                                dataKey={dk.key}
                                stroke={dk.color}
                                fillOpacity={1}
                                fill={`url(#color${i})`}
                                name={dk.name || dk.key}
                            />
                        ))}
                    </AreaChart>
                );
            case 'bar':
                return (
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey={xAxisKey} />
                        <YAxis />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend />
                        {dataKeys.map((dk) => (
                            <Bar
                                key={dk.key}
                                dataKey={dk.key}
                                fill={dk.color}
                                radius={[4, 4, 0, 0]}
                                name={dk.name || dk.key}
                            />
                        ))}
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey={xAxisKey} />
                        <YAxis />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend />
                        {dataKeys.map((dk) => (
                            <Line
                                key={dk.key}
                                type="monotone"
                                dataKey={dk.key}
                                stroke={dk.color}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 8 }}
                                name={dk.name || dk.key}
                            />
                        ))}
                    </LineChart>
                );
            case 'pie':
                const COLORS = dataKeys.map(dk => dk.color);
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey={dataKeys[0].key} // For pie, we usually take one value key
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                );
            default:
                return <div>Unsupported chart type</div>;
        }
    };

    return (
        <Card className="my-8 shadow-md border-muted">
            <CardHeader>
                {title && <CardTitle>{title}</CardTitle>}
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div style={{ width: '100%', height }}>
                    <ResponsiveContainer>
                        {renderChart()}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
