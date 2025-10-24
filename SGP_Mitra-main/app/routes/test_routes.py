
# from flask import make_response, redirect, request, jsonify, url_for
# from app.models import users_collection , groq_llm, llm, tests_collection
# from app.utils.mail import send_reset_email
# import secrets
# from app.routes import test_routes
# from datetime import datetime , timedelta 
# from datetime import datetime, timedelta, timezone
# from app.utils.security import  *
# from authlib.integrations.flask_client import OAuth
# import certifi
# import uuid
# import json 
# import pandas as pd
# import ast
# import re
# from app.utils.logger_utils import get_logger

# @test_routes.route("/user_scores", methods=["GET"])
# def get_user_scores():
#     try:
#         # Extract access token from headers
#         access_token = request.headers.get("Authorization")

#         if not access_token:
#             return jsonify({"msg": "Missing Authorization header"}), 401

#         # Expect format: "Bearer <token>"
#         if access_token.startswith("Bearer "):
#             access_token = access_token.split(" ")[1].strip()

#         # Decode token to get email
#         decoded_token = decode_token(access_token)
#         email = decoded_token.get("sub")

#         if not email:
#             return jsonify({"msg": "Invalid or expired token"}), 401

#         # Find the user in users_collection
#         user = users_collection.find_one({"email": email})
#         if not user:
#             return jsonify({"msg": "User not found"}), 404

#         user_id = user["user_id"]

#         # Get user’s test data from tests_collection
#         user_tests = tests_collection.find_one({"user_id": user_id}, {"_id": 0, "user_id": 0, "email": 0})

#         if not user_tests:
#             # If not found, return empty arrays for consistency
#             empty_data = {
#                 "dass21": [],
#                 "phq9": [],
#                 "who5": [],
#                 "iesr": [],
#                 "mbi": []
#             }
#             return jsonify(empty_data), 200

#         return jsonify(user_tests), 200

#     except Exception as e:
#         print(f"Error in get_user_scores: {str(e)}")
#         return jsonify({"msg": "Error fetching user scores", "error": str(e)}), 500
# @test_routes.route("/fetch_scores", methods=["POST"])
# def fetch_scores():
#     try:
#         data = request.get_json()
#         user_id = data.get("user_id")
#         test_name = data.get("test_name")

#         if not user_id or not test_name:
#             return jsonify({"msg": "Bad Request: user_id and test_name are required"}), 400

#         test_name = test_name.lower().strip()
#         valid_tests = ["dass21", "phq9", "who5", "iesr", "mbi"]
#         if test_name not in valid_tests:
#             return jsonify({"msg": f"Invalid test name. Must be one of {valid_tests}"}), 400

#         user_doc = tests_collection.find_one({"user_id": user_id})
#         if not user_doc:
#             return jsonify({"test_name": test_name, "scores": []}), 200

#         scores = user_doc.get(test_name, []) or []
#         return jsonify({"test_name": test_name, "scores": scores}), 200
#     except Exception as e:
#         print(f"Error in fetch_scores: {str(e)}")
#         return jsonify({"msg": "Error fetching scores", "error": str(e)}), 500


# logger = get_logger(__name__)
# @test_routes.route("/score_store", methods=["POST"])
# def score_store():
#     try:
#         data = request.get_json()

#         if not data or "test_name" not in data:
#             return jsonify({"msg": "Bad Request: Missing required fields"}), 400

#         test_name = data["test_name"].lower().strip()
#         valid_tests = ["dass21", "phq9", "who5", "iesr", "mbi"]
#         if test_name not in valid_tests:
#             return jsonify({"msg": f"Invalid test name. Must be one of {valid_tests}"}), 400

#         # Support two modes:
#         # A) New schema: user_id + score_data
#         # B) Legacy schema: access_token + test_score (numeric)
#         user_id = data.get("user_id")
#         email = None
#         if not user_id:
#             access_token = data.get("access_token")
#             if not access_token or "test_score" not in data:
#                 return jsonify({"msg": "Bad Request: Missing required fields"}), 400
#             decoded_token = decode_token(access_token)
#             email = decoded_token.get("sub")
#             if not email:
#                 return jsonify({"msg": "Invalid or expired token"}), 401
#             user = users_collection.find_one({"email": email})
#             if not user:
#                 return jsonify({"msg": "User not found"}), 404
#             user_id = user["user_id"]

#         # Ensure tests document
#         user_tests = tests_collection.find_one({"user_id": user_id})
#         if not user_tests:
#             tests_collection.insert_one({
#                 "user_id": user_id,
#                 "email": email,
#                 "dass21": [],
#                 "phq9": [],
#                 "who5": [],
#                 "iesr": [],
#                 "mbi": []
#             })

