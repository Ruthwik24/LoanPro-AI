# LoanPro AI - Credit Eligibility Evaluation & Underwriting System

An AI-powered Credit Eligibility Underwriting Dashboard serving a tuned **XGBoost Classifier** model. The application features a lightweight, production-ready **Flask API backend** and a futuristic, glassmorphic **fintech analytics dashboard** styled using a high-tech deep green and cream color scheme.

This repository is optimized for deployment on cloud platforms (Docker, Render, Railway, AWS, etc.) and is suitable as a final year college project or a portfolio showcase.

---

## 🎨 System Design & Aesthetics

- **Ambient Theme**: Glassmorphism with deep green forest colors (`#132a13`, `#31572c`, `#4f772d`, `#90a955`).
- **Telemetry Indicators**: Real-time display showing model specifications, verification accuracy (`98.61%`), ROC AUC (`0.9961`), and latency.
- **Score Analytics**: Circular score gauge prominently highlighted in cream (`#ecf39e`) presenting the model's eligibility confidence.
- **Semantic Indicators**: Red indicators are exclusively reserved for risk flags and rejections; green is used exclusively for approved outcomes.

---

## ⚙️ Project Architecture

```
app/
├── backend.py            # Production Flask server & prediction API
├── train_and_save.py     # ML pipeline script (SMOTE, Scaling, Tuned XGBoost fit)
├── Dockerfile            # Container definition for cloud hosting
├── .env.example          # Environment configuration template
├── requirements.txt      # Production dependencies (includes Gunicorn)
├── templates/
│   └── index.html        # Futuristic dashboard UI layout
└── static/
    ├── style.css         # Glassmorphic fintech stylesheet
    └── main.js           # Preset profile filler, float operations, and risk analytics
```

---

## 🚀 Setup & Local Running

### 1. Standard Installation
Ensure you have Python 3.10+ installed:

```bash
# Navigate to the app folder
cd app

# Install dependencies
pip install -r requirements.txt

# Fit the tuned model and serialize pipeline artifacts
python train_and_save.py

# Launch the development server
python backend.py
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

### 2. Running with Docker
Run the application inside a containerized setup:

```bash
# Build the Docker image
docker build -t loanpro-ai .

# Run the container
docker run -p 5000:5000 --env DEBUG=False loanpro-ai
```

---

## ☁️ Cloud Deployment Guides

### Option A: Render (Free Tier hosting)
1. Fork or push this project to a **GitHub repository**.
2. Go to [Render](https://render.com/) and create a new **Web Service**.
3. Link your GitHub repository.
4. Select **Docker** as the runtime environment.
5. In **Environment Variables**, add:
   - `PORT` = `10000` (or leave empty, Render binds dynamically)
   - `DEBUG` = `False`
6. Click **Deploy Web Service**. Render will build the container and serve it publicly.

### Option B: Railway (One-click hosting)
1. Link your GitHub repo to a new project on [Railway](https://railway.app/).
2. Railway will automatically detect the `Dockerfile` and deploy the service.
3. Under the service settings, click **Generate Domain** to get your live deployment link.

### Option C: Heroku
1. Install the Heroku CLI and login:
   ```bash
   heroku login
   heroku container:login
   ```
2. Create an app and push the container:
   ```bash
   heroku create loanpro-ai-underwriter
   heroku container:push web -a loanpro-ai-underwriter
   heroku container:release web -a loanpro-ai-underwriter
   ```

---

## 📊 Model Specifications

- **Algorithm**: XGBoost Classifier (`n_estimators=100`, `max_depth=4`, `learning_rate=0.15`, `subsample=0.95`, `reg_lambda=10`, `reg_alpha=5`, `gamma=0`, `colsample_bytree=0.85`)
- **Imbalance Mitigation**: Synthetic Minority Over-sampling Technique (SMOTE)
- **Data Scaling**: StandardScaler (fit on training data only)
- **Features Included**:
  - `purpose` (Categorical, encoded via LabelEncoder)
  - `int.rate` (Interest Rate)
  - `installment` (Monthly Payment)
  - `log.annual.inc` (Natural Log of Annual Income)
  - `dti` (Debt-to-Income Ratio)
  - `fico` (FICO Credit Score)
  - `days.with.cr.line` (Days with credit history, **fully float-validated**)
  - `revol.bal` (Revolving Credit Balance)
  - `revol.util` (Revolving Line Utilization %)
  - `inq.last.6mths` (Inquiries in last 6 months)
  - `delinq.2yrs` (Delinquencies in last 2 years)
  - `pub.rec` (Public Derogatory Records)
