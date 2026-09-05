"""
Robust QR Code Detection & Decoding for Government Certificate Images.

This script is called from Node.js via execFile. It takes a certificate image path
as input and outputs a JSON result with detected QR payloads.

Pipeline:
  Full certificate image
    -> Direct decode across multi-scale and preprocessed variants
    -> QR candidate localization (OpenCV QRCodeDetector + Contours + PyZbar if available)
    -> Direct decode using detected corner points (detector.decode / decodeCurved)
    -> Perspective correction with quiet zone padding (20%, 30%)
    -> Upscale small QR crops (300px - 600px)
    -> Multiple preprocessing variants (CLAHE, adaptive threshold, bilateral filter, sharpen)
    -> Multi-scale attempts (1.25x, 1.5x, 2.0x, 2.5x, 3.0x, 4.0x)
    -> Rotations (90, 180, 270)
    -> Output JSON with payloads and diagnostic metadata
"""

import sys
import json
import os
import cv2
import numpy as np

# pyzbar requires native zbar DLL which may not be available on all systems
PYZBAR_AVAILABLE = False
try:
    from pyzbar.pyzbar import decode as pyzbar_decode
    from pyzbar.pyzbar import ZBarSymbol
    PYZBAR_AVAILABLE = True
except (ImportError, FileNotFoundError, OSError):
    pass


def log(msg):
    """Print to stderr so it doesn't corrupt JSON stdout."""
    print(f"[QR] {msg}", file=sys.stderr)


def save_debug(name, img, debug_dir):
    """Save a debug image if debug_dir is set."""
    if debug_dir:
        p = os.path.join(debug_dir, name)
        cv2.imwrite(p, img)
        log(f"  Debug saved: {p}")


def order_points(pts):
    """Order 4 points as: top-left, top-right, bottom-right, bottom-left."""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def perspective_correct(img, corners, padding_ratio=0.20):
    """Warp a detected QR region to a square with quiet-zone padding."""
    try:
        ordered = order_points(corners)
        (tl, tr, br, bl) = ordered

        widthA = np.linalg.norm(br - bl)
        widthB = np.linalg.norm(tr - tl)
        side = int(max(widthA, widthB))

        heightA = np.linalg.norm(tr - br)
        heightB = np.linalg.norm(tl - bl)
        side = max(side, int(max(heightA, heightB)))

        if side < 10:
            return None

        dst = np.array([
            [0, 0],
            [side - 1, 0],
            [side - 1, side - 1],
            [0, side - 1]
        ], dtype="float32")

        M = cv2.getPerspectiveTransform(ordered, dst)
        warped = cv2.warpPerspective(img, M, (side, side))

        # Add quiet zone (clean white padding)
        pad = max(8, int(side * padding_ratio))
        padded = cv2.copyMakeBorder(warped, pad, pad, pad, pad,
                                    cv2.BORDER_CONSTANT, value=(255, 255, 255))
        return padded
    except Exception as e:
        log(f"Perspective transform error: {e}")
        return None


def crop_with_padding(img, bbox, padding_ratio=0.25):
    """Crop a bounding box from the image with extra padding for quiet zone."""
    h, w = img.shape[:2]
    x, y, bw, bh = bbox
    pad_x = max(10, int(bw * padding_ratio))
    pad_y = max(10, int(bh * padding_ratio))

    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(w, x + bw + pad_x)
    y2 = min(h, y + bh + pad_y)

    crop = img[y1:y2, x1:x2]
    if crop.size == 0:
        return None
    return crop


def upscale_if_small(img, min_side=350):
    """Upscale image if its smallest dimension is below min_side."""
    h, w = img.shape[:2]
    smallest = min(h, w)
    if 0 < smallest < min_side:
        scale = max(2, int(np.ceil(min_side / smallest)))
        img = cv2.resize(img, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)
    return img


