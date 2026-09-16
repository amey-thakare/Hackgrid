import pandas as pd
import numpy as np
from typing import List, Tuple

def create_time_series_features(
    df: pd.DataFrame, 
    target_col: str, 
    lags: List[int] = [1, 2, 3],
    rolling_windows: List[int] = [3, 6]
) -> pd.DataFrame:
    """
    Creates modular time-series features for forecasting without leaking future information.
    Ensures all features rely only on past observations.
    """
    df_features = df.copy()
    
    # Lag features (previous-period values)
    for lag in lags:
        df_features[f'{target_col}_lag_{lag}'] = df_features[target_col].shift(lag)
        
    # Rolling window features (Mean, Std Dev/Volatility)
    for window in rolling_windows:
        df_features[f'{target_col}_rolling_mean_{window}'] = df_features[target_col].shift(1).rolling(window=window).mean()
        df_features[f'{target_col}_rolling_std_{window}'] = df_features[target_col].shift(1).rolling(window=window).std()
        
    # Recent percentage change (Lag 1 vs Lag 2)
    # Using shift(1) and shift(2) to prevent target leakage
    lag_1 = df_features[target_col].shift(1)
    lag_2 = df_features[target_col].shift(2)
    
    # Avoid division by zero
    df_features[f'{target_col}_pct_change_1'] = np.where(
        lag_2.abs() > 1e-5,
        (lag_1 - lag_2) / lag_2.abs(),
        0.0
    )
    
    # Trend/Slope over recent window (using simple linear regression over last 3 periods)
    # y = mx + c -> we just need m. We can approximate using finite differences if window is small,
    # or use a rolling apply. We'll use a fast vectorized approximation over the last 3 lags if available.
    lag_3 = df_features[target_col].shift(3)
    # rough slope = (lag_1 - lag_3) / 2
    df_features[f'{target_col}_trend_3'] = (lag_1 - lag_3) / 2.0
    
    return df_features

def prepare_training_data(
    df: pd.DataFrame, 
    target_col: str
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Generates features, drops rows with NaNs caused by lagging, 
    and returns X and y for model training.
    """
    features_df = create_time_series_features(df, target_col)
    
    # Drop rows that contain NaNs (due to shift/rolling)
    features_df = features_df.dropna()
    
    if features_df.empty:
        return pd.DataFrame(), pd.Series(dtype=float)
        
    y = features_df[target_col]
    X = features_df.drop(columns=[target_col])
    
    return X, y
