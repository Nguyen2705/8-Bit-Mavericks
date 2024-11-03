from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from flask_cors import CORS
#from OCR_process import quickstart
import gridfs
import os
import base64 as b64
from google.api_core.client_options import ClientOptions
from google.cloud import documentai # type: ignore
from typing import Optional
app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/Patient"
mongo = PyMongo(app)
CORS(app) # This will enable CORS for all routes


UPLOAD_DIRECTORY = './uploads'

if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)



project_id = 'zerd-hacktx-2024'
location = 'us' # Format is 'us' or 'eu'
processor_id = 'df5ea898dc51e6d8' # Must be unique per project, e.g.: 'My Processor'
processor_display_name = 'Legal_Processor' # Must be unique per project, e.g.: 'My Processor'
processor_type = 'OCR_PROCESSOR' # Use fetch_processor_types to get available processor types
mime_type = "application/pdf" # Refer to https://cloud.google.com/document-ai/docs/file-types for supported file types
field_mask = "text,entities,pages.pageNumber"  # Optional. The fields to return in the Document object.
processor_version_id = "pretrained-ocr-v2.0-2023-06-02" # Optional. Processor version to use



def quickstart(
    project_id: str,
    location: str,
    file_path: str,
    processor_id: str,
):
    # You must set the `api_endpoint`if you use a location other than "us".
    opts = ClientOptions(api_endpoint=f"{location}-documentai.googleapis.com")

    client = documentai.DocumentProcessorServiceClient(client_options=opts)

    # The full resource name of the location, e.g.:
    # `projects/{project_id}/locations/{location}`
    parent = client.common_location_path(project_id, location)

    # Create a Processor
    processor = client.create_processor(
        parent=parent,
        processor=documentai.Processor(
            type_="OCR_PROCESSOR",  # Refer to https://cloud.google.com/document-ai/docs/create-processor for how to get available processor types
            display_name=processor_display_name,
        ),
    )

    # Print the processor information
    print(f"Processor Name: {processor.name}")

    # Read the file into memory
    with open(file_path, "rb") as image:
        image_content = image.read()

    # Load binary data
    raw_document = documentai.RawDocument(
        content=image_content,
        mime_type="application/pdf",  # Refer to https://cloud.google.com/document-ai/docs/file-types for supported file types
    )

    # Configure the process request
    # `processor.name` is the full resource name of the processor, e.g.:
    # `projects/{project_id}/locations/{location}/processors/{processor_id}`
    request = documentai.ProcessRequest(name=processor.name, raw_document=raw_document)

    result = client.process_document(request=request)

    # For a full list of `Document` object attributes, reference this page:
    # https://cloud.google.com/document-ai/docs/reference/rest/v1/Document
    document = result.document

    # Read the text recognition output from the processor
    print("The document contains the following text:")
    print(document.text)

    # return document.text

def process_document_sample(
    project_id: str,
    location: str,
    processor_id: str,
    file_path: str,
    mime_type: str,
    field_mask: Optional[str] = None,
    processor_version_id: Optional[str] = None,
) -> None:
    # You must set the `api_endpoint` if you use a location other than "us".
    opts = ClientOptions(api_endpoint=f"{location}-documentai.googleapis.com")

    client = documentai.DocumentProcessorServiceClient(client_options=opts)

    if processor_version_id:
        # The full resource name of the processor version, e.g.:
        # `projects/{project_id}/locations/{location}/processors/{processor_id}/processorVersions/{processor_version_id}`
        name = client.processor_version_path(
            project_id, location, processor_id, processor_version_id
        )
    else:
        # The full resource name of the processor, e.g.:
        # `projects/{project_id}/locations/{location}/processors/{processor_id}`
        name = client.processor_path(project_id, location, processor_id)

    # Read the file into memory
    with open(file_path, "rb") as image:
        image_content = image.read()

    # Load binary data
    raw_document = documentai.RawDocument(content=image_content, mime_type=mime_type)

    # For more information: https://cloud.google.com/document-ai/docs/reference/rest/v1/ProcessOptions
    # Optional: Additional configurations for processing.
    process_options = documentai.ProcessOptions(
        # Process only specific pages
        # individual_page_selector=documentai.ProcessOptions.IndividualPageSelector(
        #     pages=[8] #HARD CODED
        # )
        fromStart=1
    )

    # Configure the process request
    request = documentai.ProcessRequest(
        name=name,
        raw_document=raw_document,
        field_mask=field_mask,
        process_options=process_options,
    )

    result = client.process_document(request=request)

    # For a full list of `Document` object attributes, reference this page:
    # https://cloud.google.com/document-ai/docs/reference/rest/v1/Document
    document = result.document

    # Read the text recognition output from the processor
    print("The document contains the following text:")
    print(document.text)

def store_images():
    pass

@app.route('/', methods=['POST'])
def upload_image():
    if 'pdf' not in request.files:
        return "No image part", 401
    file = request.files['pdf']
    if file.filename == '':
        return "No selected file", 400
    
    # Save or process the file
    file.save(f"./uploads/{file.filename}")
    file_b64 = pdf_to_base64(f"./uploads/{file.filename}")
    process_document(f"./uploads/{file.filename}")

    return "pdf uploaded successfully", 200

def process_document(filepath):
    process_document_sample(project_id, location, processor_id, filepath, mime_type, field_mask, processor_version_id)

def pdf_to_base64(file_path):
     # Open the PDF file in binary mode
    with open(file_path, "rb") as pdf_file:
        #read file's binary data
        pdf_binary = pdf_file.read()

        #Encode the binary data to base64
        pdf_b64 =  b64.b64encode(pdf_binary)

        #convert the bytes to a UTF-8 string
        pdf_b64_string = pdf_b64.decode("utf-8")

        return pdf_b64_string





if __name__ == '__main__':
    app.run(port=5000)


# @app.route('/add', methods=['POST'])
# def add_data():
#     data = {"id":"123dads","name": "Alice", "age": 35}
#     mongo.db.summary.insert_one(data)
#     return "Data added!"