#         # Build entry
#         if "score_data" in data:
#             # New schema
#             score_data = data["score_data"]
#             if test_name == "dass21":
#                 entry = {
#                     "date": datetime.now().strftime("%Y-%m-%d"),
#                     "Depression": int(score_data.get("Depression", 0)),
#                     "Anxiety": int(score_data.get("Anxiety", 0)),
#                     "Stress": int(score_data.get("Stress", 0))
#                 }
#             else:
#                 # Numeric tests (who5, phq9, iesr, mbi)
#                 try:
#                     entry = int(score_data)
#                 except Exception:
#                     return jsonify({"msg": "score_data must be a number for this test"}), 400
#         else:
#             # Legacy schema
#             try:
#                 entry = int(data["test_score"])
#             except (ValueError, TypeError):
#                 return jsonify({"msg": "Invalid test_score: must be a number"}), 400

#         tests_collection.update_one(
#             {"user_id": user_id},
#             {"$push": {test_name: entry}}
#         )

#         return jsonify({"msg": f"{test_name.upper()} score stored successfully"}), 200

#     except Exception as e:
#         print(f"Error in score_store: {str(e)}")
#         return jsonify({"msg": "Error storing test score", "error": str(e)}), 500

# @test_routes.route("/store_test_score", methods=["POST"])
# def store_test_score():
#     try:
#         data = request.get_json()
#         if not data or "access_token" not in data or "test_score" not in data:
#             return jsonify({"msg": "Bad Request: Missing required fields"}), 400

#         access_token = data["access_token"]
#         print(access_token)
#         test_score = int(data["test_score"])
#         print(test_score)

#         timestamp = datetime.now(timezone.utc)
#         print(timestamp)

#         # Decode JWT token
#         decoded_token = decode_token(access_token)
#         email = decoded_token.get("sub")
#         print(email)
        
#         if not email:
#             return jsonify({"msg": "Invalid or expired token"}), 401

#         # Determine chatbot preference based on test_score
#         if test_score <= 4:
#             preference = "Minimal Support"
#         elif test_score <= 9:
#             preference = "Mild Support"
#         elif test_score <= 14:
#             preference = "Moderate Support"
#         elif test_score <= 19:
#             preference = "High Support"
#         else:
#             preference = "Critical Support"
        

#         print(preference)
#         # Fetch the user from the database
#         user = users_collection.find_one({"email": email})
#         if not user:
#             return jsonify({"msg": "User not found"}), 404

#         # Ensure test_results is a dictionary
#         # test_results = user.get("test_results")
        
#         # Store the new test score with a timestamp
#         # test_results = {"PHQ-9": test_score, "chatbot_preference": preference , "timestamp": timestamp}
        
#         # Update user test_results in the database
#         update_result = users_collection.update_one(
#             {"email": email},
#             {
#                 "$push": {"test_results": {  # Add to the array
#                     "timestamp": timestamp,
#                     "PHQ-9": test_score,
#                     "chatbot_preference": preference
#                 }},
#                 "$set": {"chatbot_preference": preference}  # Store separately
#             }
#         )
#         if update_result.modified_count == 0:
#             return jsonify({"msg": "No changes made"}), 400

#         return jsonify({"msg": "Test score stored successfully", "chatbot_preference": preference}), 200
    
#     except Exception as e:
#         return jsonify({"msg": "Error storing test score", "error": str(e)}), 500
    


# def load_assessment_data():
#     """Load assessment data from Excel file"""
#     try:
#         df = pd.read_excel('app/data/Clinical_Data/Small_Final_16.xlsx')
#         print(f"Successfully loaded Excel file with {len(df)} rows")
#         print(f"Columns: {list(df.columns)}")
#         return df
#     except FileNotFoundError:
#         print("Error: Excel file not found")
#         return pd.DataFrame()
#     except Exception as e:
#         print(f"Error loading data: {e}")
#         return pd.DataFrame()

# @test_routes.route('/assessments', methods=['GET'])
# def get_assessments():
#     """Get all assessment cards (one per row)"""
#     try:
#         df = load_assessment_data()
#         print(f"Loaded {len(df)} rows from Excel") # Debug log
        
#         if df.empty:
#             return jsonify({
#                 'cards': [],
#                 'assessmentTypes': [],
#                 'totalCards': 0,
#                 'error': 'No data found in Excel file'
#             })
        
#         # Replace NaN values with empty strings or appropriate defaults
#         df = df.fillna({
#             'ID': 0,
#             'SearchItem': '',
#             'Scenario': '',
#             'AssessmentQuestion': '',
#             'AssessmentType': '',
#             'ImageURL': '',
#             'Score Logic': '0-4'
#         })
        
#         cards = []
#         assessment_types = set()
        
#         for index, row in df.iterrows():
#             try:
#                 # Skip rows with empty essential data
#                 if pd.isna(row['AssessmentQuestion']) or str(row['AssessmentQuestion']).strip() == '':
#                     continue
                
#                 assessment_type = str(row['AssessmentType']).strip()
#                 if assessment_type:
#                     assessment_types.add(assessment_type)
                
#                 # Parse score logic to get min and max values
#                 score_logic = str(row['Score Logic']).strip()
#                 min_score, max_score = 0, 4  # default values
                
#                 if '-' in score_logic and score_logic != 'nan':
#                     try:
#                         min_score, max_score = map(int, score_logic.split('-'))
#                     except Exception as parse_error:
#                         print(f"Error parsing score logic '{score_logic}': {parse_error}")
#                         pass
                
