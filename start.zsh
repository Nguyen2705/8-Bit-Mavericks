#!/bin/zsh

# # Start the virtual environment
# source thanhc/bin/activate

# Set the FLASK_APP environment variable
export FLASK_APP=__init__

# Start the Flask server
echo "Starting the Flask server..."
flask run