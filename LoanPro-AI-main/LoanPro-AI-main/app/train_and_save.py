import os
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier

def main():
    print("Loading data...")
    # Load dataset from the workspace root (one level up from app/)
    data_path = os.path.join("..", "loan_data.csv")
    if not os.path.exists(data_path):
        data_path = "loan_data.csv"  # Fallback to local if run from workspace root
        
    df = pd.read_csv(data_path)
    
    # 1. Fit Label Encoder on the entire purpose column (as done in the notebook)
    le = LabelEncoder()
    le.fit(df['purpose'])
    
    # 2. Separate features and target
    y = df["credit.policy"]
    X = df.drop(["credit.policy", "not.fully.paid"], axis=1)
    
    # 3. Train-test split (stratified, random state 42)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
    
    # 4. Apply Label Encoding to the 'purpose' column
    X_train_enc = X_train.copy()
    X_test_enc = X_test.copy()
    
    X_train_enc['purpose'] = le.transform(X_train_enc['purpose'])
    X_test_enc['purpose'] = le.transform(X_test_enc['purpose'])
    
    # 5. Fit and apply StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_enc)
    X_test_scaled = scaler.transform(X_test_enc)
    
    # 6. Apply SMOTE to handle imbalance
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train)
    
    # 7. Instantiate and train XGBoost with best hyperparameters
    best_params = {
        'subsample': 0.95,
        'scale_pos_weight': 1,
        'reg_lambda': 10,
        'reg_alpha': 5,
        'n_estimators': 100,
        'min_child_weight': 5,
        'max_depth': 4,
        'learning_rate': 0.15,
        'gamma': 0,
        'colsample_bytree': 0.85,
        'random_state': 42,
        'use_label_encoder': False,
        'eval_metric': 'logloss'
    }
    
    print("Training XGBoost Classifier...")
    model = XGBClassifier(**best_params)
    model.fit(X_train_resampled, y_train_resampled)
    
    # 8. Evaluate to confirm consistency
    y_test_pred = model.predict(X_test_scaled)
    test_accuracy = accuracy_score(y_test, y_test_pred)
    print(f"\nVerification - Tuned XGBoost Testing Accuracy: {test_accuracy:.4f}")
    print("Classification Report:\n", classification_report(y_test, y_test_pred))
    
    # Check if directory exists
    os.makedirs("model", exist_ok=True)
    
    # 9. Save artifacts
    print("Saving serialized model artifacts to app/model/...")
    with open(os.path.join("model", "model.pkl"), "wb") as f:
        pickle.dump(model, f)
    with open(os.path.join("model", "scaler.pkl"), "wb") as f:
        pickle.dump(scaler, f)
    with open(os.path.join("model", "le.pkl"), "wb") as f:
        pickle.dump(le, f)
        
    print("Successfully saved all model artifacts!")

if __name__ == "__main__":
    main()
