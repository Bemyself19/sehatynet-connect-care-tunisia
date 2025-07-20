#!/bin/bash
# Start MongoDB in Docker for SehatyNet+ local development

# Check if the container exists
if [ $(docker ps -a -q -f name=sehaty-mongo) ]; then
  echo "Starting existing MongoDB container..."
  docker start sehaty-mongo
else
  echo "Creating and starting new MongoDB container..."
  docker run -d --name sehaty-mongo -p 27017:27017 mongo:6
fi

echo "MongoDB is running on localhost:27017 (Docker container: sehaty-mongo)"