#                 # Ensure all values are properly converted and not NaN
#                 card = {
#                     'id': int(row["ID"]) if pd.notna(row["ID"]) else index,
#                     'searchItem': str(row['SearchItem']) if pd.notna(row['SearchItem']) else f"Item {index + 1}",
#                     'scenario': str(row['Scenario']) if pd.notna(row['Scenario']) else '',
#                     'assessmentQuestion': str(row['AssessmentQuestion']),
#                     'assessmentType': assessment_type,
#                     'imageUrl': str(row['ImageURL']) if pd.notna(row['ImageURL']) and str(row['ImageURL']) != 'nan' else '',
#                     'scoreLogic': score_logic if score_logic != 'nan' else '0-4',
#                     'minScore': min_score,
#                     'maxScore': max_score
#                 }
#                 cards.append(card)
                
#             except Exception as row_error:
#                 print(f"Error processing row {index}: {row_error}")
#                 print(f"Row data: {row.to_dict()}")
#                 continue
        
#         print(f"Successfully created {len(cards)} cards")
#         print(f"Assessment types: {list(assessment_types)}")
        
#         return jsonify({
#             'cards': cards,
#             'assessmentTypes': list(assessment_types),
#             'totalCards': len(cards)
#         })
    
#     except Exception as e:
#         print(f"Error in get_assessments: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({'error': str(e)}), 500

# @test_routes.route('/calculate-scores', methods=['POST'])
# def calculate_scores():
#     """Calculate assessment scores based on user responses"""
#     try:
#         data = request.json
#         responses = data.get('responses', {})
        
#         df = load_assessment_data()
        
#         # Initialize score counters for each assessment type
#         assessment_scores = {}
#         assessment_counts = {}
#         max_possible_scores = {}
        
#         # Get all unique assessment types
#         for assessment_type_raw in df['AssessmentType'].unique():
#             assessment_type = str(assessment_type_raw).strip()
#             assessment_scores[assessment_type] = 0
#             assessment_counts[assessment_type] = 0
#             max_possible_scores[assessment_type] = 0
        
#         # Calculate scores based on responses
#         for card_id, user_score in responses.items():
#             # Find the row with matching ID
#             matching_rows = df[df['ID'] == int(card_id)]
#             if not matching_rows.empty:
#                 row = matching_rows.iloc[0]
#                 assessment_type = str(row['AssessmentType']).strip()
                
#                 # Parse score logic to get max possible score
#                 score_logic = str(row['Score Logic']).strip()
#                 max_score = 4  # default
#                 if '-' in score_logic:
#                     try:
#                         _, max_score = map(int, score_logic.split('-'))
#                     except:
#                         pass
                
#                 # Add the user's score to the assessment type total
#                 assessment_scores[assessment_type] += int(user_score)
#                 assessment_counts[assessment_type] += 1
#                 max_possible_scores[assessment_type] += max_score
        
#         # Calculate results
#         results = {}
#         for assessment_type in assessment_scores:
#             total_score = assessment_scores[assessment_type]
#             question_count = assessment_counts[assessment_type]
#             max_possible = max_possible_scores[assessment_type]
            
#             # type = assessment_type.strip()
#             results[assessment_type] = {
#                 'totalScore': total_score,
#                 'maxPossibleScore': max_possible,
#                 'questionCount': question_count,
#                 'averageScore': round(total_score / question_count, 2) if question_count > 0 else 0,
#                 'percentage': round((total_score / max_possible * 100), 1) if max_possible > 0 else 0,
#                 'normalized': (total_score / max_possible) * 5
#             }
        
#         return jsonify({
#             'assessmentResults': results,
#             'timestamp': pd.Timestamp.now().isoformat()
#         })
    
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500

# @test_routes.route('/submit-assessment', methods=['POST'])
# def submit_assessment():
#     """Submit complete assessment results"""
#     try:
#         data = request.json
        
#         # Here you can save the results to database or file
#         print("Assessment Results Received:")
#         print(json.dumps(data, indent=2))
        
#         return jsonify({
#             'status': 'success',
#             'message': 'Assessment results submitted successfully',
#             'submittedAt': pd.Timestamp.now().isoformat()
#         })
    
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
    
# @test_routes.route('/get-personal-insight', methods=['POST'])
# def get_personal_insights():
#     try:
#         data = request.get_json()
#         scores = data.get("scores", {})

#         if not scores:
#             return jsonify({"error": "No scores provided."}), 400

#         # Map keys to user-friendly names
#         key_descriptions = {
#             "DASS-21": "DASS-21 (Stress)",
#             "GAD-7": "GAD-7 (Anxiety)",
#             "IES-R (Impact of Events Scale)": "IES-R (Trauma)",
#             "MBI-A": "MBI-A (Burnout)",
#             "MBI-B": "MBI-B (Depersonalization)",
#             "MBI-C": "MBI-C (Personal Achievement)",
#             "WHO-5": "WHO-5 (Well-being)"
#         }

#         # Construct score lines for prompt
#         score_lines = ""
#         for key, value in scores.items():
#             description = key_descriptions.get(key, key)
#             score_lines += f"- {description}: {value}\n"

