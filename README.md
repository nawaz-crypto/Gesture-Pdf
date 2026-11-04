# Gesture-Pdf
Control pdf from gesture
# ✋ GesturePDF — Touchless Hand Gesture Controlled PDF Presenter

GesturePDF is a zero-latency, completely browser-based presentation assistant that enables users to navigate and control PDF decks touchlessly using real-time webcam computer vision. Built for presenters, educators, and professionals, the application removes physical interface constraints by processing complex multi-point anatomical configurations directly on the client side with strict privacy enforcement.

## 🚀 Live Application
Explore the production deployment: **[gesturepdf.vercel.app](https://vercel.app)**

---

## 🛠️ Core Technology Stack
* **Google MediaPipe Hands API:** Real-time 21 3D hand skeletal landmark tracking and matrix data stream extraction.
* **Mozilla PDF.js:** Robust client-side asynchronous PDF document parsing, structure mapping, and vector rasterization.
* **HTML5 Canvas 2D API:** High-fidelity coordinate rendering loop and frame update radar matrix.
* **Hardware Accelerated CSS3:** Smooth, native 60 FPS viewport manipulation utilizing GPU-driven 3D transforms (`scale`, `translate3d`).

---

## 📐 Mathematical Foundations & Gesture Logic
Rather than utilizing probabilistic machine learning classifiers which introduce processing latency and high false-positive rates, GesturePDF relies on precise deterministic spatial geometry and threshold mathematics:

* **Euclidean Distance Metrics:** Normalizes landmark coordinate data arrays dynamically against varying camera aspect ratios and physical distance zones.
* **Zoned Screen Partitioning:** Divides the canvas view limits, tracking specific single-shot click frames inside precise bounding boundaries (`DeadZone` thresholds) to completely prevent multi-page runaway flips during interactive speeches.
* **Exponential Moving Average (EMA):** Integrates noise filtering models (`α` smoothing coefficients) to completely suppress micro-jitters, hand tremors, and environmental sensor distortions without adding motion lag.

---

## 🎮 Interface Hand Configurations

### 📄 Navigation Controls
* **Move Canvas:** Display **one open palm (4 fingers up)**. The document canvas viewport will follow your hand coordinates seamlessly in all directions (left, right, up, down).
* **Scroll Document:** Display **two fingers (index + middle)** and translate them vertically to scroll smoothly down multi-page text blocks.
* **Turn Page Forward/Backward:** Perform a **thumb + index finger pinch ONLY**. Pinching within the right 24% boundary triggers the next page; pinching within the left 24% boundary triggers the previous page.
* **Dynamic Zooming:** Raise **both open palms** simultaneously. Moving your palms apart increases scale vectors smoothly, while drawing them closer together scales the document down.

### 🛡️ Safety System
* **Temporal Safety Lock:** Hold **ONLY your pinky finger up for 2.0 seconds** to trigger a complete system freeze. This toggles a temporary gesture lockout state, allowing presenters to talk freely with natural hand movements without triggering accidental slide interactions. Show only your pinky for 2.0 seconds again to unlock.

---

## 🔒 Privacy & Performance Architecture
* **100% Client-Side Processing:** All hand tracking and landmark calculations are executed entirely inside your local browser memory space. No video streams or tracking frames are ever uploaded to external servers.
* **Async Render Protection:** Implements promise-based rendering queues (`busy` and `again` operation flags) alongside pre-rasterized backing canvases, eliminating white layout flashes and screen freezing during rapid slide transitions.

---

## 👨‍💻 Developer Profile
Developed by **Nawaz Akram**  
Data Science & Computer Vision Postgraduate Student at Vellore Institute of Technology (VIT), Vellore.

* **LinkedIn:** [Nawaz Akram Profile](https://linkedin.com)
* **GitHub:** [@nawaz-crypto](https://github.com)
