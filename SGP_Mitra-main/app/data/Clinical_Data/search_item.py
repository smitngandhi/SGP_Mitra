from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv
import pandas as pd

# Load environment variables
load_dotenv()

# Define LLM for generating search keywords
search_llm = ChatOpenAI(
    model="deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
    openai_api_key=os.getenv('TOGETHER_API_KEY'),
    openai_api_base="https://api.together.xyz/v1",
    temperature=0.2
)

# Load updated Excel file
df = pd.read_excel('Scenario_cleaned.xlsx')

# Validate the required column
if 'Scenario' not in df.columns:
    raise ValueError("Excel must contain a 'Scenario' column.")

# Function to generate a short 2–3 word search phrase
def generate_search_item(scenario):
    prompt = f"""
    You're helping generate search keywords for Pexels based on mental health app scenarios.

    Take the following scenario and write a short, descriptive keyword (2 to 3 words max) that represents a visual image related to it.
    Keep it abstract but relevant. Think of moods, objects, places, or people involved.

    Only return the phrase, nothing else.

    Scenario: {scenario}
    """
    return search_llm.invoke(prompt).content.strip()

# Create and populate SearchItem column
for index, row in df.iterrows():
    scenario = row['Scenario']
    try:
        search_item = generate_search_item(scenario)
        print(f"🔍 Search phrase for row {index}: {search_item}")
        df.at[index, 'SearchItem'] = str(search_item)
    except Exception as e:
        print(f"❌ Error at row {index}: {e}")
        df.at[index, 'SearchItem'] = ""

# Save to new Excel
df.to_excel('Scenario_with_search_items.xlsx', index=False)
print("🎉 Done! Saved as 'Scenario_with_search_items.xlsx'")
