import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Send, BarChart3, Brain, TrendingUp, Heart, Target, Home } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from 'recharts';
import Mitra from '../assets/Mitra Logo.png'
import Navbar from "../components/Navbar"
const AssessmentTestPage = () => {
  const [cards, setCards] = useState([]);
  const [touchedCards, setTouchedCards] = useState({});
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);


  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/v1/assessments');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error('Server returned non-JSON response. Check if the API endpoint is correct.');
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.cards || !Array.isArray(data.cards)) {
        throw new Error('Invalid response format: cards array is missing');
      }
      
      console.log('Cards loaded:', data.cards.length);
      setCards(data.cards);
      setAssessmentTypes(data.assessmentTypes || []);
      
      const initialResponses = {};
      data.cards.forEach(card => {
        initialResponses[card.id] = null;
      });
      setResponses(initialResponses);
      
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async (resultsData) => {
    setLoadingInsights(true);
    try {
      // Prepare normalized scores for backend
      const Scores = {};
      Object.entries(resultsData).forEach(([assessmentType, data]) => {
        Scores[assessmentType] = data.totalScore;
      });

      // Fetch all insights in parallel
      const [
        personalInsightResponse,
        strengthInsightResponse,
        growthInsightResponse,
        recommendationsResponse
      ] = await Promise.all([
        fetch('http://localhost:5000/api/v1/get-personal-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: Scores })
        }),
        fetch('http://localhost:5000/api/v1/get-strength-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: Scores })
        }),
        fetch('http://localhost:5000/api/v1/get-growth-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: Scores })
        }),
        fetch('http://localhost:5000/api/v1/get-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: Scores })
        })
      ]);

      // Process responses
      const insights = {
        mainInsight: null,
        strengthsInsight: null,
        improvementInsight: null,
        recommendations: []
      };

      // Handle personal insight
      if (personalInsightResponse.ok) {
        const personalData = await personalInsightResponse.json();
        insights.mainInsight = personalData.insight;
      } else {
        insights.mainInsight = "Unable to generate personal insight at this time.";
      }

      // Handle strength insight
      if (strengthInsightResponse.ok) {
        const strengthData = await strengthInsightResponse.json();
        insights.strengthsInsight = strengthData.insight;
      } else {
        insights.strengthsInsight = "Unable to generate strength insight at this time.";
      }

      // Handle growth insight
      if (growthInsightResponse.ok) {
        const growthData = await growthInsightResponse.json();
        insights.improvementInsight = growthData.insight;
      } else {
        insights.improvementInsight = "Unable to generate growth insight at this time.";
      }

      // Handle recommendations
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        insights.recommendations = recommendationsData.recommendations || [];
      } else {
        insights.recommendations = ["Unable to generate recommendations at this time."];
      }

      setAiInsights(insights);

    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setAiInsights({
        mainInsight: "Error generating insights. Please try again later.",
        strengthsInsight: "Error generating strength insights. Please try again later.",
        improvementInsight: "Error generating growth insights. Please try again later.",
        recommendations: ["Error generating recommendations. Please try again later."]
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSliderChange = (cardId, value) => {
    const numericValue = parseInt(value, 10);
    console.log(`Slider changed for card ${cardId}: ${numericValue}`);
    
    setResponses(prev => {
      const updated = {
        ...prev,
        [cardId]: numericValue
      };
      console.log('Updated responses:', updated);

      setTouchedCards(prev => ({
        ...prev,
        [cardId]: true
      }));
      return updated;
    });
  };

  const calculateProgress = () => {
    const totalCards = cards.length;
    if (totalCards === 0) return 0;
    
    const respondedCards = Object.keys(responses).filter(cardId => 
      responses[cardId] !== undefined && responses[cardId] !== null
    ).length;
    
    const progress = Math.round((respondedCards / totalCards) * 100);
    console.log(`Progress: ${respondedCards}/${totalCards} = ${progress}%`);
    return progress;
  };

  const isComplete = () => {
    if (cards.length === 0) return false;
    
    const complete = cards.every(card => 
      responses[card.id] !== undefined && responses[card.id] !== null
    );
    
    console.log('Assessment complete:', complete);
    console.log('Cards:', cards.length, 'Responses:', Object.keys(responses).length);
    return complete;
  };

  const submitAssessment = async () => {
    if (!isComplete()) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      console.log('Submitting responses:', responses);
      
      const calculateResponse = await fetch('http://localhost:5000/api/v1/calculate-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responses })
      });

      if (!calculateResponse.ok) {
        throw new Error(`Failed to calculate scores: ${calculateResponse.status}`);
      }

      const calculateData = await calculateResponse.json();
      console.log('Calculation results:', calculateData);
      
      setResults(calculateData.assessmentResults);
      setShowResults(true);

      // Fetch AI insights
      await fetchAIInsights(calculateData.assessmentResults);

      // Submit to backend
      const submitResponse = await fetch('http://localhost:5000/api/v1/submit-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses,
          results: calculateData.assessmentResults,
          completedAt: new Date().toISOString()
        })
      });

      if (!submitResponse.ok) {
        console.warn('Failed to submit to backend, but calculation was successful');
      }

    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('There was an error submitting your assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const createMockData = () => {
    const mockCards = [
      {
        id: 1,
        searchItem: "Beach Vacation",
        scenario: "You wake up and remember you're going to the beach today. How do you feel?",
        assessmentType: "Excitement",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
        minScore: 1,
        maxScore: 7
      },
      {
        id: 2,
        searchItem: "Mountain Hiking",
        scenario: "You see a challenging mountain trail ahead. How motivated are you?",
        assessmentType: "Adventure",
        imageUrl: "https://images.unsplash.com/photo-1464822759844-d150d4e2b2e8?w=400",
        minScore: 0,
        maxScore: 7
      },
      {
        id: 3,
        searchItem: "Art Gallery",
        scenario: "You discover a new art exhibition opening today. How interested are you?",
        assessmentType: "Culture",
        imageUrl: "https://images.unsplash.com/photo-1544967882-6abce0767465?w=400",
        minScore: 0,
        maxScore: 7
      },
      {
        id: 4,
        searchItem: "Team Sports",
        scenario: "Your friends invite you to join a team sport. How do you respond?",
        assessmentType: "Social",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
        minScore: 0,
        maxScore: 7
      },
      {
        id: 5,
        searchItem: "Learning New Skill",
        scenario: "You have the opportunity to learn something completely new. How eager are you?",
        assessmentType: "Growth",
        imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400",
        minScore: 0,
        maxScore: 7
      }
    ];

    setCards(mockCards);
    setAssessmentTypes(["Excitement", "Adventure", "Culture", "Social", "Growth"]);
    
    const initialResponses = {};
    mockCards.forEach(card => {
      initialResponses[card.id] = Math.floor((card.minScore + card.maxScore) / 2);
    });
    setResponses(initialResponses);
    setLoading(false);
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!results) return { barData: [], radarData: [], lineData: [] };
    
    const barData = Object.entries(results).map(([type, data]) => ({
      name: type,
      score: data.normalized ,
      percentage: data.percentage
    }));

    const radarData = Object.entries(results).map(([type, data]) => ({
      subject: type,
      score: data.normalized,
      fullMark: 5
    }));

    const lineData = Object.entries(results).map(([type, data], index) => ({
      category: type,
      score: data.normalized * 100,
      trend: data.normalized * 100 + (Math.random() - 0.5) * 10 // Mock trend data
    }));

    return { barData, radarData, lineData };
  };

  // Smooth navigation with animation
  const handleContinue = () => {
    const currentCardId = cards[currentCard]?.id;
    if (!touchedCards[currentCardId]) {
      alert("Please adjust the slider before continuing.");
      return;
    }

    const progress = calculateProgress();
    setProgress(progress);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentCard(currentCard + 1);
      setIsAnimating(false);
    }, 300);
    
  };

  const handlePrevious = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentCard(currentCard - 1);
      setIsAnimating(false);
    }, 300);
  };

  // Navigate to home
  const goToHome = () => {
    window.location.href = 'http://localhost:3000/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
          {error && (
            <div className="mt-4">
              <p className="text-red-600 mb-2">Error: {error}</p>
              <button
                onClick={createMockData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Use Demo Data
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showResults && results) {
    const { barData, radarData, lineData } = prepareChartData();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header Section */}
          <div className="text-center mb-16 border-b-4 border-gradient-to-r from-blue-500 to-purple-600 pb-8">
            <div className="flex items-center justify-center mb-8">
              <img 
                src={Mitra} 
                alt="Mitra Logo" 
                className="w-32 h-32 rounded-full object-cover shadow-2xl border-4 border-white" 
              />
            </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-6 tracking-tight">
              Your Mental Wellness Profile
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover insights about your emotional patterns and get personalized recommendations for mental strength
            </p>
          </div>

          {/* AI Insights Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 mb-12 border-2 border-gray-200 hover:border-purple-300 transition-all duration-300">
            <div className="flex items-center mb-8 pb-4 border-b-2 border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-6 shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">AI-Powered Insights</h2>
            </div>
            
            {loadingInsights ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-6"></div>
                <p className="text-gray-600 text-lg">Generating personalized insights...</p>
              </div>
            ) : aiInsights ? (
              <div className="space-y-8">
                {/* Overall Assessment */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border-l-6 border-blue-500 shadow-lg">
                  <div className="flex items-center mb-4">
                    <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-2xl font-semibold text-gray-800">Overall Assessment</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg">{aiInsights.mainInsight}</p>
                </div>

                {/* Strengths and Growth in Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-l-6 border-green-500 shadow-lg">
                    <div className="flex items-center mb-4">
                      <Heart className="w-6 h-6 text-green-600 mr-3" />
                      <h3 className="text-2xl font-semibold text-gray-800">Your Strengths</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">{aiInsights.strengthsInsight}</p>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-8 border-l-6 border-orange-500 shadow-lg">
                    <div className="flex items-center mb-4">
                      <Target className="w-6 h-6 text-orange-600 mr-3" />
                      <h3 className="text-2xl font-semibold text-gray-800">Growth Opportunities</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">{aiInsights.improvementInsight}</p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-8 border-l-6 border-purple-500 shadow-lg">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-6">Personalized Recommendations</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {aiInsights.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start bg-white rounded-xl p-4 shadow-md border border-purple-100">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <p className="text-gray-700 text-base leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-lg">Unable to generate insights at this time.</p>
            )}
          </div>

          {/* Charts Section - Enhanced */}
          <div className="grid lg:grid-cols-2 gap-10 mb-12">
            {/* Bar Chart */}
            <div className="w-1/2 bg-white rounded-3xl shadow-2xl p-10 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300">
              <div className="flex items-center mb-8 pb-4 border-b-2 border-gray-100">
                <BarChart3 className="w-8 h-8 text-blue-600 mr-4" />
                <h3 className="text-2xl font-bold text-gray-800">Score Overview</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#f8fafc',
                        border: '2px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="score" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="w-1/2 bg-white rounded-3xl shadow-2xl p-10 border-2 border-gray-200 hover:border-purple-300 transition-all duration-300">
              <div className="flex items-center mb-8 pb-4 border-b-2 border-gray-100">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">R</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Wellness Radar</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.3}
                      strokeWidth={3}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Results - Enhanced */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 mb-12 border-2 border-gray-200">
            <div className="text-center mb-12 pb-6 border-b-2 border-gray-100">
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Detailed Results</h3>
              <p className="text-gray-600 text-lg">Comprehensive breakdown of your assessment scores</p>
            </div>
            
            <div className="grid-cols-1 md:grid-cols-2">
              {Object.entries(results).map(([assessmentType, data]) => (
                <div key={assessmentType} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-300">
                  <div className="text-center mb-6">
                    <h4 className="text-2xl font-bold text-gray-800 mb-2">{assessmentType}</h4>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      <span className="text-gray-600 font-medium">Score:</span>
                      <span className="font-bold text-blue-600 text-xl">
                        {data.totalScore} / {data.maxPossibleScore}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      <span className="text-gray-600 font-medium">Percentage:</span>
                      <span className="font-bold text-purple-600 text-xl">{data.percentage}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      <span className="text-gray-600 font-medium">Questions:</span>
                      <span className="font-semibold text-gray-800 text-lg">{data.questionCount}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      <span className="text-gray-600 font-medium">Average:</span>
                      <span className="font-semibold text-green-600 text-lg">{data.averageScore}</span>
                    </div>
                    
                    {/* Enhanced Progress bar */}
                    <div className="mt-6">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{data.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-700 shadow-sm"
                          style={{ width: `${data.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons - Enhanced */}
          <div className="text-center border-t-4 border-gradient-to-r from-blue-500 to-purple-600 pt-12">
            <div className="flex gap-6 justify-center flex-wrap">
              <button
                onClick={goToHome}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-10 py-4 rounded-2xl font-semibold text-xl transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center transform hover:scale-105 border-2 border-green-400"
              >
                <Home className="w-6 h-6 mr-3" />
                Return Home
              </button>
              <button
                onClick={() => {
                  setShowResults(false);
                  setResults(null);
                  setAiInsights(null);
                  setCurrentCard(0);
                  const initialResponses = {};
                  cards.forEach(card => {
                    initialResponses[card.id] = Math.floor((card.minScore + card.maxScore) / 2);
                  });
                  setResponses(initialResponses);
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-2xl font-semibold text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 border-2 border-blue-400"
              >
                Take New Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No assessment cards available</p>
          <button
            onClick={createMockData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Load Demo Data
          </button>
        </div>
      </div>
    );
  }

  const currentCardData = cards[currentCard];
  // const progress = calculateProgress();
  const currentResponse = responses[currentCardData.id];
  const complete = isComplete();

  return (
    
    <>
    <Navbar/>
    <div className="min-h-screen bg-gray-100 py-4">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Card {currentCard + 1} of {cards.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {progress}% complete
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-teal-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Card with Animation */}
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden relative transition-all duration-300 transform ${isAnimating ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
          {/* Card Number Badge */}
          <div className="absolute top-4 right-4 z-10">
            <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm font-medium">
              {currentCard + 1} of {cards.length}
            </span>
          </div>

          {/* Image Container - Reduced height */}
          <div className="relative h-48 bg-gray-900 overflow-hidden">
            {currentCardData.imageUrl ? (
              <img
                src={currentCardData.imageUrl}
                alt={currentCardData.searchItem}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            {/* Fallback for missing image */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center"
              style={{ display: currentCardData.imageUrl ? 'none' : 'flex' }}
            >
              <div className="text-white text-center">
                <div className="text-4xl mb-2">🖼️</div>
                <p>Image not available</p>
              </div>
            </div>

            {/* Overlay with text */}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-4">
              <h1 className="text-white text-2xl font-bold mb-2">
                {currentCardData.searchItem}
              </h1>
            </div>
          </div>

          {/* Card Content - Reduced padding */}
          <div className="p-5">
            {/* Question */}
            <div className="mb-5">
              <h2 className="text-lg font-medium text-gray-800 mb-2">
                {currentCardData.scenario}
              </h2>
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {currentCardData.assessmentType}
              </span>
            </div>

            {/* Slider Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-teal-600">
                  Stay in bed
                </span>
                <span className="text-sm font-medium text-blue-600">
                  Jump up excited
                </span>
              </div>

              {/* Current Value Display */}
              <div className="text-center mb-2">
                <span className="text-lg font-semibold text-gray-700">
                  Current: {currentResponse}
                </span>
              </div>

              {/* Slider */}
              <div className="relative">
                <input
                  type="range"
                  min={currentCardData.minScore}
                  max={currentCardData.maxScore}
                  value={currentResponse ?? Math.floor((currentCardData.minScore + currentCardData.maxScore) / 2)}
                  onChange={(e) => handleSliderChange(currentCardData.id, e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: (() => {
                      const safeValue = currentResponse ?? Math.floor((currentCardData.minScore + currentCardData.maxScore) / 2);
                      const percent = ((safeValue - currentCardData.minScore) / (currentCardData.maxScore - currentCardData.minScore)) * 100;
                      return `linear-gradient(to right, #1f2937 0%, #1f2937 ${percent}%, #e5e7eb ${percent}%, #e5e7eb 100%)`;
                    })()
                  }}
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  {Array.from({ length: currentCardData.maxScore - currentCardData.minScore + 1 }, (_, i) => (
                    <span key={i}>{currentCardData.minScore + i}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-center">
              {currentCard === cards.length - 1 ? (
                <button
                  onClick={submitAssessment}
                  disabled={!complete || submitting}
                  className="bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Assessment'}
                </button>
              ) : (
                <button
                  onClick={handleContinue}
                  disabled={isAnimating}
                  className="bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        {currentCard > 0 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handlePrevious}
              disabled={isAnimating}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
          </div>
        )}

        
      </div>

      {/* Custom CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #1f2937;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #1f2937;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
    </>
  );
};

export default AssessmentTestPage;