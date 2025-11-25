import { OpenRouter } from "@openrouter/sdk";
import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const openRouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
  });

  try {
    const result = await openRouter.models.list();
    
    // The SDK likely returns the response body which has a 'data' property
    // matching the OpenRouter API response format: { data: [...] }
    const models = result.data || [];
    
    // Sort models by name
    const sortedModels = models.sort((a: any, b: any) => 
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({ models: sortedModels });
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}
