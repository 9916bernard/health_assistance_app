# 🩺 SymptomSense

**🔗 Try it out:** [https://symptomsense.vercel.app](https://symptomsense.vercel.app)
<img width="1710" alt="스크린샷 2025-03-31 오후 9 02 35" src="https://github.com/user-attachments/assets/5b3ee4b8-88d3-4e5d-8358-91496e2938f0" />
<img width="1710" alt="스크린샷 2025-03-31 오후 9 02 25" src="https://github.com/user-attachments/assets/87f20030-4504-441b-b126-5e7776f02496" />

SymptomSense is an AI-powered health assistant web app that helps users better understand their symptoms, check the severity of their condition, find safe medications, and locate nearby clinics—all in one place.

---

## 🌟 Features

- **Urgency Score** — Quickly evaluate how serious the symptoms might be.
- **Most Likely Condition** — Get a likely diagnosis using Gemini AI.
- **What You Can Do Now** — Get personalized advice for immediate care.
- **Recommended Clinic** — Suggested type of clinic or specialist to visit.
- **OTC Medication** — Safe medications you can buy without a prescription.
- **Nearby Hospitals** — Locate nearby healthcare facilities using Google Maps.
- **Chat History** — Store and revisit previous symptom inputs and AI responses (MongoDB).

---

## 🧠 How It Works

1. **Prompt Engineering**  
   We craft dynamic, role-specific prompts for Gemini API depending on the user's selected vocabulary level (easy or expert). The prompt includes a specific structure the model must follow for reliable JSON parsing and visualization.

2. **AI Model (Gemini API)**  
   We use [Google Gemini API](https://ai.google.dev/) to analyze user symptoms and return structured medical advice.


3. **OpenFDA API**  
   The app uses the [OpenFDA API](https://open.fda.gov/apis/) to cross-reference symptoms and return safe over-the-counter medication suggestions.

4. **Google Maps Integration**  
   - **Geocoding API**: Converts the user’s location into coordinates.
   - **Places API**: Finds nearby hospitals.
   - **Maps JavaScript API**: Visually displays healthcare providers on a map.

5. **MongoDB Integration**  
   All chat history, symptoms, and responses are stored securely using [MongoDB Atlas](https://www.mongodb.com/atlas/database). This enables:
   - Persistent chat history
   - Symptom trend tracking
   - Personalized user experiences

---

## 💻 Built With

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Gemini API](https://ai.google.dev/)
- [OpenFDA API](https://open.fda.gov/)
- [Google Maps API](https://developers.google.com/maps)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)