def make_preprocessing_variants(img):
    """
    Generate multiple preprocessed variants of a QR crop/image.
    Each variant is a (name, image) tuple.
    """
    variants = []

    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()

    variants.append(("original", img))
    variants.append(("grayscale", gray))

    # CLAHE contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    variants.append(("clahe", enhanced))

    # Contrast stretched
    norm = cv2.normalize(gray, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
    variants.append(("norm", norm))

    # Bilateral filtered (preserves edges, smooths noise)
    bilateral = cv2.bilateralFilter(gray, 9, 75, 75)
    variants.append(("bilateral", bilateral))

    # Otsu threshold
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    variants.append(("otsu", otsu))

    # Adaptive threshold (Gaussian)
    adaptive = cv2.adaptiveThreshold(gray, 255,
                                      cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                      cv2.THRESH_BINARY, 11, 2)
    variants.append(("adaptive_thresh", adaptive))

    # Adaptive threshold on CLAHE
    adaptive_clahe = cv2.adaptiveThreshold(enhanced, 255,
                                            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                            cv2.THRESH_BINARY, 15, 3)
    variants.append(("adaptive_clahe", adaptive_clahe))

    # Sharpened
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharp = cv2.filter2D(gray, -1, kernel)
    variants.append(("sharpened", sharp))

    return variants


def try_decode_pyzbar(img):
    """Attempt QR decode using pyzbar. Returns list of decoded data strings."""
    if not PYZBAR_AVAILABLE:
        return []
    results = []
    try:
        decoded = pyzbar_decode(img, symbols=[ZBarSymbol.QRCODE])
        for obj in decoded:
            try:
                data = obj.data.decode('utf-8')
                if data and data not in results:
                    results.append(data)
            except Exception:
                pass
    except Exception:
        pass
    return results


def try_decode_opencv(img):
    """Attempt QR decode using OpenCV QRCodeDetector. Returns list of decoded data strings."""
    results = []
    detector = cv2.QRCodeDetector()

    # detectAndDecode
    try:
        data, bbox, _ = detector.detectAndDecode(img)
        if data:
            results.append(data)
            return results
    except Exception:
        pass

    # detectAndDecodeMulti
    try:
        retval, decoded_info, points, _ = detector.detectAndDecodeMulti(img)
        if retval and decoded_info:
            for d in decoded_info:
                if d and d not in results:
                    results.append(d)
    except Exception:
        pass

    return results


def try_decode_with_points(img, points):
    """Attempt to decode directly using already-detected corner points."""
    results = []
    detector = cv2.QRCodeDetector()
    try:
        data, straight = detector.decode(img, points)
        if data:
            results.append(data)
            return results
    except Exception:
        pass

    try:
        data, straight = detector.decodeCurved(img, points)
        if data:
            results.append(data)
    except Exception:
        pass

    return results


def try_all_decoders(img, name="", debug_dir=None):
    """Try pyzbar and OpenCV decoders on an image. Returns first successful results."""
    # 1. pyzbar (fast & robust when available)
    results = try_decode_pyzbar(img)
    if results:
        log(f"  pyzbar decoded [{name}]: {len(results)} payload(s)")
        return results

    # 2. OpenCV QRCodeDetector
    results = try_decode_opencv(img)
    if results:
        log(f"  OpenCV decoded [{name}]: {len(results)} payload(s)")
        return results

    return []


def find_contours_qr_candidates(gray):
    """Fallback: detect square-like contours that could be QR codes."""
    candidates = []
    h, w = gray.shape[:2]
    total_area = h * w

    # Edge detection
    edges = cv2.Canny(gray, 50, 200)
    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    for c in contours:
        area = cv2.contourArea(c)
        if area < 400 or area > total_area * 0.8:
            continue
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.04 * peri, True)
        if len(approx) == 4:
            x, y, bw, bh = cv2.boundingRect(approx)
            aspect_ratio = float(bw) / bh
            if 0.7 <= aspect_ratio <= 1.3:
                pts = approx.reshape(4, 2).astype("float32")
                candidates.append((pts, (x, y, bw, bh)))

    # Sort candidates by area descending
    candidates.sort(key=lambda item: item[1][2] * item[1][3], reverse=True)
    return candidates[:5]


