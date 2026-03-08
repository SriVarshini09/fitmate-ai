import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fallback table (kcal, protein, carbs, fat, fiber) per 100g for common foods
const FALLBACK: Record<string, [number, number, number, number, number]> = {
  "rice": [130, 2.7, 28, 0.3, 0.4],
  "white rice": [130, 2.7, 28, 0.3, 0.4],
  "brown rice": [123, 2.6, 26, 1.0, 1.8],
  "ragi": [336, 7.3, 72, 1.9, 3.6],
  "ragi malt": [330, 7.0, 71, 1.8, 3.5],
  "oats": [389, 17, 66, 7, 10.6],
  "egg": [155, 13, 1.1, 11, 0],
  "chicken breast": [165, 31, 0, 3.6, 0],
  "banana": [89, 1.1, 23, 0.3, 2.6],
  "apple": [52, 0.3, 14, 0.2, 2.4],
  "milk": [61, 3.2, 4.8, 3.3, 0],
  "bread": [265, 9, 49, 3.2, 2.7],
  "potato": [77, 2, 17, 0.1, 2.2],
  "dal": [116, 9, 20, 0.4, 7.9],
  "lentils": [116, 9, 20, 0.4, 7.9],
  "chapati": [297, 9.2, 55, 3.9, 4.6],
  "roti": [297, 9.2, 55, 3.9, 4.6],
  "idli": [58, 2, 11.5, 0.4, 0.5],
  "dosa": [168, 3.5, 28, 5, 0.8],
  "sambar": [56, 3.5, 8, 1.5, 2.5],
  "paneer": [265, 18, 3.4, 20, 0],
  "curd": [98, 3.5, 3.4, 4.3, 0],
  "yogurt": [98, 3.5, 3.4, 4.3, 0],
  "almonds": [579, 21, 22, 50, 12.5],
  "peanut butter": [588, 25, 20, 50, 6],
  "pasta": [158, 5.8, 31, 0.9, 1.8],
  "salmon": [208, 20, 0, 13, 0],
  "tuna": [132, 29, 0, 1, 0],
  "broccoli": [34, 2.8, 7, 0.4, 2.6],
  "spinach": [23, 2.9, 3.6, 0.4, 2.2],
  "orange": [47, 0.9, 12, 0.1, 2.4],
  "mango": [60, 0.8, 15, 0.4, 1.6],
  "coffee": [2, 0.3, 0, 0, 0],
  "tea": [1, 0, 0.2, 0, 0],
};

// Convert unit+quantity to grams
function toGrams(qty: number, unit: string): number {
  switch (unit) {
    case "g": return qty;
    case "ml": return qty;
    case "L": return qty * 1000;
    case "cup": return qty * 240;
    case "tbsp": return qty * 15;
    case "tsp": return qty * 5;
    case "pcs": return qty * 100; // ~100g per piece as rough default
    default: return qty;
  }
}

function scale(per100: [number, number, number, number, number], grams: number) {
  const f = grams / 100;
  return {
    calories: Math.round(per100[0] * f),
    protein: Math.round(per100[1] * f * 10) / 10,
    carbs: Math.round(per100[2] * f * 10) / 10,
    fat: Math.round(per100[3] * f * 10) / 10,
    fiber: Math.round(per100[4] * f * 10) / 10,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { foodName, quantity, unit } = await req.json();

    if (!foodName) {
      return new Response(
        JSON.stringify({ error: "Food name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const qty = parseFloat(quantity) || 100;
    const unitStr = unit || "g";
    const grams = toGrams(qty, unitStr);
    const searchName = foodName.trim().toLowerCase();

    // 1. Try Open Food Facts search
    try {
      const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchName)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,nutriments`;
      const offRes = await fetch(searchUrl, {
        headers: { "User-Agent": "Cals Crumble Fit-App/1.0" },
      });

      if (offRes.ok) {
        const offData = await offRes.json();
        const products = offData.products || [];

        for (const product of products) {
          const n = product.nutriments;
          if (!n) continue;
          const cal = n["energy-kcal_100g"] ?? n["energy-kcal"] ?? null;
          if (cal == null || cal === 0) continue;

          const per100g = grams;
          const f = per100g / 100;

          const result = {
            name: product.product_name || foodName,
            calories: Math.round((cal ?? 0) * f),
            protein: Math.round((n["proteins_100g"] ?? 0) * f * 10) / 10,
            carbs: Math.round((n["carbohydrates_100g"] ?? 0) * f * 10) / 10,
            fat: Math.round((n["fat_100g"] ?? 0) * f * 10) / 10,
            fiber: Math.round((n["fiber_100g"] ?? 0) * f * 10) / 10,
            servingDescription: `${qty}${unitStr} (≈${Math.round(grams)}g)`,
          };

          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } catch (offErr) {
      console.warn("Open Food Facts failed:", offErr);
    }

    // 2. Fallback: built-in table — try exact match, then partial
    let match = FALLBACK[searchName];
    if (!match) {
      const key = Object.keys(FALLBACK).find(k => searchName.includes(k) || k.includes(searchName));
      if (key) match = FALLBACK[key];
    }

    if (match) {
      const macros = scale(match, grams);
      return new Response(
        JSON.stringify({
          name: foodName,
          ...macros,
          servingDescription: `${qty}${unitStr} (≈${Math.round(grams)}g) — estimated`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Last resort: generic 2 kcal/g estimate
    const genericCal = Math.round(grams * 2);
    return new Response(
      JSON.stringify({
        name: foodName,
        calories: genericCal,
        protein: Math.round(grams * 0.05 * 10) / 10,
        carbs: Math.round(grams * 0.25 * 10) / 10,
        fat: Math.round(grams * 0.05 * 10) / 10,
        fiber: 0,
        servingDescription: `${qty}${unitStr} — rough estimate`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("food-nutrition error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
