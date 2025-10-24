import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Brain, TrendingUp, TrendingDown, Target, Home, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router-dom';

const testConfigs = {
  "WHO-5": {
    name: "WHO-5 Well-Being Index",
    role: "General Well-Being Screener",
    description: "The WHO-5 is a concise global measure of psychological well-being. It evaluates mood, vitality, and overall satisfaction with life.",
    questions: [
      "I have felt cheerful and in good spirits",
      "I have felt calm and relaxed",
      "I have felt active and vigorous",
      "I woke up feeling fresh and rested",
      "My daily life has been filled with things that interest me"
    ],
    minScore: 0,
    maxScore: 5,
    scorePhrases: {
      0: "At no time",
      1: "Some of the time",
      2: "Less than half the time",
      3: "More than half the time",
      4: "Most of the time",
      5: "All of the time"
    },
    calculateScore: (responses) => {
      const total = responses.reduce((sum, val) => sum + val, 0);
      const rawScore = total * 4;
      return {
        raw: total,
        percentage: rawScore,
        interpretation: rawScore < 50 ? "Poor well-being" : rawScore < 70 ? "Moderate well-being" : "Good well-being"
      };
    }
  },
  "IES-R": {
    name: "Impact of Event Scale - Revised (IES-R)",
    role: "Trauma and Stress Response Evaluator",
    description: "The IES-R assesses the psychological impact of traumatic experiences through intrusion, avoidance, and hyperarousal symptoms.",
    questions: [
      "Any reminder brought back feelings about it",
      "I had trouble staying asleep",
      "Other things kept making me think about it",
      "I felt irritable and angry",
      "I avoided letting myself get upset when I thought about it",
      "I thought about it when I didn't mean to",
      "I felt as if it hadn't happened or wasn't real",
      "I stayed away from reminders about it",
      "Pictures about it popped into my mind",
      "I was jumpy and easily startled",
      "I tried not to think about it",
      "I was aware that I still had a lot of feelings about it",
      "My feelings about it were kind of numb",
      "I found myself acting or feeling like I was back at that time",
      "I had trouble falling asleep",
      "I had waves of strong feelings about it",
      "I tried to remove it from my memory",
      "I had trouble concentrating",
      "Reminders of it caused me to have physical reactions",
      "I had dreams about it",
      "I felt watchful and on-guard",
      "I tried not to talk about it"
    ],
    minScore: 0,
    maxScore: 4,
    scorePhrases: {
      0: "Not at all",
      1: "A little bit",
      2: "Moderately",
      3: "Quite a bit",
      4: "Extremely"
    },
    calculateScore: (responses) => {
      const total = responses.reduce((sum, val) => sum + val, 0);
      const intrusion = responses.slice(0, 8).reduce((sum, val) => sum + val, 0);
      const avoidance = responses.slice(8, 16).reduce((sum, val) => sum + val, 0);
      const hyperarousal = responses.slice(16).reduce((sum, val) => sum + val, 0);
      
      return {
        raw: total,
        subscales: { intrusion, avoidance, hyperarousal },
        interpretation: total < 24 ? "Low impact" : total < 37 ? "Moderate impact" : "High impact - consider professional support"
      };
    }
  },
  "DASS-21": {
    name: "DASS-21",
    role: "Emotional State Profiler",
    description: "The DASS-21 quantifies negative emotional states across depression, anxiety, and stress domains.",
    questions: [
      "I found it hard to wind down",
      "I was aware of dryness of my mouth",
      "I couldn't seem to experience any positive feeling at all",
      "I experienced breathing difficulty",
      "I found it difficult to work up the initiative to do things",
      "I tended to over-react to situations",
      "I experienced trembling (e.g., in the hands)",
      "I felt that I was using a lot of nervous energy",
      "I was worried about situations in which I might panic",
      "I felt that I had nothing to look forward to",
      "I found myself getting agitated",
      "I found it difficult to relax",
      "I felt down-hearted and blue",
      "I was intolerant of anything that kept me from getting on with what I was doing",
      "I felt I was close to panic",
      "I was unable to become enthusiastic about anything",
      "I felt I wasn't worth much as a person",
      "I felt that I was rather touchy",
      "I was aware of the action of my heart in the absence of physical exertion",
      "I felt scared without any good reason",
      "I felt that life was meaningless"
    ],
    minScore: 0,
    maxScore: 3,
    scorePhrases: {
      0: "Did not apply to me at all",
      1: "Applied to me to some degree",
      2: "Applied to me considerably",
      3: "Applied to me very much"
    },
    calculateScore: (responses) => {
      const depression = responses.filter((_, i) => [2, 4, 9, 12, 15, 16, 20].includes(i)).reduce((sum, val) => sum + val, 0) * 2;
      const anxiety = responses.filter((_, i) => [1, 3, 6, 8, 14, 18, 19].includes(i)).reduce((sum, val) => sum + val, 0) * 2;
      const stress = responses.filter((_, i) => [0, 5, 7, 10, 11, 13, 17].includes(i)).reduce((sum, val) => sum + val, 0) * 2;
      
      return {
        raw: depression + anxiety + stress,
        subscales: { depression, anxiety, stress },
        interpretation: {
          depression: depression < 10 ? "Normal" : depression < 14 ? "Mild" : depression < 21 ? "Moderate" : "Severe",
          anxiety: anxiety < 8 ? "Normal" : anxiety < 10 ? "Mild" : anxiety < 15 ? "Moderate" : "Severe",
          stress: stress < 15 ? "Normal" : stress < 19 ? "Mild" : stress < 26 ? "Moderate" : "Severe"
        }
      };
    }
  },
  "PHQ-9": {
    name: "Patient Health Questionnaire - 9 (PHQ-9)",
    role: "Depression Severity Assessor",
    description: "The PHQ-9 screens and monitors depression based on DSM diagnostic criteria.",
    questions: [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself or that you are a failure",
      "Trouble concentrating on things",
      "Moving or speaking slowly, or being fidgety or restless",
      "Thoughts that you would be better off dead"
    ],
    minScore: 0,
    maxScore: 3,
    scorePhrases: {
      0: "Not at all",
      1: "Several days",
      2: "More than half the days",
      3: "Nearly every day"
    },
    calculateScore: (responses) => {
      const total = responses.reduce((sum, val) => sum + val, 0);
      return {
        raw: total,
        interpretation: total < 5 ? "Minimal depression" : total < 10 ? "Mild depression" : total < 15 ? "Moderate depression" : total < 20 ? "Moderately severe depression" : "Severe depression"
      };
    }
  },
  "MBI": {
    name: "Maslach Burnout Inventory (MBI)",
    role: "Professional Burnout Diagnostic",
    description: "The MBI measures professional burnout through emotional exhaustion, depersonalization, and personal accomplishment.",
    questions: [
      "I feel emotionally drained from my work",
      "I feel used up at the end of the workday",
      "I feel fatigued when I get up in the morning",
      "Working with people all day is a strain for me",
      "I feel burned out from my work",
      "I feel frustrated by my job",
      "I feel I'm working too hard on my job",
      "Working with people directly puts too much stress on me",
      "I feel like I'm at the end of my rope",
      "I've become more callous toward people since I took this job",
      "I worry that this job is hardening me emotionally",
      "I don't really care what happens to some people",
      "I feel I treat some people as impersonal objects",
      "I can easily understand how people feel about things",
      "I deal very effectively with the problems of people",
      "I feel I'm positively influencing other people's lives",
      "I feel very energetic",
      "I can easily create a relaxed atmosphere",
      "I feel exhilarated after working closely with people",
      "I have accomplished many worthwhile things in this job",
      "I feel like I can handle emotional problems calmly",
      "In my work, I deal with emotional problems effectively"
    ],
    minScore: 0,
    maxScore: 6,
    scorePhrases: {
      0: "Never",
      1: "A few times a year",
      2: "Once a month or less",
      3: "A few times a month",
      4: "Once a week",
      5: "A few times a week",
      6: "Every day"
    },
    calculateScore: (responses) => {
      const exhaustion = responses.slice(0, 9).reduce((sum, val) => sum + val, 0);
      const depersonalization = responses.slice(9, 13).reduce((sum, val) => sum + val, 0);
      const accomplishment = responses.slice(13).reduce((sum, val) => sum + val, 0);
      
      return {
        raw: exhaustion + depersonalization + accomplishment,
        subscales: { exhaustion, depersonalization, accomplishment },
        interpretation: {
          exhaustion: exhaustion > 27 ? "High burnout" : exhaustion > 17 ? "Moderate" : "Low",
          depersonalization: depersonalization > 13 ? "High" : depersonalization > 7 ? "Moderate" : "Low",
          accomplishment: accomplishment < 31 ? "High burnout" : accomplishment < 37 ? "Moderate" : "Low"
        }
      };
    }
  }
};