#         prompt = f"""
#         You are a compassionate mental health assistant that provides warm, encouraging, and personalized insights based on the user's mental health scores. 
#         Here are the normalized scores:\n\n{score_lines}
#         Give a warm and uplifting 2-3 line personal insight based on these.
#         """

#         insight = llm.invoke(prompt).content.strip()

#         return jsonify({"insight": insight}), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
    

# @test_routes.route('/get-strength-insight', methods=['POST'])
# def get_strength_insight():
#     try:
#         data = request.get_json()
#         scores = data.get("scores", {})

#         if not scores:
#             return jsonify({"error": "No scores provided."}), 400

#         # Descriptions for clarity in prompt
#         key_descriptions = {
#             "DASS-21": "DASS-21 (Stress)",
#             "GAD-7": "GAD-7 (Anxiety)",
#             "IES-R (Impact of Events Scale)": "IES-R (Trauma)",
#             "MBI-A": "MBI-A (Burnout)",
#             "MBI-B": "MBI-B (Depersonalization)",
#             "MBI-C": "MBI-C (Personal Achievement)",
#             "WHO-5": "WHO-5 (Well-being)"
#         }

#         # Prepare score lines
#         score_lines = ""
#         for key, value in scores.items():
#             description = key_descriptions.get(key, key)
#             score_lines += f"- {description}: {value}\n"

#         # Strength-focused prompt
#         prompt = f"""
#         You are a positive psychology assistant that highlights a user's mental strengths based on their assessment scores.
#         Based on the following normalized scores:\n\n{score_lines}
#         Write a 2-3 line encouraging and strength-focused insight. Emphasize what's going well for the user and where they show resilience or positive capacity.
#         """

#         strength_insight = groq_llm.invoke(prompt).content.strip()

#         return jsonify({"insight": strength_insight}), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
    
# @test_routes.route('/get-growth-insight', methods=['POST'])
# def get_growth_insight():
#     try:
#         data = request.get_json()
#         scores = data.get("scores", {})

#         if not scores:
#             return jsonify({"error": "No scores provided."}), 400

#         # Descriptions for clarity in prompt
#         key_descriptions = {
#             "DASS-21": "DASS-21 (Stress)",
#             "GAD-7": "GAD-7 (Anxiety)",
#             "IES-R (Impact of Events Scale)": "IES-R (Trauma)",
#             "MBI-A": "MBI-A (Burnout)",
#             "MBI-B": "MBI-B (Depersonalization)",
#             "MBI-C": "MBI-C (Personal Achievement)",
#             "WHO-5": "WHO-5 (Well-being)"
#         }

#         # Prepare score lines
#         score_lines = ""
#         for key, value in scores.items():
#             description = key_descriptions.get(key, key)
#             score_lines += f"- {description}: {value}\n"

#         # Growth-focused prompt
#         prompt = f"""
#         You are a mental wellness assistant focused on personal growth and self-awareness.
#         Based on the following normalized mental health scores:\n\n{score_lines}
#         Kindly provide a warm, empathetic 2-3 line growth insight. Gently suggest where the user could focus to improve their mental well-being or resilience. Do not be judgmental—focus on support and encouragement.
#         """

#         growth_insight = groq_llm.invoke(prompt).content.strip()

#         return jsonify({"insight": growth_insight}), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @test_routes.route('/get-recommendations', methods=['POST'])
# def get_recommendations():
#     try:
#         data = request.get_json()
#         scores = data.get("scores", {})

#         if not scores:
#             return jsonify({"error": "No scores provided."}), 400

#         # Descriptions for clarity in the prompt
#         key_descriptions = {
#             "DASS-21": "DASS-21 (Stress)",
#             "GAD-7": "GAD-7 (Anxiety)",
#             "IES-R (Impact of Events Scale)": "IES-R (Trauma)",
#             "MBI-A": "MBI-A (Burnout)",
#             "MBI-B": "MBI-B (Depersonalization)",
#             "MBI-C": "MBI-C (Personal Achievement)",
#             "WHO-5": "WHO-5 (Well-being)"
#         }

#         # Format the score section
#         score_lines = ""
#         for key, value in scores.items():
#             description = key_descriptions.get(key, key)
#             score_lines += f"- {description}: {value}\n"

#         # Prompt for practical and helpful recommendations
#         prompt = f"""
#         You are a compassionate mental health assistant.
#         Based on the following scores:\n\n{score_lines}
#         Provide a list of exactly 5 short, practical recommendations (in bullet points) that may help improve the user's mental health.
#         Focus on a balance of physical, emotional, and mindful self-care practices.
#         Respond only with a Python list of strings.
#         """

#         response = groq_llm.invoke(prompt).content.strip()
#         response = re.sub(r"^- ", "", response, flags=re.MULTILINE)
#         print(f'Response is: {response}')
#         try:
#             recommendations = ast.literal_eval(response)
#             if isinstance(recommendations, list):
#                 return jsonify({"recommendations": recommendations}), 200
#             else:
#                 raise ValueError("LLM response is not a list.")
#         except Exception:
#             return jsonify({
#                 "error": "Failed to parse LLM response as a list.",
#                 "raw_response": response
#             }), 500

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500








