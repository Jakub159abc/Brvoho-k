import pandas as pd
import os

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
excel_path = os.path.join(current_dir, 'Finální.xlsx')

print(f"Reading: {excel_path}")
df = pd.read_excel(excel_path)

print(f"Shape: {df.shape}")
print(f"Columns: {len(df.columns)}")

# Columns B (index 1), C (index 2), J (index 9)
print("\nFirst 10 rows:")
for i in range(min(10, len(df))):
    col_b = df.iloc[i, 1] if pd.notna(df.iloc[i, 1]) else ""
    col_c = df.iloc[i, 2] if pd.notna(df.iloc[i, 2]) else ""
    col_j = df.iloc[i, 9] if pd.notna(df.iloc[i, 9]) else ""
    print(f"Row {i}: B='{col_b}', C='{col_c}', J='{col_j}'")
