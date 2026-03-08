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
    const { foodName, quantity, unit } = await req.json();

    if (!foodName) {
      return new Response(
        JSON.stringify({ error: "Food name is required" }),
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

    const systemPrompt = `You are a nutrition database. Given a food/dish/drink name with quantity and unit, return accurate estimated nutrition data.
IMPORTANT: Pay close attention to the unit. "pcs" means pieces/whole items (e.g. 1 pcs egg = 1 whole egg ≈ 50g, 1 pcs banana = 1 whole banana ≈ 120g). "cup" means a standard measuring cup (~240ml). Always calculate nutrition for the TOTAL amount specified.
You MUST respond with ONLY a valid JSON object, no other text. The JSON must have exactly these fields:
{
  "name": "recognized food name",
  "calories": number (total kcal for the given quantity),
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "fiber": number (grams),
  "servingDescription": "brief description like '1 whole egg (50g)' or '2 pieces (80g)'"
}
Be accurate. Use standard nutritional databases as reference. If the food is unknown, make your best estimate. Round to 1 decimal place for macros, whole numbers for calories.`;

    const unitLabel = unit === "pcs" ? "pieces/whole items" : unit || "";
    const userPrompt = `Food: "${foodName}", Quantity: ${quantity || "1"} ${unitLabel}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_nutrition",
              description: "Return nutrition data for the given food",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Recognized food name" },
                  calories: { type: "number", description: "Total kcal" },
                  protein: { type: "number", description: "Protein in grams" },
                  carbs: { type: "number", description: "Carbs in grams" },
                  fat: { type: "number", description: "Fat in grams" },
                  fiber: { type: "number", description: "Fiber in grams" },
                  servingDescription: { type: "string", description: "Brief serving description" },
                },
                required: ["name", "calories", "protein", "carbs", "fat", "fiber", "servingDescription"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_nutrition" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get nutrition data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseText = await response.text();
    if (!responseText) {
      console.error("AI gateway returned empty response");
      return new Response(
        JSON.stringify({ error: "AI returned empty response, please try again" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", responseText.slice(0, 200));
      return new Response(
        JSON.stringify({ error: "Invalid AI response, please try again" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const nutrition = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(nutrition), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const nutrition = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(nutrition), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Could not parse nutrition data" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("food-nutrition error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