from flask import make_response, redirect, request, jsonify, url_for
from app.models import users_collection , groq_llm, llm, tests_collection
from app.utils.mail import send_reset_email
import secrets
from app.routes import test_routes
from datetime import datetime , timedelta 
from datetime import datetime, timedelta, timezone
from app.utils.security import  *
from authlib.integrations.flask_client import OAuth
import certifi
import uuid
import json 
import pandas as pd
import ast
import re
from app.utils.logger_utils import get_logger

@test_routes.route("/user_scores", methods=["GET"])
def get_user_scores():
    try:
        # Extract access token from headers
        access_token = request.headers.get("Authorization")

        if not access_token:
            return jsonify({"msg": "Missing Authorization header"}), 401

        # Expect format: "Bearer <token>"
        if access_token.startswith("Bearer "):
            access_token = access_token.split(" ")[1].strip()

        # Decode token to get email
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")

        if not email:
            return jsonify({"msg": "Invalid or expired token"}), 401

        # Find the user in users_collection
        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"msg": "User not found"}), 404

        user_id = user["user_id"]

        # Get user’s test data from tests_collection
        user_tests = tests_collection.find_one({"user_id": user_id}, {"_id": 0, "user_id": 0, "email": 0})

        if not user_tests:
            # If not found, return empty arrays for consistency
            empty_data = {
                "dass21": [],
                "phq9": [],
                "who5": [],
                "iesr": [],
                "mbi": []
            }
            return jsonify(empty_data), 200

        return jsonify(user_tests), 200

    except Exception as e:
        print(f"Error in get_user_scores: {str(e)}")
        return jsonify({"msg": "Error fetching user scores", "error": str(e)}), 500
@test_routes.route("/fetch_scores", methods=["POST"])
def fetch_scores():
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        test_name = data.get("test_name")

        if not user_id or not test_name:
            return jsonify({"msg": "Bad Request: user_id and test_name are required"}), 400

        test_name = test_name.lower().strip()
        valid_tests = ["dass21", "phq9", "who5", "iesr", "mbi"]
        if test_name not in valid_tests:
            return jsonify({"msg": f"Invalid test name. Must be one of {valid_tests}"}), 400

        user_doc = tests_collection.find_one({"user_id": user_id})
        if not user_doc:
            return jsonify({"test_name": test_name, "scores": []}), 200

        scores = user_doc.get(test_name, []) or []
        return jsonify({"test_name": test_name, "scores": scores}), 200
    except Exception as e:
        print(f"Error in fetch_scores: {str(e)}")
        return jsonify({"msg": "Error fetching scores", "error": str(e)}), 500

logger = get_logger(__name__)


@test_routes.route("/fetch_all_scores", methods=["POST"])
def fetch_all_scores():
    try:
        data = request.get_json()
        user_id = data.get("user_id")

        if not user_id:
            return jsonify({"msg": "Bad Request: user_id is required"}), 400

        valid_tests = ["dass21", "phq9", "who5", "iesr", "mbi"]

        user_doc = tests_collection.find_one({"user_id": user_id}, {"_id": 0})
        if not user_doc:
            # Return empty scores for all valid tests if user not found
            return jsonify({test: [] for test in valid_tests}), 200

        # Extract only relevant test scores from user document
        user_scores = {test: user_doc.get(test, []) for test in valid_tests}
        print(user_scores)
        return jsonify(user_scores), 200

    except Exception as e:
        print(f"Error in fetch_scores: {str(e)}")
        return jsonify({"msg": "Error fetching scores", "error": str(e)}), 500


logger = get_logger(__name__)


