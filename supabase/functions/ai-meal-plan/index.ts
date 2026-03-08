import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, calorieGoal, goal, macros, dietaryPreferences, planType, userDetails } = await req.json();

    if (!ingredients || !calorieGoal) {
      return new Response(
        JSON.stringify({ error: "Ingredients and calorie goal are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const goalDesc = goal === "lose" ? "weight loss (calorie deficit)" : goal === "gain" ? "muscle gain (calorie surplus)" : "weight maintenance";
    const macroDesc = macros ? `STRICT daily macro targets: Protein ${macros.protein}g, Carbs ${macros.carbs}g, Fat ${macros.fat}g, Fiber ${macros.fiber}g. Each day's meals MUST add up close to these targets.` : "";
    const dietDesc = dietaryPreferences ? `Dietary preferences: ${dietaryPreferences}.` : "";
    const userDesc = userDetails ? `User: ${userDetails.weight}kg, ${userDetails.height}cm, ${userDetails.age}y, ${userDetails.sex}, activity: ${userDetails.activityLevel}.` : "";
    const planTypeDesc = planType === "day-ideas"
      ? "Create varied daily meal IDEAS - each day should have completely different meals to give the user options and variety."
      : "Create a practical MEAL PREP plan - meals can repeat across days for efficiency, focus on batch cooking.";

    const systemPrompt = `You are an expert nutritionist and meal planner. Create a complete 7-day meal plan (Monday to Sunday). Each day MUST have Breakfast, Lunch, Snack, and Dinner.

CRITICAL RULES:
- STRICT daily calorie target: ${calorieGoal} kcal per day (±50 kcal tolerance)
- Goal: ${goalDesc}
${macroDesc}
${userDesc}
${dietDesc}
- ${planTypeDesc}
- Use primarily the ingredients provided, but you can suggest common pantry staples (oil, salt, spices, butter, etc.)
- EACH meal must have accurate calorie and macro breakdowns that ADD UP to the daily target
- Protein should be distributed across all meals, not loaded into one meal
- Include realistic portion sizes
- Make meals practical and easy to prepare
- For Indian foods, use authentic preparations and correct nutritional values
- Each meal item should list the specific food with portion (e.g. "2 boiled eggs", "1 cup cooked rice 200g", "grilled chicken breast 150g")`;

    const userPrompt = `Available ingredients/foods: ${ingredients}

Create my 7-day meal plan.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_meal_plan",
              description: "Return a structured 7-day meal plan",
              parameters: {
                type: "object",
                properties: {
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string", description: "Day name e.g. Monday" },
                        meals: {
                          type: "object",
                          properties: {
                            Breakfast: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  name: { type: "string" },
                                  calories: { type: "number" },
                                  protein: { type: "number" },
                                  carbs: { type: "number" },
                                  fat: { type: "number" },
                                },
                                required: ["name", "calories", "protein", "carbs", "fat"],
                                additionalProperties: false,
                              },
                            },
                            Lunch: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  name: { type: "string" },
                                  calories: { type: "number" },
                                  protein: { type: "number" },
                                  carbs: { type: "number" },
                                  fat: { type: "number" },
                                },
                                required: ["name", "calories", "protein", "carbs", "fat"],
                                additionalProperties: false,
                              },
                            },
                            Snack: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  name: { type: "string" },
                                  calories: { type: "number" },
                                  protein: { type: "number" },
                                  carbs: { type: "number" },
                                  fat: { type: "number" },
                                },
                                required: ["name", "calories", "protein", "carbs", "fat"],
                                additionalProperties: false,
                              },
                            },
                            Dinner: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  name: { type: "string" },
                                  calories: { type: "number" },
                                  protein: { type: "number" },
                                  carbs: { type: "number" },
                                  fat: { type: "number" },
                                },
                                required: ["name", "calories", "protein", "carbs", "fat"],
                                additionalProperties: false,
                              },
                            },
                          },
                          required: ["Breakfast", "Lunch", "Snack", "Dinner"],
                          additionalProperties: false,
                        },
                      },
                      required: ["day", "meals"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["days"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_meal_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate meal plan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseText = await response.text();
    if (!responseText) {
      return new Response(
        JSON.stringify({ error: "AI returned empty response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse AI response:", responseText.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "Invalid AI response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const args = typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
        return new Response(JSON.stringify(args), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        console.error("Failed to parse tool args:", e);
      }
    }

    // Fallback: try content
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch { /* fall through */ }
    }

    return new Response(
      JSON.stringify({ error: "Could not parse meal plan" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-meal-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
