import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

data = {
"text":[
"vpn not working",
"internet slow",
"wifi not connecting",
"laptop overheating",
"system not booting",
"outlook crashing",
"software installation issue",
"need access to database",
"printer not working",
"email not sending",
"vpn connection failed",
"keyboard not working",
"need system access"
],

"label":[
"network",
"network",
"network",
"hardware",
"hardware",
"software",
"software",
"access",
"hardware",
"software",
"network",
"hardware",
"access"
]
}
df = pd.DataFrame(data)

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df["text"])

model = LogisticRegression()
model.fit(X, df["label"])

joblib.dump(model,"ticket_model.pkl")
joblib.dump(vectorizer,"vectorizer.pkl")

print("Model trained successfully")