def detect_qr_candidates(img, debug_dir=None):
    """
    Detect QR code candidates in the image.
    Returns list of (corners, bbox) tuples.
    """
    candidates = []

    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    # Method 1: pyzbar detection (returns polygon)
    if PYZBAR_AVAILABLE:
        try:
            decoded = pyzbar_decode(gray, symbols=[ZBarSymbol.QRCODE])
            for obj in decoded:
                if obj.polygon and len(obj.polygon) >= 4:
                    pts = np.array([[p.x, p.y] for p in obj.polygon[:4]], dtype="float32")
                    rect = obj.rect
                    candidates.append((pts, (rect.left, rect.top, rect.width, rect.height)))
        except Exception:
            pass

    # Method 2: OpenCV QRCodeDetector.detect()
    detector = cv2.QRCodeDetector()
    try:
        retval, points = detector.detect(gray)
        if retval and points is not None:
            pts = points[0].astype("float32")
            if len(pts) >= 4:
                x, y, w, h = cv2.boundingRect(pts.astype(int))
                candidates.append((pts[:4], (x, y, w, h)))
    except Exception:
        pass

    # Method 3: detectMulti
    try:
        retval, points = detector.detectMulti(gray)
        if retval and points is not None:
            for i in range(len(points)):
                pts = points[i].astype("float32")
                if len(pts) >= 4:
                    x, y, w, h = cv2.boundingRect(pts.astype(int))
                    candidates.append((pts[:4], (x, y, w, h)))
    except Exception:
        pass

    # Method 4: Contour-based quad detection fallback if nothing found
    if not candidates:
        contour_candidates = find_contours_qr_candidates(gray)
        candidates.extend(contour_candidates)

    return candidates


