from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv

load_dotenv()


import pandas as pd

# Defining LLM
scenario_llm = ChatOpenAI(
    model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    openai_api_key=os.getenv('TOGETHER_API_KEY'),
    openai_api_base="https://api.together.xyz/v1",
    temperature = 0.001
)

# Load the Excel file
df = pd.read_excel('app/data/Clinical_Data/Clinical Exam Half Dataset.xlsx')

# Validate required columns
if 'AssessmentQuestion' not in df.columns or 'Scenario' not in df.columns:
    raise ValueError("Excel must contain 'AssessmentQuestion' and 'Scenario' columns.")

# Function to turn question into scenario using LLM
def convert_to_scenario(question):
    prompt = f"""
    You are a creative and witty scenario writer for a mental wellness app.

    Convert the following assessment question into a fun, engaging real-life scenario where the user imagines themselves in that moment and chooses how they would respond — not how often it happens.

    Guidelines:
    - Use a light, slightly humorous, and relatable tone.
    - Make the situation realistic and short (1-2 sentences).
    - Avoid using phrases like "how often" or "do you feel."
    - Instead, describe a situation and let the user imagine what they would do.
    - Make sure the scenario still captures the psychological essence of the original question.
    - The response should be suitable for a scale (e.g., 0-4 or 0-5) representing **how strongly or in what way** the user would react.

    Example:
    Clinical Question: “I had trouble concentrating.”
    Answer: "You're reading the same meme caption for the fifth time because your brain just wandered off to a parallel universe. What's your next move?"

    Now, convert the following question into such a scenario:

    And strictly only include just the scnearion nothing else

    Question: {question}
    
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
df.to_excel('app/data/Scenario_added.xlsx', index=False)
print("🎉 Done! Saved as 'updated_questions.xlsx'")
