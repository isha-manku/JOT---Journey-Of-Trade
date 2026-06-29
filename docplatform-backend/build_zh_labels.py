import asyncio
import os
from deep_translator import GoogleTranslator
from app.utils.labels import LABELS_EN
import json

def translate_labels():
    translator = GoogleTranslator(source='en', target='zh-CN')
    labels_zh = {}
    print("Translating labels...")
    for k, v in LABELS_EN.items():
        try:
            zh = translator.translate(v)
            labels_zh[k] = f"{v} / {zh}"
        except Exception as e:
            print(f"Error on {k}: {e}")
            labels_zh[k] = f"{v} / {v}"
            
    with open("app/utils/labels.py", "a", encoding="utf-8") as f:
        f.write("\n\nLABELS_ZH = ")
        json.dump(labels_zh, f, ensure_ascii=False, indent=4)
        
    print("Done")

if __name__ == "__main__":
    translate_labels()
