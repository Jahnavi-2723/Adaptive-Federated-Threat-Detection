import shap
import numpy as np

def explain_prediction(model, sample):
    explainer = shap.GradientExplainer(model, np.expand_dims(sample, 0))
    shap_values = explainer.shap_values(np.expand_dims(sample, 0))
    shap.image_plot(shap_values, np.expand_dims(sample, 0))