def find_qr(image_path, debug_dir=None):
    """
    Main QR detection pipeline.

    Strategy:
    1. Try direct decode on full image with multiple preprocessing variants
    2. Try direct decode on multiple scale factors of full image (especially 2x, 2.5x, 3x, 4x for low-res certs)
    3. Detect QR candidate regions, decode with direct points, perspective correction, crop, upscale
    4. Try rotated variants
    """
    img = cv2.imread(image_path)
    if img is None:
        return {"error": "Could not read image"}

    h, w = img.shape[:2]
    log(f"Image loaded: {w}x{h}")

    if debug_dir:
        os.makedirs(debug_dir, exist_ok=True)
        save_debug("00_original.jpg", img, debug_dir)

    all_urls = []
    diagnostic = {
        "image_width": w,
        "image_height": h,
        "phases_attempted": [],
        "candidates_found": 0,
        "decoder_used": None,
    }

    # ── PHASE 1: Direct decode on full image variants ──
    diagnostic["phases_attempted"].append("phase_1_full_image")
    log("Phase 1: Direct decode on full image")
    for name, variant in make_preprocessing_variants(img):
        results = try_all_decoders(variant, f"full_{name}", debug_dir)
        for r in results:
            if r not in all_urls:
                all_urls.append(r)
        if all_urls:
            log(f"Phase 1 success on {name}")
            diagnostic["decoder_used"] = f"phase_1_{name}"
            return {"success": True, "urls": all_urls, "phase": 1, "method": name, "diagnostic": diagnostic}

    # ── PHASE 2: Multi-scale full image attempts (CRITICAL for small/low-res certs) ──
    # Low-res certificate images (e.g. 287x386) need 2.5x, 3x, 4x scaling to resolve QR module grids
    diagnostic["phases_attempted"].append("phase_2_multiscale")
    log("Phase 2: Multi-scale full image attempts")
    for scale, interp, label in [
        (2.0, cv2.INTER_CUBIC, "2x_cubic"),
        (3.0, cv2.INTER_CUBIC, "3x_cubic"),
        (2.5, cv2.INTER_CUBIC, "2.5x_cubic"),
        (4.0, cv2.INTER_CUBIC, "4x_cubic"),
        (1.5, cv2.INTER_CUBIC, "1.5x_cubic"),
        (0.75, cv2.INTER_AREA, "0.75x_area"),
        (0.5, cv2.INTER_AREA, "0.5x_area"),
    ]:
        resized = cv2.resize(img, None, fx=scale, fy=scale, interpolation=interp)
        for vname, variant in [("orig", resized), ("clahe", cv2.createCLAHE(clipLimit=2.0).apply(cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)))]:
            results = try_all_decoders(variant, f"scale_{label}_{vname}")
            for r in results:
                if r not in all_urls:
                    all_urls.append(r)
            if all_urls:
                log(f"Phase 2 success on {label}_{vname}")
                diagnostic["decoder_used"] = f"scale_{label}_{vname}"
                return {"success": True, "urls": all_urls, "phase": 2, "method": f"{label}_{vname}", "diagnostic": diagnostic}

    # ── PHASE 3: Candidate detection + direct points decode + crop + perspective ──
    diagnostic["phases_attempted"].append("phase_3_candidates")
    log("Phase 3: Candidate detection + perspective correction + crop")
    candidates = detect_qr_candidates(img, debug_dir)

    # Also check candidates on CLAHE enhanced variant if none found
    if not candidates:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe_img = cv2.createCLAHE(clipLimit=2.5).apply(gray)
        candidates = detect_qr_candidates(clahe_img, debug_dir)

    diagnostic["candidates_found"] = len(candidates)
    log(f"  Found {len(candidates)} candidate(s)")

    for idx, (corners, bbox) in enumerate(candidates):
        log(f"  Candidate {idx}: bbox={bbox}")

        # Attempt A: Direct decode using the detected points on the full image
        results = try_decode_with_points(img, corners)
        for r in results:
            if r not in all_urls:
                all_urls.append(r)
        if all_urls:
            log(f"Phase 3 success (points decode) on candidate {idx}")
            diagnostic["decoder_used"] = f"points_cand_{idx}"
            return {"success": True, "urls": all_urls, "phase": 3, "method": f"points_cand_{idx}", "diagnostic": diagnostic}

        # Attempt B: Perspective correction with 20% and 30% padding
        for pad_ratio in [0.20, 0.30]:
            warped = perspective_correct(img, corners, padding_ratio=pad_ratio)
            if warped is not None:
                save_debug(f"02_warped_{idx}_p{int(pad_ratio*100)}.jpg", warped, debug_dir)
                warped = upscale_if_small(warped, 400)

                for vname, variant in make_preprocessing_variants(warped):
                    results = try_all_decoders(variant, f"warped_{idx}_{vname}")
                    for r in results:
                        if r not in all_urls:
                            all_urls.append(r)
                    if all_urls:
                        log(f"Phase 3 success (warped) on candidate {idx}, variant {vname}")
                        diagnostic["decoder_used"] = f"warped_{idx}_{vname}"
                        return {"success": True, "urls": all_urls, "phase": 3, "method": f"warped_{vname}", "diagnostic": diagnostic}

        # Attempt C: Simple crop with quiet zone padding + upscale
        for pad_ratio in [0.25, 0.40]:
            cropped = crop_with_padding(img, bbox, padding_ratio=pad_ratio)
            if cropped is not None:
                save_debug(f"04_crop_{idx}_p{int(pad_ratio*100)}.jpg", cropped, debug_dir)
                cropped = upscale_if_small(cropped, 400)

                for vname, variant in make_preprocessing_variants(cropped):
                    results = try_all_decoders(variant, f"crop_{idx}_{vname}")
                    for r in results:
                        if r not in all_urls:
                            all_urls.append(r)
                    if all_urls:
                        log(f"Phase 3 success (crop) on candidate {idx}, variant {vname}")
                        diagnostic["decoder_used"] = f"crop_{idx}_{vname}"
                        return {"success": True, "urls": all_urls, "phase": 3, "method": f"crop_{vname}", "diagnostic": diagnostic}

    # ── PHASE 4: Rotated variants ──
    diagnostic["phases_attempted"].append("phase_4_rotation")
    log("Phase 4: Rotation attempts")
    for angle in [90, 180, 270]:
        if angle == 90:
            rotated = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        elif angle == 180:
            rotated = cv2.rotate(img, cv2.ROTATE_180)
        else:
            rotated = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)

        results = try_all_decoders(rotated, f"rotated_{angle}")
        for r in results:
            if r not in all_urls:
                all_urls.append(r)
        if all_urls:
            log(f"Phase 4 success on rotation {angle}")
            diagnostic["decoder_used"] = f"rot_{angle}"
            return {"success": True, "urls": all_urls, "phase": 4, "method": f"rot_{angle}", "diagnostic": diagnostic}

    # ── Final Outcome ──
    qr_detected = len(candidates) > 0
    diagnostic["qr_detected"] = qr_detected

    if qr_detected:
        log("QR region detected but could not decode payload via Python")
        return {
            "success": False,
            "error": "QR detected but unreadable",
            "qr_detected": True,
            "diagnostic": diagnostic
        }
    else:
        log("No QR code found in image via Python")
        return {
            "success": False,
            "error": "QR not found",
            "qr_detected": False,
            "diagnostic": diagnostic
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    debug_dir = None
    if len(sys.argv) >= 3 and sys.argv[2] == "--debug":
        debug_dir = os.path.join(os.path.dirname(image_path), "qr_debug")

    result = find_qr(image_path, debug_dir)
    print(json.dumps(result))
