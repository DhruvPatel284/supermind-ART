import { useState, ChangeEvent, FormEvent } from 'react';
import { BarChart2, Users, Eye, ThumbsUp, MessageCircle, Loader } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

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
    report: string;
    metrics: Record<string, { overall_impact: number }>;
  }[];
  top_parameters: Record<string, number>[];
  sentiment_analysis: {
    positive: number;
    negative: number;
  } | null;
  insights: string[];
} | null;

export default function CompanyAnalysisDashboard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    domain: '',
    description: '',
    ad_objective: ''
  });
  const [analysisData, setAnalysisData] = useState<AnalysisData>(null);
  const [error, setError] = useState<string>('');

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
      const response = await fetch('http://localhost:8000/analyze-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data: AnalysisData = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setError('Failed to analyze videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };
 //@ts-ignore
  const formatSentimentData = (sentiment: AnalysisData['sentiment_analysis']) => {
    if (!sentiment) return [];
    return [
      { name: 'Positive', value: sentiment.positive },
      { name: 'Negative', value: sentiment.negative }
    ];
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

        {/* Results Section */}
        {analysisData && (
          <div className="space-y-8">
            {/* Competitors Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Main Competitors
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysisData.competitors.map((competitor, index) => (
                  <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="font-medium text-blue-900">{competitor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Analysis */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Video Performance Analysis
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {analysisData.video_analysis.map((video, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-lg mb-2">{video.title}</h3>
                    <p className="text-gray-600 whitespace-pre-line">{video.report}</p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(video.metrics).map(([key, value]) => (
                        <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="text-sm text-gray-500">{key}</div>
                          <div className="font-medium">{value.overall_impact.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parameters & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Top Parameters */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  Top Parameters
                </h2>
                <div className="space-y-4">
                  {analysisData.top_parameters.map((param, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      {Object.entries(param).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="font-medium">{key}</span>
                          <span className="text-blue-600">{value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Sentiment Analysis
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatSentimentData(analysisData.sentiment_analysis)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-blue-600" />
                Recommendations
              </h2>
              <ul className="space-y-3">
                {analysisData.insights.map((insight, index) => (
                  <li key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
