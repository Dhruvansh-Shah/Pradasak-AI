"""
PaddleOCR Engine Script (via RapidOCR / PaddleOCR ONNX Models)
Provides accurate deep learning text detection and recognition for government certificates.
Outputs JSON to stdout.
"""

import sys
import os
import json
import traceback

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def log(msg: str):
    print(f"[PaddleOCR] {msg}", file=sys.stderr)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path provided", "text": "", "lines": []}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"success": False, "error": f"Image file not found: {image_path}", "text": "", "lines": []}))
        sys.exit(1)

    try:
        from rapidocr_onnxruntime import RapidOCR
        
        # Initialize PaddleOCR engine with text angle/orientation classification
        engine = RapidOCR()
        
        # Run OCR
        result, elapse_list = engine(image_path)
        
        if not result:
            # If no text detected on initial pass, try with contrast or return empty
            print(json.dumps({
                "success": true,
                "text": "",
                "lines": [],
                "error": None
            }))
            return

        lines = []
        text_parts = []
        for item in result:
            # item format: [dt_boxes, rec_res, score]
            box = item[0]
            text = item[1]
            score = float(item[2]) if len(item) > 2 else 0.0
            
            lines.append({
                "text": text,
                "confidence": score,
                "box": box
            })
            text_parts.append(text)

        full_text = "\n".join(text_parts)
        
        response = {
            "success": True,
            "text": full_text,
            "lines": lines,
            "count": len(lines),
            "error": None
        }
        
        print(json.dumps(response, ensure_ascii=False))

    except Exception as e:
        log(f"Error executing PaddleOCR: {str(e)}\n{traceback.format_exc()}")
        print(json.dumps({
            "success": False,
            "error": str(e),
            "text": "",
            "lines": []
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
