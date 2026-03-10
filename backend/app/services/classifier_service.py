import joblib

model = joblib.load("ml/ticket_model.pkl")
vectorizer = joblib.load("ml/vectorizer.pkl")

def classify_ticket(text: str):

    X = vectorizer.transform([text])
    prediction = model.predict(X)[0]

    return prediction