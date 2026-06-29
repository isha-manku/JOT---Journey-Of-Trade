from app.utils.labels import LABELS_EN

LABELS_ZH = {
    k: f"{v} / [Chinese translation for {v}]"
    for k, v in LABELS_EN.items()
}

# Wait, let me just add this to app/utils/labels.py