@test_routes.route("/score_store", methods=["POST"])
def score_store():
    try:
        data = request.get_json()
        logger.debug(f"Received data: {data}")  # Debug incoming request

        if not data or "test_name" not in data:
            logger.warning("Missing required field 'test_name'")
            return jsonify({"msg": "Bad Request: Missing required fields"}), 400

        test_name = data["test_name"].lower().strip()
        valid_tests = ["dass21", "phq9", "who5", "iesr", "mbi"]
        logger.debug(f"Processing test: {test_name}")
        if test_name not in valid_tests:
            logger.warning(f"Invalid test_name: {test_name}")
            return jsonify({"msg": f"Invalid test name. Must be one of {valid_tests}"}), 400

        # Mode detection
        user_id = data.get("user_id")
        access_token = data.get("access_token")
        decoded_token = decode_token(access_token)
        logger.debug(f"Decoded token: {decoded_token}")
        email = decoded_token.get("sub")
        if not user_id:
            user = users_collection.find_one({"email": email})
            logger.debug(f"User found: {user}")
            if not user:
                logger.warning(f"User not found for email: {email}")
                return jsonify({"msg": "User not found"}), 404
            user_id = user["user_id"]

        # # Ensure tests document exists
        user_tests = tests_collection.find_one({"user_id": user_id})
        logger.debug(f"User tests before insert: {user_tests}")
        if not user_tests:
            logger.info(f"Inserting new test record for user_id: {user_id}")
            tests_collection.insert_one({
                "user_id": user_id,
                "email": email,
                "dass21": [],
                "phq9": [],
                "who5": [],
                "iesr": [],
                "mbi": []
            })

        # Build score entry
        if "score_data" in data:
            score_data = data["score_data"]
            logger.debug(f"Score data received (new schema): {score_data}")
            if test_name == "dass21":
                entry = {
                    "Depression": int(score_data.get("Depression", 0)),
                    "Anxiety": int(score_data.get("Anxiety", 0)),
                    "Stress": int(score_data.get("Stress", 0))
                }
                entry["Total"] = entry["Depression"] + entry["Anxiety"] + entry["Stress"]
            else:
                try:
                    entry = int(score_data)
                except Exception as e:
                    logger.error(f"score_data must be numeric for {test_name}: {score_data}, error: {e}")
                    return jsonify({"msg": "score_data must be a number for this test"}), 400
        else:
            # Legacy schema
            try:
                test_score = int(data["test_score"])
                if test_name == "dass21":
                    entry = {"Depression": 0, "Anxiety": 0, "Stress": 0, "Total": test_score}
                else:
                    entry = test_score
                logger.debug(f"Score entry (legacy): {entry}")
            except (ValueError, TypeError) as e:
                logger.error(f"Invalid test_score: {data.get('test_score')}, error: {e}")
                return jsonify({"msg": "Invalid test_score: must be a number"}), 400

        # Store in DB
        result = tests_collection.update_one({"user_id": user_id}, {"$push": {test_name: entry}})
        logger.debug(f"DB update result: {result.raw_result}")

        return jsonify({"msg": f"{test_name.upper()} score stored successfully"}), 200

    except Exception as e:
        logger.exception(f"Unexpected error in score_store: {e}")
        return jsonify({"msg": "Error storing test score", "error": str(e)}), 500


@test_routes.route("/store_test_score", methods=["POST"])
def store_test_score():
    try:
        data = request.get_json()
        if not data or "access_token" not in data or "test_score" not in data:
            return jsonify({"msg": "Bad Request: Missing required fields"}), 400

        access_token = data["access_token"]
        print(access_token)
        test_score = int(data["test_score"])
        print(test_score)

        timestamp = datetime.now(timezone.utc)
        print(timestamp)

        # Decode JWT token
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")
        print(email)
        
        if not email:
            return jsonify({"msg": "Invalid or expired token"}), 401

        # Determine chatbot preference based on test_score
        if test_score <= 4:
            preference = "Minimal Support"
        elif test_score <= 9:
            preference = "Mild Support"
        elif test_score <= 14:
            preference = "Moderate Support"
        elif test_score <= 19:
            preference = "High Support"
        else:
            preference = "Critical Support"
        

        print(preference)
        # Fetch the user from the database
        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"msg": "User not found"}), 404

        # Ensure test_results is a dictionary
        # test_results = user.get("test_results")
        
        # Store the new test score with a timestamp
        # test_results = {"PHQ-9": test_score, "chatbot_preference": preference , "timestamp": timestamp}
        
        # Update user test_results in the database
        update_result = users_collection.update_one(
            {"email": email},
            {
                "$push": {"test_results": {  # Add to the array
                    "timestamp": timestamp,
                    "PHQ-9": test_score,
                    "chatbot_preference": preference
                }},
                "$set": {"chatbot_preference": preference}  # Store separately
            }
        )
        if update_result.modified_count == 0:
            return jsonify({"msg": "No changes made"}), 400

        return jsonify({"msg": "Test score stored successfully", "chatbot_preference": preference}), 200
    
    except Exception as e:
        return jsonify({"msg": "Error storing test score", "error": str(e)}), 500
    


def load_assessment_data():
    """Load assessment data from Excel file"""
    try:
        df = pd.read_excel('app/data/Clinical_Data/Small_Final_16.xlsx')
        print(f"Successfully loaded Excel file with {len(df)} rows")
        print(f"Columns: {list(df.columns)}")
        return df
    except FileNotFoundError:
        print("Error: Excel file not found")
        return pd.DataFrame()
    except Exception as e:
        print(f"Error loading data: {e}")
        return pd.DataFrame()

