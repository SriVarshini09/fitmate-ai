import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build personalized system prompt with user data
    let personalInfo = "";
    if (userContext) {
      const parts: string[] = [];
      if (userContext.name) parts.push(`Name: ${userContext.name}`);
      if (userContext.age) parts.push(`Age: ${userContext.age}`);
      if (userContext.sex) parts.push(`Sex: ${userContext.sex}`);
      if (userContext.weight) parts.push(`Current weight: ${userContext.weight} kg`);
      if (userContext.height) parts.push(`Height: ${userContext.height} cm`);
      if (userContext.goalWeight) parts.push(`Goal weight: ${userContext.goalWeight} kg`);
      if (userContext.goal) parts.push(`Goal: ${userContext.goal}`);
      if (userContext.activityLevel) parts.push(`Activity level: ${userContext.activityLevel}`);
      if (userContext.tdee) parts.push(`TDEE: ${userContext.tdee} kcal/day`);
      if (userContext.targetCalories) parts.push(`Daily calorie target: ${userContext.targetCalories} kcal`);
      if (userContext.macros) {
        parts.push(`Daily macros — Protein: ${userContext.macros.protein}g, Carbs: ${userContext.macros.carbs}g, Fat: ${userContext.macros.fat}g`);
      }
      if (userContext.eatingHabit) parts.push(`Eating habit: ${userContext.eatingHabit}`);
      if (userContext.exerciseFrequency) parts.push(`Exercise frequency: ${userContext.exerciseFrequency}`);
      if (userContext.todayCaloriesEaten !== undefined) parts.push(`Calories eaten today: ${userContext.todayCaloriesEaten} kcal`);
      if (userContext.todayCaloriesBurned !== undefined) parts.push(`Calories burned today: ${userContext.todayCaloriesBurned} kcal`);

      if (parts.length > 0) {
        personalInfo = `\n\n## User Profile (use this to personalize your advice — DO NOT ask for this info again):\n${parts.join("\n")}`;
      }
    }

    const systemPrompt = `You are Cals Crumble Fit AI Coach — a friendly, knowledgeable fitness and nutrition assistant. You help users with:
- Calorie counting and macro calculations
- Workout recommendations and exercise form
- Meal planning and healthy recipes
- Weight loss/gain strategies
- General fitness and wellness advice

Keep responses concise, actionable, and encouraging. Use markdown formatting for lists and emphasis. Add relevant emojis sparingly. If asked about medical conditions, recommend consulting a healthcare professional.

IMPORTANT: You already know the user's profile details below. Use them to give personalized advice. Never ask the user for information you already have.${personalInfo}`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});