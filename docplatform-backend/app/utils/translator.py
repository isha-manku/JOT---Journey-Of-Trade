import re
from deep_translator import GoogleTranslator

# Provider wrapper as requested
class TranslationProvider:
    def __init__(self, source='en', target='zh-CN'):
        self.translator = GoogleTranslator(source=source, target=target)

    def translate(self, text: str) -> str:
        try:
            return self.translator.translate(text)
        except Exception:
            return text

translator_provider = TranslationProvider()

def should_translate(value: str) -> bool:
    if not isinstance(value, str):
        return False
    value = value.strip()
    if not value:
        return False

    # Regex patterns for non-translatable text
    patterns = [
        r'^\d+$', # Pure numeric values
        r'^[\d\s\-\+\(\)]+$', # Phone numbers (basic)
        r'^[\w\.-]+@[\w\.-]+\.\w+$', # Emails
        r'^(http|https|ftp)://[^\s/$.?#].[^\s]*$', # URLs
        r'^www\.[^\s/$.?#].[^\s]*$', # URLs
        r'^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$', # IBAN (basic)
        r'^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$', # SWIFT (basic)
        r'^\d{2,4}[-/]\d{2}[-/]\d{2,4}$', # Dates (YYYY-MM-DD or MM/DD/YYYY)
        r'^[A-Z0-9-]+$', # IDs, Reference numbers, Account numbers
        r'^[\d,\.]+$', # Numeric with commas/decimals
    ]
    for pattern in patterns:
        if re.match(pattern, value, re.IGNORECASE):
            return False
    return True

def translate_context(context: dict) -> dict:
    """Translates document content in memory to bilingual (English / Chinese).
    
    Batches all translatable strings into a single API call to minimize latency.
    """
    # Collect all translatable keys and values
    translatable_keys = []
    translatable_values = []
    for key, value in context.items():
        if isinstance(value, str) and should_translate(value):
            translatable_keys.append(key)
            translatable_values.append(value)

    # Batch translate in one API call using a separator
    translated_map = {}
    if translatable_values:
        separator = " ||| "
        combined = separator.join(translatable_values)
        try:
            translated_combined = translator_provider.translate(combined)
            translated_parts = translated_combined.split("|||")
            # Trim whitespace from each part
            translated_parts = [p.strip() for p in translated_parts]
            if len(translated_parts) == len(translatable_values):
                for key, orig, zh in zip(translatable_keys, translatable_values, translated_parts):
                    translated_map[key] = zh
            else:
                # Fallback: translate individually if split count doesn't match
                for key, value in zip(translatable_keys, translatable_values):
                    zh_text = translator_provider.translate(value)
                    translated_map[key] = zh_text if zh_text else value
        except Exception:
            # Fallback: translate individually
            for key, value in zip(translatable_keys, translatable_values):
                zh_text = translator_provider.translate(value)
                translated_map[key] = zh_text if zh_text else value

    # Build bilingual context
    bilingual_context = {}
    for key, value in context.items():
        if key in translated_map:
            zh_text = translated_map[key]
            if zh_text and zh_text.strip().lower() != value.strip().lower():
                bilingual_context[key] = f"{value} / {zh_text}"
            else:
                bilingual_context[key] = value
        else:
            bilingual_context[key] = value
    return bilingual_context
