# 🌦️ Weatherly — Advanced Weather Application (React Native + Expo)

**Developer:** Bliss Singhal  
**Stack:** React Native (Expo) · Google Maps API · Supabase/Firebase (for CRUD) · JavaScript/TypeScript  
**Purpose:** Technical Assessment 2 — Advanced Weather App with API + Database CRUD functionality

---

## 🧭 Table of Contents

- [Project Overview](#project-overview)
- [Objectives](#objectives)
- [Features Implemented](#features-implemented)
- [Technical Architecture](#technical-architecture)
- [Weather API Integration](#weather-api-integration)
- [Database & CRUD Functionality](#database--crud-functionality)
- [Screens & User Flow](#screens--user-flow)
- [Error Handling & Validation](#error-handling--validation)
- [Additional Integrations (Optional API Features)](#additional-integrations-optional-api-features)
- [OpenAI Chatbot Attempt](#openai-chatbot-attempt)
- [Setup & Installation](#setup--installation)
- [Future Enhancements](#future-enhancements)
- [Project Learnings](#project-learnings)
- [License](#license)

---

## 🌍 Project Overview

**Weatherly** is a full-featured **React Native (Expo)** weather application designed to demonstrate technical ability in API integration, data persistence, and CRUD operations.  

It retrieves **live weather information** for any user-specified location and includes a **database layer** where users can **create**, **read**, **update**, and **delete** stored weather records — showcasing strong understanding of backend integration in a mobile app.

This project satisfies both parts of the assignment:
- **Tech Assessment 1 (Weather App Basics)**  
- **Tech Assessment 2 (Advanced CRUD + Persistence + API Integrations)**

---

## 🎯 Objectives

| Requirement | Implementation Summary |
|--------------|-------------------------|
| **User can enter a location** (Zip, City, Landmark, etc.) | Implemented via a universal text search bar that accepts any user string; fuzzy search handled by API response parsing |
| **Show current weather with details** | Displays temperature, description, wind speed, humidity, visibility, and condition icons |
| **Include a 5-day forecast** | Uses OpenWeatherMap’s `/forecast` endpoint |
| **Support current GPS location** | Integrated `expo-location` to fetch coordinates |
| **Store & manipulate weather data in a database** | Implemented CRUD operations (Create, Read, Update, Delete) via Supabase/Firebase |
| **Perform validations** | Input validation for location, date ranges, and data coherence |
| **Optional APIs for creativity** | Hooks for integrating Google Maps, YouTube, and OpenAI (see below) |
| **Good code structure & error handling** | Modular, reusable, and error-resilient architecture |

---

## 🌟 Features Implemented

### 🔍 1. Location Search
- Accepts multiple formats: **City name, Zip Code, Landmark, or Coordinates.**
- Uses a **geocoding API** to normalize inputs.
- Displays location name and weather summary.

### 🗺️ 2. Current Location Weather
- Uses **Expo Location** to fetch GPS coordinates.
- Auto-fetches weather when the user opens the app.
- Allows manual refresh to update based on position.

### ☀️ 3. Real-Time Weather & Forecast
- Displays:
  - Current temperature, feels-like, humidity, wind, pressure.
  - Weather icon and human-readable description.
- Includes a **5-day forecast** (time-based cards using horizontal scroll).

### 💾 4. Database Persistence (CRUD)
The app integrates a **database layer** that allows full data lifecycle management:
- **Create:** Save weather details for a chosen location and date range.  
- **Read:** Retrieve any stored records (user’s or global).  
- **Update:** Edit existing entries — e.g., change a date range or temperature record.  
- **Delete:** Remove weather records from the database.

All operations are validated and displayed in a list view with immediate feedback.

### 🧭 5. Validations
- Date range validation (start date < end date).
- Location existence check (via geocoding lookup).
- Prevents incomplete entries (e.g., missing city or invalid input).

### 🧩 6. Modular Code Architecture
- **Services layer:** for weather and database API abstraction.
- **Reusable components:** WeatherCard, ForecastList, CRUDModal.
- **Context API:** for global state management.
- **Error boundaries:** for catching network or permission issues gracefully.

---

🗄️ Database & CRUD Functionality

Database: Supabase (PostgreSQL) or Firebase Firestore
Goal: Persist user-generated weather data and allow full lifecycle management.

Schema Example (Supabase)
Field	Type	Description
id	uuid	Primary key
location	text	User-entered location
date_start	date	Start of range
date_end	date	End of range
temperature	numeric	Recorded/queried temp
weather_desc	text	e.g. “Rainy”, “Sunny”
created_at	timestamp	Auto-generated
CRUD Breakdown
✅ CREATE

User inputs a location + date range.

Validates both fields.

Fetches temperature from API and stores in DB.

📖 READ

Displays list of previously stored records.

Includes sorting/filtering by date or location.

✏️ UPDATE

Editable fields: location, date range, notes.

Validates all new data before commit.

🗑️ DELETE

User can delete any record with a single tap.

Updates the UI and database instantly.

⚠️ Error Handling & Validation
Case	Handling

Invalid Location	Displays “Could not find this place.”

Empty Input	Disabled submit button + inline warning

Invalid Date Range	“End date must be after start date.”

API Failure	Graceful fallback message with retry button

GPS Denied	Prompt to enable permissions with instructions


🌐 Additional Integrations (Optional API Features)


🤖 OpenAI Chatbot Attempt

As an advanced extension, I attempted to integrate OpenAI’s ChatGPT API to enable:

Conversational data creation (“Add a record for London this week.”)

Smart queries (“Show me all my coldest entries.”)

Outcome:

Successfully set up prompt → response handling.

Hit a billing/credits limitation, so calls were disabled for now.

The architecture remains in place (services/openAIChatAPI.js) for easy activation later.

⚙️ Setup & Installation
1️⃣ Clone the repo
git clone https://github.com/<BlissSinghal>/weatherlyApp.git
cd weatherly

2️⃣ Install dependencies
npm install

3️⃣ Add environment variables

Create a .env file:

WEATHER_API_KEY=your_openweather_api_key
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=(optional)

4️⃣ Run the app
npx expo start


Scan the QR code to launch on your device.

🚀 Future Enhancements

✅ Reactivate OpenAI chatbot when API credits available.

🌦️ Add radar and precipitation map overlays.

🗣️ Voice-based input for “What’s the weather in Paris?”

🧩 Add multi-user support with authentication.

📊 Include analytics on stored weather patterns.

🕶️ Implement dark/light mode.

🧠 Project Learnings

This project taught me:

How to structure a multi-screen React Native app with strong modularization.

How to integrate third-party APIs and manage asynchronous data flows.

The importance of input validation and error resilience.

Building CRUD logic cleanly between frontend and cloud database.

Handling API authentication and key management securely.

Attempting AI API integrations (OpenAI) and handling billing/authorization errors gracefully.

🪪 License

MIT License — free to use, learn, and extend.

👨‍💻 Author

Bliss Singhal
📧 bsinghal@seas.upenn.edu


“I focused on reliability, correctness, and real-time data integrity rather than visuals — per the brief. But the architecture is ready for a designer to make it beautiful.”

Built with ❤️ using React Native, Expo, OpenWeatherMap, and Supabase.

