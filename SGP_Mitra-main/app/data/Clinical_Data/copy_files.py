import os

import shutil

# Set your source and destination directories
source_dir = 'C:\\Users\\Smit\\Desktop\\Clinical Tests'  # Replace with your actual source path
destination_dir = 'C:\\Users\\Smit\\Desktop\\DESKTOP\\6th sem\\New SGP\\Mitra_Dhruvil_Branch\\SGP_Mitra\\SGP_Mitra-main\\app\\data\\Clinical_Data'  # Replace with your actual destination path

# Ensure the destination directory exists
os.makedirs(destination_dir, exist_ok=True)

# Loop through files in source directory
for filename in os.listdir(source_dir):
    src_file = os.path.join(source_dir, filename)
    dst_file = os.path.join(destination_dir, filename)

    # Copy only files (not subdirectories)
    if os.path.isfile(src_file):
        shutil.copy2(src_file, dst_file)  # copy2 preserves metadata
        print(f"Copied: {src_file} -> {dst_file}")
