   # app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import BertTokenizerFast
import lightgbm as lgb
import numpy as np
import re
from bert_classifier import load_model

# Load the tokenizer
tokenizer = BertTokenizerFast.from_pretrained('bert-base-uncased')

# Load BERT model
model = load_model('bert_cls3.pth')

# Load LGBM model
lgbm_model = lgb.Booster(model_file='optimized_lightgbm.txt')

# FastAPI app
app = FastAPI()
app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allows all origins, change this to specific domains in production
        allow_credentials=True,
        allow_methods=["*"],  # Allows all methods, adjust as needed
        allow_headers=["*"],  # Allows all headers, adjust as needed
    )
# Define the request model
class NewsItem(BaseModel):
 title: str
 text: str

def preprocess_input(text: str) -> str:
 # Preprocess function as defined earlier
 text = re.sub(r'http\S+', '', text)
 text = re.sub(r'[^a-zA-Z\s@#0-9]', '', text)  
 return text.strip()

def extract_embeddings(text: str):
 inputs = tokenizer(text, return_tensors='pt', truncation=True, padding='max_length', max_length=128)
 with torch.no_grad():
  outputs = model(**inputs)
  cls_embeddings = outputs['embeddings'].cpu().numpy().astype(np.float32)
 return cls_embeddings

@app.post("/predict")
async def predict(news_item: NewsItem):
    input_text = preprocess_input(news_item.title + " " + news_item.text)
    if len(input_text.split()) < 10:
        raise HTTPException(status_code=400, detail="Text is too short for prediction")
    
    embeddings = extract_embeddings(input_text)
    proba = float(lgbm_model.predict(embeddings))  # type: ignore # Ensure it's a float, not numpy array
    prediction = "Fake" if proba > 0.5 else "Real"
    confidence = int(proba * 100) if proba > 0.5 else int((1 - proba) * 100)
    
    return {
        "prediction": prediction,
        "confidence": confidence
    }