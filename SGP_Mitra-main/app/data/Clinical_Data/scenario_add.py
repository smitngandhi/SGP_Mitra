from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv

load_dotenv()


import pandas as pd

# Defining LLM
scenario_llm = ChatOpenAI(
    model="lgai/exaone-3-5-32b-instruct",
    openai_api_key=os.getenv('TOGETHER_API_KEY'),
    openai_api_base="https://api.together.xyz/v1",
    temperature = 0.001
)

# Load the Excel file
df = pd.read_excel('Clinical Exam Half Dataset.xlsx')

# Validate required columns
if 'AssessmentQuestion' not in df.columns or 'Scenario' not in df.columns:
    raise ValueError("Excel must contain 'AssessmentQuestion' and 'Scenario' columns.")

# Function to turn question into scenario using LLM
def convert_to_scenario(question):
    prompt = f"""
    You are a witty and creative scenario writer for a mental wellness app.

    Your task is to turn the following mental health assessment question into a short, engaging real-life scenario that helps users reflect on their **energy or motivation** in a specific moment.

    🎯 Purpose:
    The scenario should reveal how much drive or enthusiasm the user would feel — from **0 (stay in bed, no energy)** to **4 or 5 (jump up excited, full of energy)** — using a slider-based response.

    📝 Guidelines:
    - Use a light, relatable, and slightly humorous tone.
    - Describe a real-world situation in **1–2 sentences**.
    - Avoid clinical phrases like “how often” or “do you feel.”
    - Do not ask follow-up questions like “what do you do next?”
    - Instead, **drop the user into the moment** and let them gauge their drive to act.
    - The scenario should clearly allow for a range of motivation responses from low to high.
    - Make scenario where you user has a slider in which he/she has to choose whether to stay in bed or jump up excited on the scale where minimum  represent fully stay in bed and maximum represents fully jump up

    ✅ Example:
    Clinical Question: “I found it hard to get started with tasks.”
    Scenario: “Your phone alarm blares with your to-do list: laundry, emails, and finally that one fun thing you actually like. You stare at the ceiling.”

    Now, convert the following question into such a scenario:

    Question: {question}

    Only return the scenario — nothing else.
    """

    return scenario_llm.invoke(prompt).content.strip()

# Apply LLM to each row and populate the Scenario column
for index, row in df.iterrows():
    question = row['AssessmentQuestion']
    try:
        scenario = convert_to_scenario(question)
        print(scenario)
        df.at[index, 'Scenario'] = str(scenario)
        print(f"✅ Row {index}: Scenario added.")
    except Exception as e:
        print(f"❌ Error at row {index}: {e}")

# Save the updated Excel file
df.to_excel('Scenario_added.xlsx', index=False)
print("🎉 Done! Saved as 'updated_questions.xlsx'")
