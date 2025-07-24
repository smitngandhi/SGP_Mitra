import pandas as pd
import numpy as np

def create_sample_data():
    """Create sample assessment data matching your structure - one row per card"""
    
    # Sample data for individual assessment cards
    cards_data = []
    
    # Different assessment scenarios with varying score ranges
    sample_cards = [
        {
            "searchItem": "Morning Energy",
            "scenario": "You wake up on a peaceful morning. The sun filters through your window, and you have the whole day ahead of you.",
            "assessmentQuestion": "How do you feel about starting your day?",
            "assessmentType": "PHQ",
            "scoreLogic": "0-4",
            "imageUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop"
        },
        {
            "searchItem": "Social Gathering",
            "scenario": "You're invited to a party where you don't know many people.",
            "assessmentQuestion": "How comfortable do you feel in this social situation?",
            "assessmentType": "GAD",
            "scoreLogic": "0-6",
            "imageUrl": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&h=300&fit=crop"
        },
        {
            "searchItem": "Work Presentation",
            "scenario": "You have to present your project to your entire team tomorrow.",
            "assessmentQuestion": "How anxious do you feel about this presentation?",
            "assessmentType": "GAD",
            "scoreLogic": "0-3",
            "imageUrl": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop"
        },
        {
            "searchItem": "Weekend Plans",
            "scenario": "It's Friday evening and you have the whole weekend free.",
            "assessmentQuestion": "How excited are you about your free time?",
            "assessmentType": "PHQ",
            "scoreLogic": "0-5",
            "imageUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop"
        },
        {
            "searchItem": "Traffic Jam",
            "scenario": "You're stuck in heavy traffic and running late for an important meeting.",
            "assessmentQuestion": "How stressed do you feel in this situation?",
            "assessmentType": "Stress",
            "scoreLogic": "0-4",
            "imageUrl": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=300&fit=crop"
        },
        {
            "searchItem": "Family Dinner",
            "scenario": "Your family is having dinner together and discussing various topics.",
            "assessmentQuestion": "How comfortable do you feel participating in family conversations?",
            "assessmentType": "Social",
            "scoreLogic": "0-6",
            "imageUrl": "https://images.unsplash.com/photo-1574484284002-952d92456975?w=500&h=300&fit=crop"
        }
    ]
    
    
    # Add more sample cards to make it comprehensive
    additional_cards = [
        {
            "searchItem": "Night Sleep",
            "scenario": "It's bedtime and you're lying in bed trying to fall asleep.",
            "assessmentQuestion": "How easy is it for you to fall asleep?",
            "assessmentType": "PHQ",
            "scoreLogic": "0-4",
            "imageUrl": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&h=300&fit=crop"
        },
        {
            "searchItem": "Phone Call",
            "scenario": "You need to make an important phone call to someone you don't know well.",
            "assessmentQuestion": "How nervous do you feel about making this call?",
            "assessmentType": "GAD",
            "scoreLogic": "0-3",
            "imageUrl": "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=500&h=300&fit=crop"
        }
    ]
    
    # Combine all cards
    all_cards = sample_cards + additional_cards
    
    # Create the data structure
    cards_data = []
    for card in all_cards:
        cards_data.append({
            'Scenario': card['scenario'],
            'SearchItem': card['searchItem'], 
            'AssessmentQuestion': card['assessmentQuestion'],
            'AssessmentType': card['assessmentType'],
            'ScoreLogic': card['scoreLogic'],
            'ImageURL': card['imageUrl']
        })
    
    # Create DataFrame
    df = pd.DataFrame(cards_data)
    
    
    # Save to Excel
    df.to_excel('sample_assessment_data.xlsx', index=False)
    print("Sample data created successfully!")
    print(f"Total cards: {len(df)}")
    print("Assessment types:", df['AssessmentType'].value_counts().to_dict())
    print("Score logic examples:", df['ScoreLogic'].unique())


if __name__ == "__main__":
    create_sample_data()