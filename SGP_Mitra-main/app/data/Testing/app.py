from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import json

app = Flask(__name__)
CORS(app)

def load_assessment_data():
    """Load assessment data from Excel file"""
    try:
        df = pd.read_excel('Custom_Clinical_DS.xlsx')
        print(f"Successfully loaded Excel file with {len(df)} rows")
        print(f"Columns: {list(df.columns)}")
        return df
    except FileNotFoundError:
        print("Error: Custom_Clinical_DS.xlsx file not found")
        return pd.DataFrame()
    except Exception as e:
        print(f"Error loading data: {e}")
        return pd.DataFrame()

@app.route('/api/assessments', methods=['GET'])
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

@app.route('/api/calculate-scores', methods=['POST'])
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
                'percentage': round((total_score / max_possible * 100), 1) if max_possible > 0 else 0
            }
        
        return jsonify({
            'assessmentResults': results,
            'timestamp': pd.Timestamp.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submit-assessment', methods=['POST'])
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)