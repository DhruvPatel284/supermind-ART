from flask import Flask, request, jsonify
from typing import List, Dict
import asyncio
from flask_cors import CORS
import json

# Import your existing analyzer classes
from analyzer import (
    VideoParameterAnalyzer,
    CompanyInfo,
    CompetitorAnalyzer,
    YouTubeAnalyzer
)

app = Flask(__name__)

# Enable CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "https://supermind-art.vercel.app"],  # Remove trailing slash
        "methods": ["GET", "POST", "OPTIONS"],  # Explicitly specify methods
        "allow_headers": ["Content-Type", "Authorization"],  # Specify required headers
        "supports_credentials": True,  # Enable if you're using credentials
        "max_age": 3600  # Cache preflight requests for 1 hour
    }
})

class VideoAnalysisResponse:
    def __init__(
        self,
        competitors: List[str],
        video_analysis: List[Dict],
        top_parameters: List[tuple],
        top_impact_metrics: List[tuple],
        insights: List[str],
        sentiment_analysis: Dict[str, float],
        transcript_length: int
    ):
        self.competitors = competitors
        self.video_analysis = video_analysis
        self.top_parameters = top_parameters
        self.top_impact_metrics = top_impact_metrics
        self.insights = insights
        self.sentiment_analysis = sentiment_analysis
        self.transcript_length = transcript_length

    def to_dict(self):
        return {
            "competitors": self.competitors,
            "video_analysis": self.video_analysis,
            "top_parameters": self.top_parameters,
            "top_impact_metrics": self.top_impact_metrics,
            "insights": self.insights,
            "sentiment_analysis": self.sentiment_analysis,
            "transcript_length": self.transcript_length
        }

@app.route("/analyze", methods=["POST"])
def analyze_videos():
    try:
        # Get request data
        company_data = request.get_json()
        
        # Validate required fields
        required_fields = ["name", "domain", "description", "ad_objective"]
        if not all(field in company_data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Initialize analyzers
        competitor_analyzer = CompetitorAnalyzer()
        youtube_analyzer = YouTubeAnalyzer()
        video_analyzer = VideoParameterAnalyzer()
        
        # Create company info instance
        company_info = CompanyInfo(
            name=company_data["name"],
            domain=company_data["domain"],
            description=company_data["description"],
            ad_objective=company_data["ad_objective"]
        )
        
        # Get competitors
        competitors = competitor_analyzer.get_competitors(company_info)
        
        # Search for videos
        videos_found = youtube_analyzer.search_videos(company_info.name, company_info.ad_objective)
        
        # Initialize collection variables
        transcript_text = ""
        parameters_list = []
        ratings_dict = {}
        impact_metrics_dict = {}
        insights_list = []
        all_comments = []
        video_analysis_results = []
        
        # Analyze each video
        for video in videos_found:
            video_details = youtube_analyzer.get_video_details(video['id'])
            if not video_details:
                continue
                
            # Get transcript
            video_transcript = youtube_analyzer.get_video_transcript(video['id'])
            transcript_text += video_transcript
            
            # Get parameters and analysis
            parameters = video_analyzer.get_analysis_parameters(
                company_info.domain,
                company_info.ad_objective
            )
            parameters_list.append(parameters)
            
            # Get ratings
            current_ratings = video_analyzer.analyze_video_parameters(
                video_details,
                parameters
            )
            ratings_dict.update(current_ratings)
            
            # Calculate impact metrics
            current_impact_metrics = video_analyzer.calculate_impact_metrics(
                video_details,
                current_ratings
            )
            impact_metrics_dict.update(current_impact_metrics)
            
            # Generate report and insights
            report = video_analyzer.generate_analysis_report(
                video_details,
                current_impact_metrics
            )
            current_insights = youtube_analyzer.generate_insights(report)
            insights_list.extend(current_insights)
            
            # Get comments
            comments = youtube_analyzer.fetch_youtube_comments(video['id'])
            all_comments.extend(comments)
            
            # Store video-specific results
            video_analysis_results.append({
                "video_id": video['id'],
                "title": video_details['title'],
                "metrics": current_impact_metrics,
                "insights": current_insights
            })
        
        # Get top parameters and impact metrics
        top_5_params = sorted(ratings_dict.items(), key=lambda x: x[1], reverse=True)[:5]
        top_5_impact_metrics = sorted(
            impact_metrics_dict.items(), 
            key=lambda x: x[1]['overall_impact'], 
            reverse=True
        )[:5]
        
        # Analyze sentiment
        sentiment_results = asyncio.run(video_analyzer.analyze_sentiment(all_comments))
        
        # Create response object
        response = VideoAnalysisResponse(
            competitors=competitors,
            video_analysis=video_analysis_results,
            top_parameters=top_5_params,
            top_impact_metrics=top_5_impact_metrics,
            insights=insights_list,
            sentiment_analysis=sentiment_results,
            transcript_length=len(transcript_text)
        )
        
        return jsonify(response.to_dict())
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    app.run(debug=True)