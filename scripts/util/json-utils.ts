export function extractAndParseJson<T>(
  content: string,
  expectedType: 'array' | 'object',
  context: string
): T {
  if (!content) {
    throw new Error('No response content from OpenAI');
  }

  let jsonMatch: RegExpMatchArray | null = null;

  if (expectedType === 'array') {
    // Try to extract JSON array from the response
    jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      // If no array found, try to find any JSON object and wrap it
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try {
          const obj = JSON.parse(objMatch[0]);
          return [obj] as T;
        } catch (e) {
          throw new Error('Could not parse single object');
        }
      }
      throw new Error('Could not extract JSON array from response');
    }
  } else {
    // Extract JSON object from the response
    jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not extract JSON object from response');
    }
  }

  try {
    const result = JSON.parse(jsonMatch[0]);
    return result;
  } catch (parseError) {
    console.error('JSON parsing error:', parseError);
    console.error('Raw content:', content);
    console.error('Extracted JSON string:', jsonMatch[0]);
    const errorMessage =
      parseError instanceof Error
        ? parseError.message
        : 'Unknown parsing error';
    throw new Error(
      `Failed to parse JSON response for ${context}: ${errorMessage}`
    );
  }
}

export function createJsonPrompt(
  systemMessage: string,
  userMessage: string,
  temperature: number = 0.1
) {
  return {
    model: 'gpt-4o' as const,
    messages: [
      {
        role: 'system' as const,
        content: systemMessage,
      },
      {
        role: 'user' as const,
        content: userMessage,
      },
    ],
    temperature,
    max_tokens: 4000,
  };
}
