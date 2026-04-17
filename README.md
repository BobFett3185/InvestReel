# RealInvest 🚀
**Social Feed Meets the Stock Market.**

RealInvest is a modern "Cyber Finance" social media application that merges the addictive experience of short-form scrolling with a high-stakes simulated economy. Users don't just consume content; they invest in it.

---

## 💎 How It Works

1.  **Scroll and Discover**: Browse an organic feed of short-form reels.
2.  **Invest Early**: Every video has a real-time market price based on popularity and investment history. Use your starting **$100.00** to buy shares in promising content.
3.  **Profit from Virality**: As videos gain traction and more users invest, the price goes up. Watch your portfolio value grow as you identify the next viral sensation.
4.  **Portfolio Management**: Track your total net worth, individual holdings, and profit margins on your personalized profile.

---

## 🛠 Features

-   **Cyber Finance Aesthetic**: High-contrast OLED black theme with Neon Mint accents.
-   **Live Market Engine**: Dynamic pricing logic backed by Supabase transactions.
-   **Onboarding Flow**: Multi-step introduction and personalization sequence for new users.
-   **Portfolio Tracking**: Real-time calculation of investment returns and available liquid capital.
-   **Native Video Hosting**: Persistent storage and delivery via Supabase Buckets.

---

## 🚀 Getting Started

### Prerequisites

-   **Node.js**: v18+
-   **Python**: v3.9+
-   **Supabase Account**: For database and storage.

### Environment Setup

1.  **Frontend**: Create `frontend/.env`
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
2.  **Backend**: Create `backend/.env`
    ```env
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_service_role_key
    ```

### Running Locally

1.  **Start the Backend (FastAPI)**:
    ```bash
    cd backend
    pip install -r requirements.txt
    python -m uvicorn main:app --reload --port 8080
    ```

2.  **Start the Frontend (React + Vite)**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

3.  **Database Migration**:
    Execute the scripts in `SQLScripts/` in your Supabase SQL Editor to set up the schema.

---

## 📂 Project Structure

-   `frontend/`: React application with vanilla CSS and Supabase client.
-   `backend/`: FastAPI server for auxiliary logic and metadata management.
-   `SQLScripts/`: Core database schema and market logic.
-   `reels/`: Sample media for testing.
-   `upload_reels.py`: Automation script to sync local reels with Supabase Storage.
