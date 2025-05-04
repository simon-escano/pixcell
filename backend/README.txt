readme is awful but i dont have time

1. Requirements

Ensure that requirements.txt includes all the necessary libraries, such as:
fastapi
uvicorn
pillow
ultralytics
python-dotenv

You can generate a requirements.txt file by running:
pip freeze > requirements.txt

2. Running the FastAPI application locally

Once all the dependencies are installed and the model is set up, run the FastAPI application locally in the backend folder:
uvicorn main:app --reload

The FastAPI accepts images and returns them with their bounding boxes

3. Testing

In order to check for functionalities, run index.html in the live server, upload an image, and click predict. The site should show the output, an image with bounding box/es