'use server';

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/utils/supabase/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function improveRequestDescription(originalDescription: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return originalDescription;
  }

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      system: "You are an expert procurement officer. Rewrite the user's request description to be highly professional, structured, and clear for vendors to bid on. Keep it concise. Return ONLY the improved description text.",
      messages: [
        { role: "user", content: originalDescription }
      ]
    });
    
    return msg.content[0].type === 'text' ? msg.content[0].text : originalDescription;
  } catch (error) {
    console.error("AI Improvement Error:", error);
    return originalDescription;
  }
}

export async function scoreBid(bidId: string, requestDescription: string, bidMessage: string, bidPrice: number, requestBudget: number) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return;
  }

  try {
    const prompt = `
Request Budget: $${requestBudget}
Request Details: ${requestDescription}

Seller Bid Price: $${bidPrice}
Seller Bid Message: ${bidMessage}

Analyze this bid against the request.
1. Is it a spam/fraudulent bid? (flagged: true/false)
2. Score the bid from 1.0 to 10.0 based on relevance, price competitiveness, and professionalism.
3. Provide a short 1-sentence reason for the score.

Respond ONLY in valid JSON format:
{
  "score": 8.5,
  "flagged": false,
  "reason": "The seller provides a relevant timeline and price is within budget."
}`;

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const responseText = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;
    
    const result = JSON.parse(jsonMatch[0]);
    
    const supabase = await createClient();
    await supabase.from('bids').update({
      ai_score: result.score,
      ai_reason: result.reason,
      flagged: result.flagged
    }).eq('id', bidId);

  } catch (error) {
    console.error("AI Scoring Error:", error);
  }
}

export async function suggestPriceRange(category: string, title: string, description: string) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const prompt = `
Category: ${category}
Title: ${title}
Details: ${description}

Analyze this project request and suggest a fair market price range for the buyer to expect.
Respond ONLY in valid JSON format:
{
  "min": 100,
  "max": 500,
  "reasoning": "Standard rate for a typical 5-page small business website."
}`;

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }]
    });

    const responseText = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("AI Price Suggestion Error:", err);
    return null;
  }
}

export async function getSellerTrustScore(sellerId: string) {
  if (!process.env.ANTHROPIC_API_KEY) return { score: 75, reason: "Default score for new users." };
  
  try {
    const supabase = await createClient();
    // In a real scenario, fetch completed transactions, dispute counts, response times
    const { data: bids } = await supabase.from('bids').select('status, ai_score, created_at').eq('seller_id', sellerId);
    
    let totalBids = bids?.length || 0;
    let acceptedBids = bids?.filter(b => b.status === 'accepted')?.length || 0;

    const prompt = `
Seller Metrics:
Total Bids Submitted: ${totalBids}
Bids Accepted: ${acceptedBids}
Average Smart Assistant Quality Score of their bids: ${bids ? (bids.reduce((acc, b) => acc + (b.ai_score||0), 0) / (totalBids||1)).toFixed(1) : 'N/A'}

Calculate a seller trust score out of 100.
Rule: New sellers start around 75. High acceptance rate pushing 100. Low quality pushes down.
Respond ONLY in JSON format:
{
  "score": 85,
  "reason": "Seller has a solid history of accepted bids."
}`;

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }]
    });

    const responseText = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { score: 75, reason: "Error parsing AI response" };
    return JSON.parse(jsonMatch[0]);

  } catch (err) {
    console.error("AI Trust Score Error:", err);
    return { score: 75, reason: "Failed to generate trust score." };
  }
}