const Results = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies(['access_token']);
  const [userId, setUserId] = useState(null);
  const [allScores, setAllScores] = useState({});
  const [selectedTest, setSelectedTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentResults, setCurrentResults] = useState(null);
  const [fetchedScores, setFetchedScores] = useState({});
  const [isLoadingAllScores, setIsLoadingAllScores] = useState(false);

  const isLoggedIn = !!cookies.access_token;

  // Resolve API test names mapping
  const apiTestMap = useMemo(() => ({
    "WHO-5": "who5",
    "PHQ-9": "phq9",
    "DASS-21": "dass21",
    "IES-R": "iesr",
    "MBI": "mbi",
  }), []);

  // Fetch user_id once using the existing access token
  useEffect(() => {
    const fetchUserId = async () => {
      if (!cookies.access_token) return;
      try {
        const res = await fetch('http://127.0.0.1:5000/api/v1/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: cookies.access_token })
        });
        const data = await res.json();
        if (res.ok && data.user_id) {
          setUserId(data.user_id);
        }
      } catch (e) {
        console.error('Failed to fetch user profile:', e);
      }
    };
    fetchUserId();
  }, [cookies.access_token]);

  const fetchAllScores = async (uid) => {
    if (!uid) return {};
    try {
      const response = await fetch("http://127.0.0.1:5000/api/v1/fetch_all_scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid }),
      });
      const data = await response.json();
      // Backend returns { dass21: [...], phq9: [...], who5: [...], iesr: [...], mbi: [...] }
      return data;
    } catch (err) {
      console.error("Error fetching scores:", err);
      return {};
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        setIsLoadingAllScores(true);
        try {
          const scoresData = await fetchAllScores(userId);
          setAllScores(scoresData);
          
          // Transform the data to match the expected format for fetchedScores
          const transformedScores = {};
          Object.entries(scoresData).forEach(([key, scores]) => {
            if (Array.isArray(scores) && scores.length > 0) {
              // Map backend keys to frontend keys
              const frontendKey = Object.keys(apiTestMap).find(k => apiTestMap[k] === key);
              if (frontendKey) {
                transformedScores[frontendKey] = scores;
              }
            }
          });
          setFetchedScores(transformedScores);
        } catch (error) {
          console.error('Error loading all scores:', error);
        } finally {
          setIsLoadingAllScores(false);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId, apiTestMap]);

  // Handle test selection
  const handleTestSelect = (testKey) => {
    setSelectedTest(testKey);
    
    if (!isLoggedIn) {
      setCurrentResults(null);
      return;
    }

    // Use pre-loaded scores from fetchedScores instead of making API calls
    const scores = fetchedScores[testKey] || [];
    
    console.log("Selected Test:", testKey);
    console.log("Pre-loaded Scores:", scores);
    
    if (scores.length === 0) {
      setCurrentResults(null);
      return;
    }
    
    if (testKey === "DASS-21") {
      const latest = scores[scores.length - 1];
      const lastTotal =
        Number(latest.Depression ?? 0) +
        Number(latest.Anxiety ?? 0) +
        Number(latest.Stress ?? 0);
      
      const subscales = {
        depression: Number(latest.Depression ?? 0),
        anxiety: Number(latest.Anxiety ?? 0),
        stress: Number(latest.Stress ?? 0),
      };
      
      setCurrentResults({
        raw: lastTotal,
        subscales,
        interpretation: "Multi-dimensional",
      });
    } else {
      const latest = Number(scores[scores.length - 1]);
      setCurrentResults({ raw: latest, interpretation: "—" });
    }
  };

  // Build chart data/series dynamically for single vs multi-score tests
  const buildChartConfig = (testKey, scores) => {
    const isMulti = Array.isArray(scores) && scores.length > 0 && typeof scores[0] === 'object';
    if (!scores || scores.length === 0) {
      return { data: [], series: [], isMulti };
    }
    if (!isMulti) {
      // Single-value tests
      const data = scores.map((val, idx) => ({ name: `${idx + 1}`, value: Number(val) }));
      // Color by test
      const color = testKey === 'WHO-5' ? '#10B981' : (testKey === 'PHQ-9' ? '#EF4444' : '#6366F1');
      return { data, series: [{ key: 'value', label: 'Score', color }], isMulti: false };
    }

    // Multi-value tests
    if (testKey === 'DASS-21') {
      // Main chart should show overall total (e.g., 102)
      const data = scores.map((s, idx) => ({
        name: `${idx + 1}`,
        value: Number(s.Depression ?? 0) + Number(s.Anxiety ?? 0) + Number(s.Stress ?? 0)
      }));
      return { data, series: [{ key: 'value', label: 'Total', color: '#EF4444' }], isMulti: false };
    }

    if (testKey === 'MBI') {
      // Support both object and numeric historical shapes
      const looksObject = typeof scores[0] === 'object';
      if (!looksObject) {
        const data = scores.map((val, idx) => ({ name: `${idx + 1}`, value: Number(val) }));
        return { data, series: [{ key: 'value', label: 'Score', color: '#6366F1' }], isMulti: false };
      }
      const data = scores.map((s, idx) => ({
        name: `${idx + 1}`,
        'Emotional Exhaustion': Number(s['Emotional Exhaustion'] ?? 0),
        'Depersonalization': Number(s['Depersonalization'] ?? 0),
        'Personal Accomplishment': Number(s['Personal Accomplishment'] ?? 0)
      }));
      const series = [
        { key: 'Emotional Exhaustion', label: 'Emotional Exhaustion', color: '#DC2626' },
        { key: 'Depersonalization', label: 'Depersonalization', color: '#F59E0B' },
        { key: 'Personal Accomplishment', label: 'Personal Accomplishment', color: '#10B981' }
      ];
      return { data, series, isMulti: true };
    }

    // Default multi-object fallback (e.g., future tests)
    const keys = Object.keys(scores[0]).filter(k => k !== 'date' && k !== 'name');
    const data = scores.map((s, idx) => ({ name: `${idx + 1}`, ...keys.reduce((acc, k) => ({ ...acc, [k]: Number(s[k] ?? 0) }), {}) }));
    const palette = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];
    const series = keys.map((k, i) => ({ key: k, label: k, color: palette[i % palette.length] }));
    return { data, series, isMulti: true };
  };

  if (isLoading || isLoadingAllScores) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-30 py-12 px-4">
      <div className="max-w-7xl mx-auto pt-10">
      {/* Progress Indicator Bar */}
      {selectedTest && (() => {
          const scores = fetchedScores[selectedTest] || [];
          if (scores.length < 2) return null;
          
          // Calculate current and previous scores
          let currentScore, previousScore;
          if (selectedTest === 'DASS-21') {
            const current = scores[scores.length - 1];
            const previous = scores[scores.length - 2];
            currentScore = Number(current.Depression ?? 0) + Number(current.Anxiety ?? 0) + Number(current.Stress ?? 0);
            previousScore = Number(previous.Depression ?? 0) + Number(previous.Anxiety ?? 0) + Number(previous.Stress ?? 0);
          } else {
            currentScore = Number(scores[scores.length - 1]);
            previousScore = Number(scores[scores.length - 2]);
          }
          
          // Determine if improvement (lower is better for most tests except WHO-5)
          const isWho5 = selectedTest === 'WHO-5';
          const isImproving = isWho5 ? currentScore > previousScore : currentScore < previousScore;
          const isStable = currentScore === previousScore;
          const change = Math.abs(currentScore - previousScore);
          const percentChange = previousScore !== 0 ? ((change / previousScore) * 100).toFixed(1) : 0;
          
          return (
            <div className={`rounded-2xl p-6 mb-8 shadow-lg ${
              isStable ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300' :
              isImproving ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300' : 
              'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isStable ? (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <div className="w-6 h-1 bg-blue-600 rounded"></div>
                    </div>
                  ) : isImproving ? (
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-orange-600" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {selectedTest} Progress
                    </h3>
                    <p className={`text-sm font-semibold ${
                      isStable ? 'text-blue-600' :
                      isImproving ? 'text-emerald-600' : 'text-orange-600'
                    }`}>
                      {isStable ? 'Stable' : isImproving ? 'Improving' : 'Needs Attention'}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-slate-600 mb-1">Score Change</p>
                  <p className={`text-2xl font-bold ${
                    isStable ? 'text-blue-600' :
                    isImproving ? 'text-emerald-600' : 'text-orange-600'
                  }`}>
                    {isStable ? '0' : `${isImproving ? (isWho5 ? '+' : '-') : (isWho5 ? '-' : '+')}${change}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isStable ? 'No change' : `${percentChange}% ${isImproving ? 'better' : 'change'}`}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Results Display */}
        {selectedTest && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
            <div className="flex items-center mb-6 pb-4 border-b-2 border-slate-100">
              <BarChart3 className="w-8 h-8 text-blue-600 mr-4" />
              <h3 className="text-2xl font-bold text-slate-800">Score Overview</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                <p className="text-sm text-slate-600 mb-2">
                  {currentResults ? 'Current Score' : 'Latest Score'}
                </p>
                {currentResults ? (
                  <>
                    <p className="text-4xl font-bold text-blue-600">{currentResults.raw}</p>
                    {currentResults.percentage !== undefined && (
                      <p className="text-lg text-slate-600 mt-2">{currentResults.percentage}%</p>
                    )}
                  </>
                ) : (
                  <p className="text-2xl font-semibold text-slate-400">No data available</p>
                )}
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6">
                <p className="text-sm text-slate-600 mb-2">Test Type</p>
                <p className="text-xl font-semibold text-emerald-600">{selectedTest}</p>
              </div>
            </div>

            {/* Graph Section */}
            <div>
              <h4 className="text-lg font-semibold text-slate-800 mb-4">Assessment Summary</h4>
              {(() => {
                const scores = fetchedScores[selectedTest] || [];
                if (scores.length > 0) {
                  return (
                    <div className="h-80 mt-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        {(() => {
                          const { data, series, isMulti } = buildChartConfig(selectedTest, scores);
                          
                          if (!isMulti) {
                            return (
                              <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#f8fafc', 
                                    border: '2px solid #e2e8f0', 
                                    borderRadius: '12px' 
                                  }} 
                                  formatter={(value) => `${value} pts`} 
                                />
                                <Legend />
                                <Line 
                                  type="monotone" 
                                  dataKey={series[0]?.key} 
                                  stroke={series[0]?.color} 
                                  strokeWidth={3} 
                                  dot={{ r: 5 }} 
                                  activeDot={{ r: 7 }} 
                                />
                              </LineChart>
                            );
                          }
                          
                          return (
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#f8fafc', 
                                  border: '2px solid #e2e8f0', 
                                  borderRadius: '12px' 
                                }} 
                                formatter={(value) => `${value} pts`} 
                              />
                              <Legend />
                              {series.map(s => (
                                <Line 
                                  key={s.key} 
                                  type="monotone" 
                                  dataKey={s.key} 
                                  stroke={s.color} 
                                  strokeWidth={3} 
                                  dot={{ r: 4 }} 
                                />
                              ))}
                            </LineChart>
                          );
                        })()}
                      </ResponsiveContainer>
                    </div>
                  );
                } else {
                  return (
                    <div className="h-80 mt-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 flex items-center justify-center">
                      <p className="text-lg text-slate-500">No data available yet for this test</p>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Subscale Analysis - Only for DASS-21 */}
            {selectedTest === 'DASS-21' && fetchedScores[selectedTest]?.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center mb-6 pb-4 border-b-2 border-slate-100">
                  <h3 className="text-2xl font-bold text-slate-800">Detailed Breakdown</h3>
                </div>

                {/* Multi-line subscale trend for DASS-21 */}
                <div className="h-80 mb-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(() => {
                      const scores = fetchedScores[selectedTest] || [];
                      return scores.map((s, idx) => ({
                        name: `${idx + 1}`,
                        Depression: Number(s.Depression ?? 0),
                        Anxiety: Number(s.Anxiety ?? 0),
                        Stress: Number(s.Stress ?? 0)
                      }));
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#f8fafc', 
                          border: '2px solid #e2e8f0', 
                          borderRadius: '12px' 
                        }} 
                        formatter={(value) => `${value} pts`} 
                      />
                      <Legend />
                      <Line type="monotone" dataKey="Depression" stroke="#DC2626" strokeWidth={3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Anxiety" stroke="#F59E0B" strokeWidth={3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Stress" stroke="#EA580C" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Subscale Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(() => {
                    const scores = fetchedScores[selectedTest] || [];
                    if (scores.length === 0) return null;
                    
                    const latest = scores[scores.length - 1];
                    const entries = [
                      ['depression', Number(latest.Depression ?? 0)],
                      ['anxiety', Number(latest.Anxiety ?? 0)],
                      ['stress', Number(latest.Stress ?? 0)],
                    ];
                    
                    return entries.map(([key, val]) => {
                      const getInterpretation = (subscale, value) => {
                        if (subscale === 'depression') {
                          return value < 10 ? 'Normal' : value < 14 ? 'Mild' : value < 21 ? 'Moderate' : 'Severe';
                        } else if (subscale === 'anxiety') {
                          return value < 8 ? 'Normal' : value < 10 ? 'Mild' : value < 15 ? 'Moderate' : 'Severe';
                        } else { // stress
                          return value < 15 ? 'Normal' : value < 19 ? 'Mild' : value < 26 ? 'Moderate' : 'Severe';
                        }
                      };

                      const interpretation = getInterpretation(key, val);
                      const colorClass = interpretation === 'Normal' ? 'text-green-600' : 
                                        interpretation === 'Mild' ? 'text-yellow-600' : 
                                        interpretation === 'Moderate' ? 'text-orange-600' : 'text-red-600';

                      return (
                        <div key={key} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 hover:shadow-lg transition-all">
                          <h4 className="text-lg font-bold text-slate-800 mb-2 capitalize">{key}</h4>
                          <p className="text-2xl font-semibold text-blue-600 mb-2">{val}</p>
                          <p className={`text-sm font-semibold mb-3 ${colorClass}`}>
                            {interpretation}
                          </p>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Subscale Analysis - For MBI */}
            {selectedTest === 'MBI' && currentResults?.subscales && (
              <div className="mt-8">
                <div className="flex items-center mb-6 pb-4 border-b-2 border-slate-100">
                  <Brain className="w-8 h-8 text-purple-600 mr-4" />
                  <h3 className="text-2xl font-bold text-slate-800">Burnout Dimensions</h3>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(currentResults.subscales).map(([key, val]) => {
                    const interpretations = currentResults.interpretation?.[key] || 'Unknown';
                    const colorClass = interpretations === 'Low' || interpretations === 'Low burnout' ? 'text-green-600' : 
                                      interpretations === 'Moderate' ? 'text-yellow-600' : 'text-red-600';
                    
                    return (
                      <div key={key} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 hover:shadow-lg transition-all">
                        <h4 className="text-lg font-bold text-slate-800 mb-2 capitalize">
                          {key === 'exhaustion' ? 'Emotional Exhaustion' : 
                           key === 'depersonalization' ? 'Depersonalization' : 
                           'Personal Accomplishment'}
                        </h4>
                        <p className="text-2xl font-semibold text-blue-600 mb-2">{val}</p>
                        <p className={`text-sm font-semibold mb-3 ${colorClass}`}>
                          {interpretations}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Test Selection Cards */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex items-center mb-6 pb-4 border-b-2 border-slate-100">
            <Target className="w-8 h-8 text-orange-600 mr-4" />
            <h3 className="text-2xl font-bold text-slate-800">All Assessments Dashboard</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(testConfigs).map(([testKey, test]) => {
              const isSelected = selectedTest === testKey;
              const scores = fetchedScores[testKey] || [];
              const hasData = scores.length > 0;

              return (
                <div 
                  key={testKey}
                  onClick={() => handleTestSelect(testKey)}
                  className={`rounded-2xl p-6 transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 shadow-lg' 
                      : hasData
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 hover:shadow-md'
                      : 'bg-slate-50 border border-slate-200 hover:shadow-md'
                  }`}
                >
                  <h4 className="font-bold text-slate-800 mb-2">{test.name}</h4>
                  
                  {isSelected && currentResults && (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">Current Score</p>
                      <p className="text-3xl font-bold text-blue-600">{currentResults.raw}</p>
                    </div>
                  )}
                  
                  {!isSelected && hasData && (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">Last Score</p>
                      <p className="text-3xl font-bold text-emerald-600">
                        {(() => {
                          if (testKey === 'DASS-21') {
                            const last = scores[scores.length - 1];
                            return Number(last.Depression ?? 0) + Number(last.Anxiety ?? 0) + Number(last.Stress ?? 0);
                          }
                          return Number(scores[scores.length - 1]);
                        })()}
                      </p>
                      <div className="bg-white rounded-lg p-2 mt-3">
                        <p className="text-xs text-slate-500">Data available</p>
                      </div>
                    </div>
                  )}
                  
                  {!isSelected && !hasData && (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">Status</p>
                      <p className="text-lg text-slate-500 font-semibold">No data yet</p>
                      <div className="bg-slate-200 rounded-lg p-2 mt-3">
                        <p className="text-xs text-slate-600">Take this assessment to begin</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center flex gap-4 justify-center flex-wrap">
        
          <button
          onClick={() => navigate('/testnew')}
            className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center transform hover:scale-105"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;