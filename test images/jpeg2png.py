from PIL import Image
import os
import sys

def convert_jpeg_to_png(input_folder, output_folder):
    # Ensure the output folder exists
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # List all files in the input folder
    files = os.listdir(input_folder)

    for file in files:
        if file.lower().endswith('.jpeg') or file.lower().endswith('.jpg'):
            # Construct the full path of the input file
            input_path = os.path.join(input_folder, file)

            # Generate the output file name with the same base name and PNG extension
            output_filename = os.path.splitext(file)[0] + '.png'

            # Construct the full path of the output file
            output_path = os.path.join(output_folder, output_filename)

            # Open and save the image in PNG format
            try:
                img = Image.open(input_path)
                img.save(output_path, 'PNG')
                print(f'Converted: {file} to {output_filename}')
            except Exception as e:
                print(f'Error converting {file}: {e}')

# Example usage
input_folder = sys.argv[1]
output_folder = sys.argv[2]
convert_jpeg_to_png(input_folder, output_folder)

