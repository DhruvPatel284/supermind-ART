import  { useState, ChangeEvent, FormEvent } from 'react';
import {  Users, Eye, ThumbsUp, MessageCircle, TrendingUp, Loader } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import axios from 'axios';

type FormData = {
  name: string;
  domain: string;
  description: string;
  ad_objective: string;
};

type AnalysisData = {
  competitors: string[];
  video_analysis: {
    title: string;
    metrics: Record<string, { overall_impact: number; parameter_score: number }>;
  }[];
  top_parameters: [string, number][];
  top_impact_metrics: [string, { overall_impact: number }][];
  sentiment_analysis: {
    positive: number;
    negative: number;
  };
  insights: string[];
} | null;
export default function CompanyAnalysisDashboard() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    domain: '',
    description: '',
    ad_objective: ''
  });
  const [analysisData, setAnalysisData] = useState<AnalysisData>(null);
  const [error, setError] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post("https://supermind-art.onrender.com/analyze",formData);

      if (response.status != 200) {
        throw new Error('Analysis failed');
      }

      const data = await response.data
      setAnalysisData(data);
    } catch (err) {
      setError('Failed to analyze videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const colors = {
    positive: '#22c55e',
    negative: '#ef4444',
    primary: '#2563eb'
  };

  const renderAnalysisDashboard = () => {
    if (!analysisData) return null;

    const sentimentData = [
      { name: 'Positive', value: analysisData.sentiment_analysis.positive },
      { name: 'Negative', value: analysisData.sentiment_analysis.negative }
    ];

    const metricsData = analysisData.top_parameters?.map(([name, score]) => ({
      name,
      score,
      //@ts-ignore
      impact: analysisData.top_impact_metrics?.find(([metricName]) => metricName === name)?.[1]?.overall_impact * 100 || 0
    }));

    return (
      <div className="space-y-6 mt-8">
        {/* Competitors Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="text-blue-600" />
            Main Competitors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysisData.competitors.map((competitor, index) => (
              <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <span className="font-medium text-blue-900">{competitor}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sentiment Analysis */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="text-blue-600" />
              Sentiment Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                 
                  <Tooltip formatter={(value:any) => `${value.toFixed(2)}%`} />
                  <Bar dataKey="value" fill={colors.primary}>
                    {sentimentData.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={entry.name === 'Positive' ? colors.positive : colors.negative}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metrics Impact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-600" />
              Metrics Impact Analysis
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis yAxisId="left" orientation="left" stroke={colors.primary} />
                  <YAxis yAxisId="right" orientation="right" stroke={colors.positive} />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="score" 
                    stroke={colors.primary} 
                    strokeWidth={2}
                    name="Parameter Score"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="impact" 
                    stroke={colors.positive} 
                    strokeWidth={2}
                    name="Impact %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Video Analysis */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="text-blue-600" />
              Video Analysis
            </h2>
            <div className="space-y-6">
              {analysisData.video_analysis.map((video, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">{video.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(video.metrics).map(([key, value], i) => (
                      <div key={i} className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">{key}</p>
                        <p className="font-medium">Score: {value.parameter_score.toFixed(1)}</p>
                        <p className="text-sm text-gray-500">
                          Impact: {(value.overall_impact * 100).toFixed(2)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ThumbsUp className="text-blue-600" />
              Key Insights
            </h2>
            <div className="space-y-3">
              {analysisData.insights.map((insight, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Video Campaign Analyzer</h1>
          <p className="mt-2 text-gray-600">Analyze your company's video campaign performance</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Company Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Campaign Objective
                </label>
                <textarea
                  name="ad_objective"
                  value={formData.ad_objective}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Start Analysis'
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Analysis Dashboard */}
        {renderAnalysisDashboard()}
      </div>
    </div>
  );
}