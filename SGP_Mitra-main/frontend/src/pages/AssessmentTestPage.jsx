import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Send, BarChart3 } from 'lucide-react';

const AssessmentTestPage = () => {
  const [cards, setCards] = useState([]);
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);

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
      
      // Check if response is JSON
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
      
      // Initialize responses with default values for all cards
      const initialResponses = {};
      data.cards.forEach(card => {
        const defaultValue = Math.floor((card.minScore + card.maxScore) / 2);
        initialResponses[card.id] = defaultValue;
      });
      setResponses(initialResponses);
      
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setError(error.message);
    } finally {
      setLoading(false);
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
      return updated;
    });
  };

  const calculateProgress = () => {
    const totalCards = cards.length;
    if (totalCards === 0) return 0;
    
    // Count cards that have responses (all cards should have responses after initialization)
    const respondedCards = Object.keys(responses).filter(cardId => 
      responses[cardId] !== undefined && responses[cardId] !== null
    ).length;
    
    const progress = Math.round((respondedCards / totalCards) * 100);
    console.log(`Progress: ${respondedCards}/${totalCards} = ${progress}%`);
    return progress;
  };

  const isComplete = () => {
    if (cards.length === 0) return false;
    
    // Check if all cards have responses
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

  // Mock data for development/testing
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
        minScore: 1,
        maxScore: 7
      },
      {
        id: 3,
        searchItem: "Art Gallery",
        scenario: "You discover a new art exhibition opening today. How interested are you?",
        assessmentType: "Culture",
        imageUrl: "https://images.unsplash.com/photo-1544967882-6abce0767465?w=400",
        minScore: 1,
        maxScore: 7
      }
    ];

    setCards(mockCards);
    setAssessmentTypes(["Excitement", "Adventure", "Culture"]);
    
    // Initialize responses
    const initialResponses = {};
    mockCards.forEach(card => {
      initialResponses[card.id] = Math.floor((card.minScore + card.maxScore) / 2);
    });
    setResponses(initialResponses);
    setLoading(false);
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
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Assessment Complete</h1>
              <p className="text-gray-600">Thank you for completing the assessment</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(results).map(([assessmentType, data]) => (
                <div key={assessmentType} className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{assessmentType}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Score:</span>
                      <span className="font-semibold text-blue-600">
                        {data.totalScore} / {data.maxPossibleScore}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-semibold">{data.questionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average:</span>
                      <span className="font-semibold text-green-600">{data.averageScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Percentage:</span>
                      <span className="font-semibold text-purple-600">{data.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setShowResults(false);
                  setResults(null);
                  setCurrentCard(0);
                  // Reinitialize responses
                  const initialResponses = {};
                  cards.forEach(card => {
                    initialResponses[card.id] = Math.floor((card.minScore + card.maxScore) / 2);
                  });
                  setResponses(initialResponses);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Start New Assessment
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
  const progress = calculateProgress();
  const currentResponse = responses[currentCardData.id];
  const complete = isComplete();

  return (
    <div className="min-h-screen bg-gray-100 py-8">
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

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden relative">
          {/* Card Number Badge */}
          <div className="absolute top-4 right-4 z-10">
            <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm font-medium">
              {currentCard + 1} of {cards.length}
            </span>
          </div>

          {/* Image Container */}
          <div className="relative h-80 bg-gray-900 overflow-hidden">
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
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6">
              <h1 className="text-white text-3xl font-bold mb-2">
                {currentCardData.searchItem}
              </h1>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6">
            {/* Question */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-2">
                {currentCardData.scenario}
              </h2>
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {currentCardData.assessmentType}
              </span>
            </div>

            {/* Slider Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
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
                  value={currentResponse || Math.floor((currentCardData.minScore + currentCardData.maxScore) / 2)}
                  onChange={(e) => handleSliderChange(currentCardData.id, e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #1f2937 0%, #1f2937 ${((currentResponse || Math.floor((currentCardData.minScore + currentCardData.maxScore) / 2)) - currentCardData.minScore) / (currentCardData.maxScore - currentCardData.minScore) * 100}%, #e5e7eb ${((currentResponse || Math.floor((currentCardData.minScore + currentCardData.maxScore) / 2)) - currentCardData.minScore) / (currentCardData.maxScore - currentCardData.minScore) * 100}%, #e5e7eb 100%)`
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
                  onClick={() => setCurrentCard(currentCard + 1)}
                  className="bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200"
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
              onClick={() => setCurrentCard(currentCard - 1)}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
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
  );
};

export default AssessmentTestPage;