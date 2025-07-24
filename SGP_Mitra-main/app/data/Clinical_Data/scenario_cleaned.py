import pandas as pd
import re

# Load Excel file
input_file = 'Scenario_added.xlsx'
df = pd.read_excel(input_file)

# Ensure 'Scenario' column exists
if 'Scenario' not in df.columns:
    raise ValueError("The Excel file must contain a 'Scenario' column.")

# Function to remove <think>...</think> and their contents
def remove_think_tags(text):
    if pd.isna(text):
        return text
    return re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()

# Apply cleaning to each row
df['Scenario'] = df['Scenario'].apply(remove_think_tags)

# Save cleaned file
output_file = 'Scenario_cleaned.xlsx'
df.to_excel(output_file, index=False)

print(f"✅ Cleaned and saved to '{output_file}'")