@test_routes.route('/assessments', methods=['GET'])
def get_assessments():
    """Get all assessment cards (one per row)"""
    try:
        df = load_assessment_data()
        print(f"Loaded {len(df)} rows from Excel") # Debug log
        
        if df.empty:
            return jsonify({
                'cards': [],
                'assessmentTypes': [],
                'totalCards': 0,
                'error': 'No data found in Excel file'
            })
        
        # Replace NaN values with empty strings or appropriate defaults
        df = df.fillna({
            'ID': 0,
            'SearchItem': '',
            'Scenario': '',
            'AssessmentQuestion': '',
            'AssessmentType': '',
            'ImageURL': '',
            'Score Logic': '0-4'
        })
        
        cards = []
        assessment_types = set()
        
        for index, row in df.iterrows():
            try:
                # Skip rows with empty essential data
                if pd.isna(row['AssessmentQuestion']) or str(row['AssessmentQuestion']).strip() == '':
                    continue
                
                assessment_type = str(row['AssessmentType']).strip()
                if assessment_type:
                    assessment_types.add(assessment_type)
                
                # Parse score logic to get min and max values
                score_logic = str(row['Score Logic']).strip()
                min_score, max_score = 0, 4  # default values
                
                if '-' in score_logic and score_logic != 'nan':
                    try:
                        min_score, max_score = map(int, score_logic.split('-'))
                    except Exception as parse_error:
                        print(f"Error parsing score logic '{score_logic}': {parse_error}")
                        pass
                
                # Ensure all values are properly converted and not NaN
                card = {
                    'id': int(row["ID"]) if pd.notna(row["ID"]) else index,
                    'searchItem': str(row['SearchItem']) if pd.notna(row['SearchItem']) else f"Item {index + 1}",
                    'scenario': str(row['Scenario']) if pd.notna(row['Scenario']) else '',
                    'assessmentQuestion': str(row['AssessmentQuestion']),
                    'assessmentType': assessment_type,
                    'imageUrl': str(row['ImageURL']) if pd.notna(row['ImageURL']) and str(row['ImageURL']) != 'nan' else '',
                    'scoreLogic': score_logic if score_logic != 'nan' else '0-4',
                    'minScore': min_score,
                    'maxScore': max_score
                }
                cards.append(card)
                
            except Exception as row_error:
                print(f"Error processing row {index}: {row_error}")
                print(f"Row data: {row.to_dict()}")
                continue
        
        print(f"Successfully created {len(cards)} cards")
        print(f"Assessment types: {list(assessment_types)}")
        
        return jsonify({
            'cards': cards,
            'assessmentTypes': list(assessment_types),
            'totalCards': len(cards)
        })
    
    except Exception as e:
        print(f"Error in get_assessments: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@test_routes.route('/calculate-scores', methods=['POST'])
def calculate_scores():
    """Calculate assessment scores based on user responses"""
    try:
        data = request.json
        responses = data.get('responses', {})
        
        df = load_assessment_data()
        
        # Initialize score counters for each assessment type
        assessment_scores = {}
        assessment_counts = {}
        max_possible_scores = {}
        
        # Get all unique assessment types
        for assessment_type_raw in df['AssessmentType'].unique():
            assessment_type = str(assessment_type_raw).strip()
            assessment_scores[assessment_type] = 0
            assessment_counts[assessment_type] = 0
            max_possible_scores[assessment_type] = 0
        
        # Calculate scores based on responses
        for card_id, user_score in responses.items():
            # Find the row with matching ID
            matching_rows = df[df['ID'] == int(card_id)]
            if not matching_rows.empty:
                row = matching_rows.iloc[0]
                assessment_type = str(row['AssessmentType']).strip()
                
                # Parse score logic to get max possible score
                score_logic = str(row['Score Logic']).strip()
                max_score = 4  # default
                if '-' in score_logic:
                    try:
                        _, max_score = map(int, score_logic.split('-'))
                    except:
                        pass
                
                # Add the user's score to the assessment type total
                assessment_scores[assessment_type] += int(user_score)
                assessment_counts[assessment_type] += 1
                max_possible_scores[assessment_type] += max_score
        
        # Calculate results
        results = {}
        for assessment_type in assessment_scores:
            total_score = assessment_scores[assessment_type]
            question_count = assessment_counts[assessment_type]
            max_possible = max_possible_scores[assessment_type]
            
            # type = assessment_type.strip()
            results[assessment_type] = {
                'totalScore': total_score,
                'maxPossibleScore': max_possible,
                'questionCount': question_count,
                'averageScore': round(total_score / question_count, 2) if question_count > 0 else 0,
                'percentage': round((total_score / max_possible * 100), 1) if max_possible > 0 else 0,
                'normalized': (total_score / max_possible) * 5
            }
        
        return jsonify({
            'assessmentResults': results,
            'timestamp': pd.Timestamp.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@test_routes.route('/submit-assessment', methods=['POST'])
def submit_assessment():
    """Submit complete assessment results"""
    try:
        data = request.json
        
        # Here you can save the results to database or file
        print("Assessment Results Received:")
        print(json.dumps(data, indent=2))
        
        return jsonify({
            'status': 'success',
            'message': 'Assessment results submitted successfully',
            'submittedAt': pd.Timestamp.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@test_routes.route('/get-personal-insight', methods=['POST'])
def get_personal_insights():
    try:
        data = request.get_json()
        scores = data.get("scores", {})

        if not scores:
            return jsonify({"error": "No scores provided."}), 400

        # Map keys to user-friendly names
        key_descriptions = {
            "DASS-21": "DASS-21 (Stress)",
            "GAD-7": "GAD-7 (Anxiety)",
            "IES-R (Impact of Events Scale)": "IES-R (Trauma)",
            "MBI-A": "MBI-A (Burnout)",
            "MBI-B": "MBI-B (Depersonalization)",
            "MBI-C": "MBI-C (Personal Achievement)",
            "WHO-5": "WHO-5 (Well-being)"
        }

        # Construct score lines for prompt
        score_lines = ""
        for key, value in scores.items():
            description = key_descriptions.get(key, key)
            score_lines += f"- {description}: {value}\n"

        prompt = f"""
        You are a compassionate mental health assistant that provides warm, encouraging, and personalized insights based on the user's mental health scores. 
        Here are the normalized scores:\n\n{score_lines}
        Give a warm and uplifting 2-3 line personal insight based on these.
        """

        insight = llm.invoke(prompt).content.strip()

        return jsonify({"insight": insight}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@test_routes.route('/get-strength-insight', methods=['POST'])
def get_strength_insight():
    try:
        data = request.get_json()
        scores = data.get("scores", {})

        if not scores:
            return jsonify({"error": "No scores provided."}), 400

        # Descriptions for clarity in prompt
        key_descriptions = {
            "DASS-21": "DASS-21 (Stress)",
            "GAD-7": "GAD-7 (Anxiety)",
            "IES-R (Impact of Events Scale)": "IES-R (Trauma)",
            "MBI-A": "MBI-A (Burnout)",
            "MBI-B": "MBI-B (Depersonalization)",
            "MBI-C": "MBI-C (Personal Achievement)",
            "WHO-5": "WHO-5 (Well-being)"
        }

        # Prepare score lines
        score_lines = ""
        for key, value in scores.items():
            description = key_descriptions.get(key, key)
            score_lines += f"- {description}: {value}\n"

        # Strength-focused prompt
        prompt = f"""
        You are a positive psychology assistant that highlights a user's mental strengths based on their assessment scores.
        Based on the following normalized scores:\n\n{score_lines}
        Write a 2-3 line encouraging and strength-focused insight. Emphasize what's going well for the user and where they show resilience or positive capacity.
        """

        strength_insight = groq_llm.invoke(prompt).content.strip()

        return jsonify({"insight": strength_insight}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@test_routes.route('/get-growth-insight', methods=['POST'])
def get_growth_insight():
    try:
        data = request.get_json()
        scores = data.get("scores", {})

        if not scores:
            return jsonify({"error": "No scores provided."}), 400

        # Descriptions for clarity in prompt
        key_descriptions = {
            "DASS-21": "DASS-21 (Stress)",
            "GAD-7": "GAD-7 (Anxiety)",
            "IES-R (Impact of Events Scale)": "IES-R (Trauma)",
            "MBI-A": "MBI-A (Burnout)",
            "MBI-B": "MBI-B (Depersonalization)",
            "MBI-C": "MBI-C (Personal Achievement)",
            "WHO-5": "WHO-5 (Well-being)"
        }

        # Prepare score lines
        score_lines = ""
        for key, value in scores.items():
            description = key_descriptions.get(key, key)
            score_lines += f"- {description}: {value}\n"

        # Growth-focused prompt
        prompt = f"""
        You are a mental wellness assistant focused on personal growth and self-awareness.
        Based on the following normalized mental health scores:\n\n{score_lines}
        Kindly provide a warm, empathetic 2-3 line growth insight. Gently suggest where the user could focus to improve their mental well-being or resilience. Do not be judgmental—focus on support and encouragement.
        """

        growth_insight = groq_llm.invoke(prompt).content.strip()

        return jsonify({"insight": growth_insight}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@test_routes.route('/get-recommendations', methods=['POST'])
def get_recommendations():
    try:
        data = request.get_json()
        scores = data.get("scores", {})

        if not scores:
            return jsonify({"error": "No scores provided."}), 400

        # Descriptions for clarity in the prompt
        key_descriptions = {
            "DASS-21": "DASS-21 (Stress)",
            "GAD-7": "GAD-7 (Anxiety)",
            "IES-R (Impact of Events Scale)": "IES-R (Trauma)",
            "MBI-A": "MBI-A (Burnout)",
            "MBI-B": "MBI-B (Depersonalization)",
            "MBI-C": "MBI-C (Personal Achievement)",
            "WHO-5": "WHO-5 (Well-being)"
        }

        # Format the score section
        score_lines = ""
        for key, value in scores.items():
            description = key_descriptions.get(key, key)
            score_lines += f"- {description}: {value}\n"

        # Prompt for practical and helpful recommendations
        prompt = f"""
        You are a compassionate mental health assistant.
        Based on the following scores:\n\n{score_lines}
        Provide a list of exactly 5 short, practical recommendations (in bullet points) that may help improve the user's mental health.
        Focus on a balance of physical, emotional, and mindful self-care practices.
        Respond only with a Python list of strings.
        """

        response = groq_llm.invoke(prompt).content.strip()
        response = re.sub(r"^- ", "", response, flags=re.MULTILINE)
        print(f'Response is: {response}')
        try:
            recommendations = ast.literal_eval(response)
            if isinstance(recommendations, list):
                return jsonify({"recommendations": recommendations}), 200
            else:
                raise ValueError("LLM response is not a list.")
        except Exception:
            return jsonify({
                "error": "Failed to parse LLM response as a list.",
                "raw_response": response
            }), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500