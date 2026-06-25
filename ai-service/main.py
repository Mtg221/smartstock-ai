from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SmartStock AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Schémas ─────────────────────────────────────────────────────────────────

class SalesDataItem(BaseModel):
    productId: str
    quantity: int
    product: Dict[str, Any]
    sale: Dict[str, Any]

class ForecastRequest(BaseModel):
    salesData: List[SalesDataItem]
    companyId: str

class ProductItem(BaseModel):
    id: str
    name: str
    quantity: int
    alertThreshold: int
    purchasePrice: float
    salePrice: float
    forecasts: List[Dict] = []

class RecommendRequest(BaseModel):
    products: List[ProductItem]

class MovementItem(BaseModel):
    productId: str
    type: str
    quantityChange: int
    movedAt: str
    product: Dict[str, Any]

class AnomalyRequest(BaseModel):
    movements: List[MovementItem]

class AnalyzeRequest(BaseModel):
    salesData: List[Dict]


# ─── Module 1 : Prévision des ruptures de stock ───────────────────────────────

@app.post("/forecast")
async def forecast_stockouts(request: ForecastRequest):
    """
    Prédit les ruptures de stock en utilisant Prophet (simplifié ici avec
    une heuristique robuste; en production, utiliser Prophet ou XGBoost).
    """
    try:
        if not request.salesData:
            return []

        df = pd.DataFrame([{
            "product_id": item.productId,
            "product_name": item.product.get("name", ""),
            "current_stock": item.product.get("quantity", 0),
            "alert_threshold": item.product.get("alertThreshold", 10),
            "quantity_sold": item.quantity,
            "sale_date": pd.to_datetime(item.sale.get("saleDate")),
        } for item in request.salesData])

        results = []

        for product_id, group in df.groupby("product_id"):
            group = group.sort_values("sale_date")
            product_name = group["product_name"].iloc[0]
            current_stock = group["current_stock"].iloc[0]
            alert_threshold = group["alert_threshold"].iloc[0]

            # Calcul ventes journalières moyennes (avec pondération récente)
            group["day"] = group["sale_date"].dt.date
            daily_sales = group.groupby("day")["quantity_sold"].sum()

            if len(daily_sales) == 0:
                continue

            # Pondération exponentielle — les ventes récentes comptent plus
            weights = np.exp(np.linspace(0, 1, len(daily_sales)))
            avg_daily_sales = float(np.average(daily_sales.values, weights=weights))

            # Détection saisonnalité weekend (simplifié)
            group["weekday"] = group["sale_date"].dt.dayofweek
            weekend_factor = 1.0
            if len(group) > 7:
                weekend_sales = group[group["weekday"].isin([5, 6])]["quantity_sold"].mean()
                weekday_sales = group[~group["weekday"].isin([5, 6])]["quantity_sold"].mean()
                if weekday_sales > 0:
                    weekend_factor = weekend_sales / weekday_sales

            # Tendance (régression linéaire simple)
            if len(daily_sales) > 3:
                x = np.arange(len(daily_sales))
                coeffs = np.polyfit(x, daily_sales.values, 1)
                trend_slope = coeffs[0]
                projected_daily = avg_daily_sales + trend_slope * 7
            else:
                projected_daily = avg_daily_sales

            projected_daily = max(projected_daily, 0.1)

            # Jours avant rupture estimée
            days_until_stockout = (current_stock - alert_threshold) / projected_daily
            days_until_stockout = max(0, int(days_until_stockout))

            # Niveau de risque
            if days_until_stockout <= 3:
                risk_level = "critical"
            elif days_until_stockout <= 7:
                risk_level = "high"
            elif days_until_stockout <= 14:
                risk_level = "medium"
            else:
                risk_level = "low"

            # Score de confiance basé sur la quantité de données
            confidence = min(len(daily_sales) / 30, 1.0)

            results.append({
                "productId": product_id,
                "productName": product_name,
                "currentStock": int(current_stock),
                "alertThreshold": int(alert_threshold),
                "avgDailySales": round(avg_daily_sales, 2),
                "predictedDemand": int(projected_daily * 30),
                "daysUntilStockout": days_until_stockout,
                "forecastDate": (datetime.now() + timedelta(days=days_until_stockout)).isoformat(),
                "riskLevel": risk_level,
                "confidenceScore": round(confidence, 4),
                "weekendFactor": round(weekend_factor, 2),
            })

        # Trier par criticité
        risk_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        results.sort(key=lambda x: risk_order.get(x["riskLevel"], 4))

        logger.info(f"Prévisions générées pour {len(results)} produits")
        return results

    except Exception as e:
        logger.error(f"Erreur forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Module 2 : Recommandations d'achat ──────────────────────────────────────

@app.post("/recommend")
async def purchase_recommendations(request: RecommendRequest):
    """
    Détermine la quantité optimale à commander pour chaque produit.
    Utilise la formule EOQ (Economic Order Quantity) + prévisions IA.
    """
    recommendations = []

    for product in request.products:
        forecast = product.forecasts[0] if product.forecasts else None
        predicted_demand_30d = forecast.get("predictedDemand", 0) if forecast else 0

        if predicted_demand_30d == 0:
            continue

        current_stock = product.quantity
        safety_stock = int(predicted_demand_30d * 0.2)  # 20% de tampon
        reorder_point = safety_stock + int(predicted_demand_30d * 0.5)  # Délai 15j

        if current_stock > reorder_point:
            continue

        # EOQ simplifié
        holding_cost_rate = 0.25  # 25% du prix d'achat par an
        order_cost = 5000  # FCFA coût fixe par commande
        annual_demand = predicted_demand_30d * 12

        if holding_cost_rate > 0 and product.purchasePrice > 0:
            eoq = np.sqrt((2 * annual_demand * order_cost) / (holding_cost_rate * float(product.purchasePrice)))
            recommended_qty = max(int(eoq), predicted_demand_30d - current_stock + safety_stock)
        else:
            recommended_qty = predicted_demand_30d - current_stock + safety_stock

        recommended_qty = max(recommended_qty, 1)
        total_cost = recommended_qty * float(product.purchasePrice)

        risk_level = forecast.get("riskLevel", "medium") if forecast else "medium"

        recommendations.append({
            "productId": product.id,
            "productName": product.name,
            "currentStock": current_stock,
            "predictedDemand30d": predicted_demand_30d,
            "safetyStock": safety_stock,
            "reorderPoint": reorder_point,
            "quantity": recommended_qty,
            "estimatedCost": round(total_cost, 2),
            "urgency": risk_level,
            "reasoning": (
                f"Stock actuel ({current_stock}) inférieur au point de réapprovisionnement "
                f"({reorder_point}). Demande prévue: {predicted_demand_30d} unités/30j. "
                f"Quantité EOQ: {recommended_qty} unités."
            ),
        })

    recommendations.sort(key=lambda x: {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(x["urgency"], 4))
    return recommendations


# ─── Module 3 : Analyse des tendances ────────────────────────────────────────

@app.post("/analyze")
async def analyze_trends(request: AnalyzeRequest):
    """Analyse les tendances de vente et génère des insights intelligents."""
    try:
        if not request.salesData:
            return {"insights": [], "summary": "Pas de données à analyser"}

        # Reconstituer DataFrame
        rows = []
        for sale in request.salesData:
            for item in sale.get("saleItems", []):
                category = item.get("product", {}).get("category", {})
                rows.append({
                    "sale_date": pd.to_datetime(sale.get("saleDate")),
                    "amount": float(sale.get("totalAmount", 0)),
                    "category_name": category.get("name", "Sans catégorie") if category else "Sans catégorie",
                    "quantity": item.get("quantity", 0),
                    "product_name": item.get("product", {}).get("name", ""),
                })

        df = pd.DataFrame(rows)
        if df.empty:
            return {"insights": [], "summary": "Aucune vente enregistrée"}

        df["week"] = df["sale_date"].dt.isocalendar().week
        df["month"] = df["sale_date"].dt.month
        df["weekday"] = df["sale_date"].dt.day_name()

        insights = []

        # Tendance par catégorie
        cat_sales = df.groupby("category_name")["quantity"].sum().sort_values(ascending=False)
        if len(cat_sales) > 0:
            top_cat = cat_sales.index[0]
            insights.append({
                "type": "top_category",
                "message": f"La catégorie «{top_cat}» est la plus vendue avec {int(cat_sales.iloc[0])} unités.",
                "recommendation": f"Assurez-vous de maintenir un stock suffisant pour «{top_cat}».",
                "impact": "high",
            })

        # Pic de ventes en fin de mois
        df["day_of_month"] = df["sale_date"].dt.day
        end_of_month = df[df["day_of_month"] >= 25]["quantity"].sum()
        start_of_month = df[df["day_of_month"] <= 10]["quantity"].sum()
        if start_of_month > 0:
            ratio = end_of_month / start_of_month
            if ratio > 1.3:
                insights.append({
                    "type": "end_of_month_peak",
                    "message": f"Les ventes en fin de mois sont {ratio:.0%} supérieures au début du mois.",
                    "recommendation": "Augmentez vos stocks de 20-30% avant le 20 de chaque mois.",
                    "impact": "medium",
                })

        # Tendance hebdomadaire
        weekday_sales = df.groupby("weekday")["quantity"].mean()
        if len(weekday_sales) > 0:
            best_day = weekday_sales.idxmax()
            insights.append({
                "type": "best_weekday",
                "message": f"Le {best_day} est le jour avec le plus de ventes en moyenne.",
                "recommendation": f"Assurez un stock optimal chaque {best_day}.",
                "impact": "low",
            })

        total_revenue = df["amount"].sum()
        total_items = df["quantity"].sum()

        return {
            "insights": insights,
            "summary": {
                "totalRevenue": round(total_revenue, 2),
                "totalItemsSold": int(total_items),
                "topCategory": cat_sales.index[0] if len(cat_sales) > 0 else None,
                "analyzedSales": len(request.salesData),
            }
        }

    except Exception as e:
        logger.error(f"Erreur analyze: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Module 4 : Détection d'anomalies ────────────────────────────────────────

@app.post("/anomalies")
async def detect_anomalies(request: AnomalyRequest):
    """Détecte les anomalies dans les mouvements de stock (IQR + Z-score)."""
    try:
        if not request.movements:
            return {"anomalies": [], "total": 0}

        df = pd.DataFrame([{
            "product_id": m.productId,
            "product_name": m.product.get("name", ""),
            "type": m.type,
            "quantity_change": abs(m.quantityChange),
            "moved_at": pd.to_datetime(m.movedAt),
        } for m in request.movements])

        anomalies = []

        for product_id, group in df.groupby("product_id"):
            product_name = group["product_name"].iloc[0]
            quantities = group["quantity_change"].values

            if len(quantities) < 3:
                continue

            # Z-score pour détecter les valeurs aberrantes
            mean = np.mean(quantities)
            std = np.std(quantities)
            if std == 0:
                continue

            z_scores = np.abs((quantities - mean) / std)
            anomaly_mask = z_scores > 2.5

            # IQR comme vérification supplémentaire
            q1, q3 = np.percentile(quantities, [25, 75])
            iqr = q3 - q1
            iqr_mask = (quantities < q1 - 1.5 * iqr) | (quantities > q3 + 1.5 * iqr)

            combined_mask = anomaly_mask | iqr_mask
            anomaly_rows = group[combined_mask]

            for _, row in anomaly_rows.iterrows():
                z = float(abs((row["quantity_change"] - mean) / std))
                severity = "critical" if z > 3.5 else "high" if z > 3 else "medium"
                anomalies.append({
                    "productId": product_id,
                    "productName": product_name,
                    "movementType": row["type"],
                    "quantity": int(row["quantity_change"]),
                    "averageQuantity": round(float(mean), 1),
                    "zScore": round(z, 2),
                    "severity": severity,
                    "detectedAt": row["moved_at"].isoformat(),
                    "message": (
                        f"Mouvement anormal détecté pour «{product_name}»: "
                        f"{int(row['quantity_change'])} unités (moyenne: {mean:.1f}, z-score: {z:.2f})"
                    ),
                })

        anomalies.sort(key=lambda x: {"critical": 0, "high": 1, "medium": 2}.get(x["severity"], 3))

        return {
            "anomalies": anomalies,
            "total": len(anomalies),
            "analyzedMovements": len(request.movements),
        }

    except Exception as e:
        logger.error(f"Erreur anomalies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "service": "SmartStock AI"}
