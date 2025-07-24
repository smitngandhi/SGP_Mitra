import pandas as pd
import re

# Load Excel file
input_file = 'Scenario_with_search_items.xlsx'
df = pd.read_excel(input_file)

# Ensure 'Scenario' column exists
if 'SearchItem' not in df.columns:
    raise ValueError("The Excel file must contain a 'SearchItem' column.")

# Function to remove <think>...</think> and their contents
def remove_think_tags(text):
    if pd.isna(text):
        return text
    return re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()

# Apply cleaning to each row
df['SearchItem'] = df['SearchItem'].apply(remove_think_tags)

# Save cleaned file
output_file = 'SearchItem_cleaned.xlsx'
df.to_excel(output_file, index=False)

print(f"✅ Cleaned and saved to '{output_file}'")
